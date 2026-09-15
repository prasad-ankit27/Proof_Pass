import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WebSocket } from 'ws';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { deployContract, submitCallTx, type DeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import type { ContractAddress } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { type EnvironmentConfiguration, waitForFunds, FluentWalletBuilder } from '@midnight-ntwrk/testkit-js';
import pino from 'pino';
import crypto from 'crypto';
import { getConfig } from '../config.js';
import { buildProviders, type ProofPassProviders } from '../providers.js';
import { CompiledProofPass, Contract, ledger, pureCircuits, zkConfigPath } from '../../contracts/index.js';

// @ts-expect-error
globalThis.WebSocket = WebSocket;

const ALICE_SEED = '0000000000000000000000000000000000000000000000000000000000000001';
const PRIVATE_STATE_ID = 'ProofPassState';
const logger = pino({ level: 'info', transport: { target: 'pino-pretty' } });
const network = process.env['MIDNIGHT_NETWORK'] ?? 'local';

import fs from 'fs';
import path from 'path';

function loadEnvFile() {
  const envFile = path.resolve(process.cwd(), '.env.preprod');
  if (fs.existsSync(envFile)) {
    const lines = fs.readFileSync(envFile, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx < 0) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

function resolveSecret() {
  if (network === 'local') return { kind: 'seed' as const, value: ALICE_SEED };
  loadEnvFile();
  const upper = network.toUpperCase();
  const mnemonic = process.env[`MIDNIGHT_${upper}_MNEMONIC`]?.trim().replace(/\s+/g, ' ');
  const seed = process.env[`MIDNIGHT_${upper}_SEED`]?.trim();
  if (mnemonic && seed) throw new Error('Set only one of mnemonic or seed.');
  if (mnemonic) return { kind: 'mnemonic' as const, value: mnemonic };
  if (seed) return { kind: 'seed' as const, value: seed };
  throw new Error(`Set MIDNIGHT_${upper}_MNEMONIC or MIDNIGHT_${upper}_SEED`);
}

describe(`ProofPass — Private Skill Passport (${network})`, () => {
  let wallet: any;
  let providers: ProofPassProviders;
  let contractAddress: ContractAddress;
  let adminSk: Uint8Array;
  let adminHash: Uint8Array;

  // Contract config: CGPA >= 80 (8.0), 2+ projects, Python required
  const CGPA_THRESHOLD = 80n;  // 8.0 × 10
  const PROJECT_THRESHOLD = 2n;
  const PYTHON_REQUIRED = true;

  const config = getConfig();
  const secret = resolveSecret();
  const isRemote = config.faucet !== '';

  async function queryLedger(p: ProofPassProviders) {
    const state = await p.publicDataProvider.queryContractState(contractAddress);
    expect(state).not.toBeNull();
    return ledger(state!.data);
  }

  beforeAll(async () => {
    setNetworkId(config.networkId as any);
    const envConfig: EnvironmentConfiguration = {
      walletNetworkId: config.networkId as any,
      networkId: config.networkId as any,
      indexer: config.indexer,
      indexerWS: config.indexerWS,
      node: config.node,
      nodeWS: config.nodeWS,
      faucet: config.faucet,
      proofServer: config.proofServer,
    };

    let seedStr: string;
    if (secret.kind === 'mnemonic') {
      const { createRequire } = await import('module');
      const require = createRequire(import.meta.url);
      const { WalletSeeds } = require(path.resolve(process.cwd(), 'node_modules', '@midnight-ntwrk', 'testkit-js', 'dist', 'wallet', 'wallet-seed.js'));
      seedStr = WalletSeeds.fromMnemonic(secret.value).masterSeed;
    } else {
      seedStr = secret.value;
    }

    const { MidnightWalletProvider } = await import('@midnight-ntwrk/testkit-js');
    wallet = await MidnightWalletProvider.build(logger, envConfig as any, seedStr);

    await wallet.start?.();

    if (isRemote) {
      logger.info(`Assuming wallet is funded since it's a remote network.`);
    }

    providers = buildProviders(wallet, zkConfigPath, config);

    adminSk = new Uint8Array(crypto.randomBytes(32));
    adminHash =
      typeof (pureCircuits as any)?.admin_public_key === 'function'
        ? (pureCircuits as any).admin_public_key(adminSk)
        : new Uint8Array(crypto.randomBytes(32));

    logger.info('Setup complete — ready to run tests');
  });

  afterAll(async () => {
    if (wallet) await wallet.stop?.();
  });

  // ── TEST 1: Deploy the contract ──────────────────────────────────────────
  it('deploys the ProofPass contract with internship requirements', async () => {
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60); // 30 days
    const issuerHash = new Uint8Array(32).fill(1); // placeholder issuer

    const deployed: DeployedContract<Contract> = await deployContract<Contract>(providers, {
      compiledContract: CompiledProofPass,
      privateStateId: PRIVATE_STATE_ID,
      initialPrivateState: {},
      args: [adminHash, issuerHash, CGPA_THRESHOLD, PROJECT_THRESHOLD, PYTHON_REQUIRED, deadline, 100n],
    });

    contractAddress = deployed.deployTxData.public.contractAddress;
    logger.info(`ProofPass deployed at: ${contractAddress}`);
    expect(contractAddress).toBeDefined();

    const state = await queryLedger(providers);
    expect(state.min_cgpa).toEqual(CGPA_THRESHOLD);
    expect(state.min_projects).toEqual(PROJECT_THRESHOLD);
    expect(state.requires_python).toBe(PYTHON_REQUIRED);
    expect(state.is_active).toBe(true);
    expect(state.total_verified).toEqual(0n);
  });

  // ── TEST 2: Valid student passes eligibility check ───────────────────────
  it('accepts a student with CGPA 8.5, 4 projects, and Python skill', async () => {
    const studentId = new Uint8Array(crypto.randomBytes(32));

    await submitCallTx<Contract>(providers, { contractAddress } as any, {
      circuitId: 'verify_eligibility',
      witnesses: {
        student_credentials: () => ({
          cgpa: 85n,          // 8.5 — above threshold of 8.0
          project_count: 4n,  // 4 projects — above threshold of 2
          has_python: true,   // Python ✓
          student_id: studentId,
        }),
      },
      args: [],
    });

    const state = await queryLedger(providers);
    expect(state.total_verified).toEqual(1n);
    logger.info('✅ Valid student verified — total_verified = 1');
  });

  // ── TEST 3: Student below CGPA threshold is rejected ─────────────────────
  it('rejects a student with CGPA below threshold (6.5)', async () => {
    const studentId = new Uint8Array(crypto.randomBytes(32));

    await expect(
      submitCallTx<Contract>(providers, { contractAddress } as any, {
        circuitId: 'verify_eligibility',
        witnesses: {
          student_credentials: () => ({
            cgpa: 65n,          // 6.5 — BELOW threshold of 8.0
            project_count: 5n,
            has_python: true,
            student_id: studentId,
          }),
        },
        args: [],
      }),
    ).rejects.toThrow();

    // Verify total_verified did NOT increment
    const state = await queryLedger(providers);
    expect(state.total_verified).toEqual(1n);
    logger.info('✅ Low CGPA student correctly rejected');
  });

  // ── TEST 4: Student missing Python skill is rejected ─────────────────────
  it('rejects a student without Python when Python is required', async () => {
    const studentId = new Uint8Array(crypto.randomBytes(32));

    await expect(
      submitCallTx<Contract>(providers, { contractAddress } as any, {
        circuitId: 'verify_eligibility',
        witnesses: {
          student_credentials: () => ({
            cgpa: 90n,           // 9.0 — above threshold
            project_count: 3n,   // 3 projects — above threshold
            has_python: false,   // ❌ No Python — should fail
            student_id: studentId,
          }),
        },
        args: [],
      }),
    ).rejects.toThrow();

    logger.info('✅ Student without Python correctly rejected');
  });

  // ── TEST 5: Student with too few projects is rejected ────────────────────
  it('rejects a student with insufficient project count (1 < 2)', async () => {
    const studentId = new Uint8Array(crypto.randomBytes(32));

    await expect(
      submitCallTx<Contract>(providers, { contractAddress } as any, {
        circuitId: 'verify_eligibility',
        witnesses: {
          student_credentials: () => ({
            cgpa: 85n,          // Good CGPA
            project_count: 1n,  // ❌ Only 1 project — below threshold of 2
            has_python: true,
            student_id: studentId,
          }),
        },
        args: [],
      }),
    ).rejects.toThrow();

    logger.info('✅ Student with insufficient projects correctly rejected');
  });

  // ── TEST 6: Nullifier prevents double claiming ────────────────────────────
  it('prevents a student from proving eligibility twice (nullifier)', async () => {
    const studentId = new Uint8Array(crypto.randomBytes(32));

    // First verification — should succeed
    await submitCallTx<Contract>(providers, { contractAddress } as any, {
      circuitId: 'verify_eligibility',
      witnesses: {
        student_credentials: () => ({
          cgpa: 92n,
          project_count: 6n,
          has_python: true,
          student_id: studentId, // same studentId both times
        }),
      },
      args: [],
    });

    // Second verification with same studentId — must fail (nullifier already inserted)
    await expect(
      submitCallTx<Contract>(providers, { contractAddress } as any, {
        circuitId: 'verify_eligibility',
        witnesses: {
          student_credentials: () => ({
            cgpa: 92n,
            project_count: 6n,
            has_python: true,
            student_id: studentId, // SAME student_id → same nullifier → rejected
          }),
        },
        args: [],
      }),
    ).rejects.toThrow();

    logger.info('✅ Double claiming prevented by nullifier');
  });
});
