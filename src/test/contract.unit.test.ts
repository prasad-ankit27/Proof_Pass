import { describe, it, expect } from 'vitest';
import { pureCircuits, Contract } from '../../contracts/index.js';
import * as compactRuntime from '@midnight-ntwrk/compact-runtime';

describe('ProofPass Contract — Unit Tests', () => {
  describe('Pure Circuits & Crypto', () => {
    it('generates consistent admin public key from secret key', () => {
      const sk = new Uint8Array(32).fill(7);
      const pk1 = pureCircuits.admin_public_key(sk);
      const pk2 = pureCircuits.admin_public_key(sk);

      expect(pk1).toBeInstanceOf(Uint8Array);
      expect(pk1.length).toBe(32);
      expect(Buffer.from(pk1).toString('hex')).toEqual(Buffer.from(pk2).toString('hex'));
    });

    it('generates different admin public keys for different secret keys', () => {
      const sk1 = new Uint8Array(32).fill(1);
      const sk2 = new Uint8Array(32).fill(2);
      const pk1 = pureCircuits.admin_public_key(sk1);
      const pk2 = pureCircuits.admin_public_key(sk2);

      expect(Buffer.from(pk1).toString('hex')).not.toEqual(Buffer.from(pk2).toString('hex'));
    });

    it('generates deterministic nullifiers from student ID', () => {
      const studentId = new Uint8Array(32).fill(42);
      const nullifier1 = pureCircuits.make_nullifier(studentId);
      const nullifier2 = pureCircuits.make_nullifier(studentId);

      expect(nullifier1).toBeInstanceOf(Uint8Array);
      expect(nullifier1.length).toBe(32);
      expect(Buffer.from(nullifier1).toString('hex')).toEqual(Buffer.from(nullifier2).toString('hex'));
    });

    it('generates different nullifiers for different students', () => {
      const s1 = new Uint8Array(32).fill(10);
      const s2 = new Uint8Array(32).fill(20);
      const n1 = pureCircuits.make_nullifier(s1);
      const n2 = pureCircuits.make_nullifier(s2);

      expect(Buffer.from(n1).toString('hex')).not.toEqual(Buffer.from(n2).toString('hex'));
    });

    it('generates deterministic issuer hash', () => {
      const issuer = new Uint8Array(32).fill(99);
      const h1 = pureCircuits.make_issuer_hash(issuer);
      const h2 = pureCircuits.make_issuer_hash(issuer);

      expect(h1).toBeInstanceOf(Uint8Array);
      expect(h1.length).toBe(32);
      expect(Buffer.from(h1).toString('hex')).toEqual(Buffer.from(h2).toString('hex'));
    });
  });

  describe('Contract Constructor & State Initialization', () => {
    it('instantiates Contract with required witnesses', () => {
      const contract = new Contract({
        student_credentials: () => [{}, {
          cgpa: 85n,
          project_count: 3n,
          has_python: true,
          student_id: new Uint8Array(32),
        }],
        admin_secret: () => [{}, new Uint8Array(32)],
      });

      expect(contract).toBeDefined();
      expect(contract.circuits).toBeDefined();
      expect(contract.circuits.verify_eligibility).toBeDefined();
      expect(contract.circuits.update_requirements).toBeDefined();
    });

    it('fails to instantiate without required witness methods', () => {
      expect(() => {
        new Contract({} as any);
      }).toThrow();
    });

    it('executes initialState synchronously and returns expected state shape', () => {
      const contract = new Contract({
        student_credentials: () => [{}, {}],
        admin_secret: () => [{}, new Uint8Array(32)],
      });

      const constructorContext = compactRuntime.createConstructorContext(
        {},
        '03eb7c0b9f0f2357ccddf04dc0cd630287b5e731f67bf20c23f15eef75dcb076'
      );

      const adminHash = new Uint8Array(32).fill(1);
      const issuerHash = new Uint8Array(32).fill(2);
      const cgpaThreshold = 80n;
      const projectsThreshold = 2n;
      const pythonRequired = true;
      const deadline = 1800000000n;
      const maxClaims = 100n;

      const result = contract.initialState(
        constructorContext,
        adminHash,
        issuerHash,
        cgpaThreshold,
        projectsThreshold,
        pythonRequired,
        deadline,
        maxClaims
      );

      expect(result).toBeDefined();
      expect(result instanceof Promise).toBe(false);
      expect(result.currentContractState).toBeDefined();
      expect(result.currentPrivateState).toBeDefined();
      expect(result.currentZswapLocalState).toBeDefined();

      const decodedZswap = compactRuntime.decodeZswapLocalState(result.currentZswapLocalState);
      expect(decodedZswap).toBeDefined();
    });
  });
});
