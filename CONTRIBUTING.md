# Contributing to ProofPass

Thank you for your interest in contributing to ProofPass!

## Development Setup

1. Clone repository:
   ```bash
   git clone https://github.com/prasad-ankit27/Proof_Pass.git
   cd Proof_Pass
   ```

2. Install dependencies:
   ```bash
   yarn install
   cd frontend && yarn install
   ```

3. Run local Midnight network:
   ```bash
   docker compose up -d
   ```

4. Run unit and integration tests:
   ```bash
   yarn test
   ```

5. Run frontend:
   ```bash
   cd frontend && yarn dev
   ```

## Commit Guidelines

We follow Conventional Commits:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation updates
- `test:` Unit and integration tests
- `chore:` Maintenance and tooling updates
- `perf:` Performance improvements
