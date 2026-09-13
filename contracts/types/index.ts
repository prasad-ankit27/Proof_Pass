/**
 * Type definitions for ProofPass Compact Contract
 */

export interface CredentialRequirements {
  minGpa: bigint;
  minGradYear: bigint;
  requiredMajorHash: Uint8Array;
}

export interface StudentWitness {
  studentSecret: Uint8Array;
  gpa: bigint;
  gradYear: bigint;
  majorHash: Uint8Array;
}

export interface VerificationResult {
  nullifier: Uint8Array;
  isEligible: boolean;
  timestamp: bigint;
}
