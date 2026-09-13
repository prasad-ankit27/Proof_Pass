import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export {
  Contract,
  ledger,
  pureCircuits,
  type Ledger,
  type ImpureCircuits,
  type PureCircuits,
} from './managed/proofpass/contract/index.js';
import { Contract } from './managed/proofpass/contract/index.js';

const currentDir = path.resolve(fileURLToPath(import.meta.url), '..');
export const zkConfigPath = path.resolve(currentDir, 'managed', 'proofpass');

export const CompiledProofPass = CompiledContract.make('ProofPass', Contract).pipe(
  CompiledContract.withVacantWitnesses,
  CompiledContract.withCompiledFileAssets(zkConfigPath),
);
