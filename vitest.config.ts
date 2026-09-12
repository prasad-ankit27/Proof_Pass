import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 10 * 60 * 1000,   // 10 min — ZK proofs are slow
    hookTimeout: 15 * 60 * 1000,   // 15 min for beforeAll wallet sync
    include: ['src/test/**/*.test.ts'],
    singleFork: true,              // CRITICAL: never run tests in parallel
    fileParallelism: false,
  },
});
