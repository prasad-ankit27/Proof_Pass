import { createHash } from 'node:crypto';

/**
 * Computes a pseudo-nullifier hash for local testing and witness preparation.
 * Note: Midnight ZKIR uses Poseidon or Rescue-Prime hashes inside the circuit.
 */
export function computeNullifierHash(studentSecret: Uint8Array, contextScope: string = 'proofpass-v1'): Uint8Array {
  const hash = createHash('sha256');
  hash.update(studentSecret);
  hash.update(Buffer.from(contextScope, 'utf8'));
  return new Uint8Array(hash.digest());
}

/**
 * Computes major code hash for eligibility check
 */
export function hashMajorCode(majorCode: string): Uint8Array {
  const hash = createHash('sha256');
  hash.update(Buffer.from(majorCode.trim().toUpperCase(), 'utf8'));
  return new Uint8Array(hash.digest());
}
