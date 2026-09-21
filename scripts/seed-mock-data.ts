/**
 * Mock data generator for ProofPass testing and local verification
 */
import { computeNullifierHash, hashMajorCode } from '../src/crypto/nullifier.js';

export interface MockStudent {
  id: string;
  name: string;
  gpa: number;
  gradYear: number;
  major: string;
  secret: Uint8Array;
}

export const mockStudents: MockStudent[] = [
  {
    id: 'STU-001',
    name: 'Alice Smith',
    gpa: 3.85,
    gradYear: 2026,
    major: 'CS',
    secret: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]),
  },
  {
    id: 'STU-002',
    name: 'Bob Jones',
    gpa: 2.95,
    gradYear: 2025,
    major: 'MATH',
    secret: new Uint8Array([21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36]),
  },
  {
    id: 'STU-003',
    name: 'Charlie Brown',
    gpa: 3.40,
    gradYear: 2027,
    major: 'PHYS',
    secret: new Uint8Array([41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56]),
  },
];

export function printMockDataSummary() {
  console.log('=== ProofPass Mock Students ===');
  for (const s of mockStudents) {
    const nullifier = computeNullifierHash(s.secret);
    const majorHash = hashMajorCode(s.major);
    console.log(`Student ${s.name} (${s.id}):`);
    console.log(`  GPA: ${s.gpa}, Year: ${s.gradYear}, Major: ${s.major}`);
    console.log(`  Nullifier Prefix: ${Buffer.from(nullifier).subarray(0, 8).toString('hex')}...`);
    console.log(`  Major Hash Prefix: ${Buffer.from(majorHash).subarray(0, 8).toString('hex')}...`);
  }
}

if (process.argv[1]?.endsWith('seed-mock-data.ts')) {
  printMockDataSummary();
}
