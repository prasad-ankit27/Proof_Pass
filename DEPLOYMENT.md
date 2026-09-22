# ProofPass Deployment Guide

This document describes how to deploy and configure ProofPass on local networks and the Midnight Preproduction testnet.

## 1. Local Network Deployment

1. Start Midnight local docker stack:
   ```bash
   docker compose up -d
   ```
2. Fund test wallet:
   ```bash
   yarn tsx scripts/wait-for-dust.ts
   ```
3. Run test deployment:
   ```bash
   yarn test
   ```

## 2. Midnight Preprod Deployment

1. Set up `.env.preprod`:
   ```bash
   cp .env.preprod.example .env.preprod
   ```
2. Fill in wallet seed phrase and endpoints:
   ```env
   WALLET_SEED=your 24 word mnemonic phrase ...
   INDEXER_HTTP=https://indexer.preprod.midnight.network/api/v1/graphql
   INDEXER_WS=wss://indexer.preprod.midnight.network/api/v1/graphql/ws
   NODE_URL=https://rpc.preprod.midnight.network
   PROOF_SERVER_URL=http://127.0.0.1:6300
   ```
3. Run the deployment script:
   ```bash
   yarn tsx scripts/deploy-preprod.ts
   ```
4. Copy the deployed contract address to `frontend/.env.preprod`:
   ```env
   VITE_CONTRACT_ADDRESS=<deployed-contract-address>
   ```
5. Deploy frontend:
   ```bash
   cd frontend
   yarn build
   ```
