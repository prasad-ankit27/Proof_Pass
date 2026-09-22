/**
 * Quick-start validation script to check local environment readiness
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

function checkFile(path: string, label: string): boolean {
  const exists = existsSync(resolve(process.cwd(), path));
  console.log(`[${exists ? '✓' : '✗'}] ${label}: ${path}`);
  return exists;
}

console.log('=== ProofPass Environment Validation ===\n');

const checks = [
  checkFile('contracts/proofpass.compact', 'Compact Contract Source'),
  checkFile('contracts/managed/proofpass/contract/index.js', 'Compiled Contract Bindings'),
  checkFile('frontend/public/managed/keys/verify_eligibility.prover', 'Prover Key Asset'),
  checkFile('frontend/src/lib/midnight.ts', 'Frontend Midnight SDK Integration'),
  checkFile('compose.yml', 'Docker Compose Infrastructure'),
  checkFile('src/config.ts', 'Network Configuration'),
];

const allPassed = checks.every(Boolean);
console.log(`\nOverall Status: ${allPassed ? 'ALL CHECKS PASSED' : 'SOME CHECKS MISSING'}`);

if (!allPassed) {
  process.exit(1);
}
