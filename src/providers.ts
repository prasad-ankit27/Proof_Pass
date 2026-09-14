import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import type { NetworkConfig } from './config.js';

export type ProofPassProviders = {
  privateStateProvider: any;
  publicDataProvider: any;
  zkConfigProvider: any;
  proofProvider: any;
  walletProvider: any;
  midnightProvider: any;
};

export function buildProviders(
  wallet: any,
  zkConfigPath: string,
  config: NetworkConfig,
): ProofPassProviders {
  return {
    privateStateProvider: levelPrivateStateProvider({ 
      db: 'proofpass-level-db',
      privateStoragePasswordProvider: async () => 'proofpass-secure-password-12345',
      accountId: 'proofpass-test-account'
    }),
    publicDataProvider: indexerPublicDataProvider(config.indexer, config.indexerWS),
    zkConfigProvider: new NodeZkConfigProvider(zkConfigPath),
    proofProvider: httpClientProofProvider(config.proofServer),
    walletProvider: wallet,
    midnightProvider: wallet,
  };
}
