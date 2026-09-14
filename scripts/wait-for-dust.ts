import { WebSocket } from 'ws';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { FluentWalletBuilder } from '@midnight-ntwrk/testkit-js';

// @ts-expect-error
globalThis.WebSocket = WebSocket;

const config = {
  networkId: 'undeployed',
  indexer: 'http://127.0.0.1:8088/api/v4/graphql',
  indexerWS: 'ws://127.0.0.1:8088/api/v4/graphql/ws',
  node: 'http://127.0.0.1:9944',
  nodeWS: 'ws://127.0.0.1:9944',
  proofServer: 'http://127.0.0.1:6300',
  faucet: '',
};

setNetworkId(config.networkId as any);

const wallet = await FluentWalletBuilder.newWalletFromSeed(
  '0000000000000000000000000000000000000000000000000000000000000001',
  config,
);

console.log('Waiting for DUST...');
let attempts = 0;
while (attempts < 120) {
  try {
    const balance = await wallet.getBalance();
    if (balance > 0n) {
      console.log(`DUST ready: ${balance}`);
      process.exit(0);
    }
  } catch {}
  await new Promise((r) => setTimeout(r, 5000));
  attempts++;
  console.log(`Waiting... attempt ${attempts}/120`);
}
console.error('DUST never arrived. Is Docker running? Run: yarn env:up');
process.exit(1);
