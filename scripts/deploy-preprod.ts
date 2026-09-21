/**
 * deploy-preprod.ts — Standalone ProofPass deployer for Preprod / Preview
 *
 * Usage:
 *   cp .env.preprod.example .env.preprod
 *   # edit .env.preprod — set MIDNIGHT_PREPROD_MNEMONIC (or SEED)
 *   npx vite-node scripts/deploy-preprod.ts
 *
 * On success the contract address is printed and written to
 * contracts/deployed-address.txt for future reference.
 */

import { WebSocket } from 'ws';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';
import { FluentWalletBuilder } from '@midnight-ntwrk/testkit-js';
import pino from 'pino';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Polyfill WebSocket for Node.js
// @ts-expect-error
globalThis.WebSocket = WebSocket;

const logger = pino({ level: 'info', transport: { target: 'pino-pretty' } });
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PREPROD = {
  networkId: 'preprod',
  indexer: 'https://indexer.preprod.midnight.network/api/v4/graphql',
  indexerWS: 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws',
  node: 'https://rpc.preprod.midnight.network',
  nodeWS: 'wss://rpc.preprod.midnight.network',
  proofServer: process.env['MIDNIGHT_PROOF_SERVER'] ?? 'http://127.0.0.1:6300',
  faucet: 'https://faucet.preprod.midnight.network/api/drips',
};

const PREVIEW = {
  networkId: 'preview',
  indexer: 'https://indexer.preview.midnight.network/api/v4/graphql',
  indexerWS: 'wss://indexer.preview.midnight.network/api/v4/graphql/ws',
  node: 'https://rpc.preview.midnight.network',
  nodeWS: 'wss://rpc.preview.midnight.network',
  proofServer: process.env['MIDNIGHT_PROOF_SERVER'] ?? 'http://127.0.0.1:6300',
  faucet: 'https://faucet.preview.midnight.network/api/drips',
};

const TARGET = (process.env['MIDNIGHT_NETWORK'] ?? 'preprod') === 'preview' ? PREVIEW : PREPROD;

function loadEnvFile() {
  const envFile = path.resolve(__dirname, '..', '.env.preprod');
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
  const mnemonic = process.env['MIDNIGHT_PREPROD_MNEMONIC']?.trim().replace(/\s+/g, ' ');
  const seed = process.env['MIDNIGHT_PREPROD_SEED']?.trim();
  if (mnemonic) return { kind: 'mnemonic' as const, value: mnemonic };
  if (seed) return { kind: 'seed' as const, value: seed };
  throw new Error('Missing wallet secret. Set MIDNIGHT_PREPROD_MNEMONIC.');
}

async function main() {
  loadEnvFile();
  logger.info(`Deploying ProofPass to ${TARGET.networkId.toUpperCase()}...`);
  setNetworkId(TARGET.networkId as any);

  const secret = resolveSecret();
  const envConfig = {
    walletNetworkId: TARGET.networkId as any,
    networkId: TARGET.networkId as any,
    indexer: TARGET.indexer,
    indexerWS: TARGET.indexerWS,
    node: TARGET.node,
    nodeWS: TARGET.nodeWS,
    faucet: TARGET.faucet,
    proofServer: TARGET.proofServer,
  };

  logger.info('Building wallet (this may take a few seconds)...');
  const walletBuilder = FluentWalletBuilder.forEnvironment(envConfig as any);
  if (secret.kind === 'seed') {
    walletBuilder.withSeed(secret.value);
  } else {
    walletBuilder.withMnemonic(secret.value);
  }
  const { seeds } = await walletBuilder.buildWithoutStarting();
  const seedStr = seeds.masterSeed;

  const { MidnightWalletProvider } = await import('@midnight-ntwrk/testkit-js');
  const wallet = await MidnightWalletProvider.build(logger, envConfig as any, seedStr);

  await wallet.start();
  logger.info('Wallet started successfully! Since this is Preprod, we assume you already have DUST (skipping faucet check).');

  const { NodeZkConfigProvider } = await import('@midnight-ntwrk/midnight-js-node-zk-config-provider');
  const { httpClientProofProvider } = await import('@midnight-ntwrk/midnight-js-http-client-proof-provider');
  const { indexerPublicDataProvider } = await import('@midnight-ntwrk/midnight-js-indexer-public-data-provider');
  const { levelPrivateStateProvider } = await import('@midnight-ntwrk/midnight-js-level-private-state-provider');

  const zkConfigPath = path.resolve(__dirname, '..', 'contracts', 'managed', 'proofpass');

  const providers = {
    privateStateProvider: levelPrivateStateProvider({ 
      db: 'proofpass-deploy-db',
      privateStoragePasswordProvider: async () => 'proofpass-secure-password-12345',
      accountId: 'proofpass-deployer',
    }),
    publicDataProvider: indexerPublicDataProvider(TARGET.indexer, TARGET.indexerWS),
    zkConfigProvider: new NodeZkConfigProvider(zkConfigPath),
    proofProvider: httpClientProofProvider(TARGET.proofServer),
    walletProvider: wallet,
    midnightProvider: wallet,
  };

  const { CompiledProofPass, pureCircuits } = await import('../contracts/index.js');

  const adminSk = crypto.randomBytes(32);
  const adminHash = (pureCircuits as any).admin_public_key(new Uint8Array(adminSk));

  const issuerHash = new Uint8Array(32).fill(1);
  const cgpaThreshold = 70n;
  const projectThreshold = 1n;
  const pythonRequired = false;
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60);
  const maxClaims = 1000n;

  logger.info('Deploying contract (generating ZK proof — this takes 3-10 minutes)...');
  const deployed = await deployContract(providers as any, {
    compiledContract: CompiledProofPass,
    privateStateId: 'ProofPassDeployState',
    initialPrivateState: {},
    args: [adminHash, issuerHash, cgpaThreshold, projectThreshold, pythonRequired, deadline, maxClaims],
  });

  const contractAddress = deployed.deployTxData.public.contractAddress;
  logger.info(`\n\nProofPass deployed!\nNetwork: ${TARGET.networkId}\nContract Address: ${contractAddress}\n`);

  const outputPath = path.resolve(__dirname, '..', 'contracts', 'deployed-address.txt');
  const content = [
    `Network:          ${TARGET.networkId}`,
    `Contract Address: ${contractAddress}`,
    `Explorer:         https://${TARGET.networkId}.midnightexplorer.com/contracts/${contractAddress}`,
    `Deployed At:      ${new Date().toISOString()}`,
    `Admin SK (HEX):   ${adminSk.toString('hex')}`,
  ].join('\n');
  fs.writeFileSync(outputPath, content, 'utf8');
  logger.info('Address saved to contracts/deployed-address.txt');

  await wallet.stop();
  process.exit(0);
}

main().catch((err) => { logger.error(err); process.exit(1); });
