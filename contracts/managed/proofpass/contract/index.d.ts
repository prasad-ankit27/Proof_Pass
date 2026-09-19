import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
  student_credentials(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, { cgpa: bigint,
                                                                                    project_count: bigint,
                                                                                    has_python: boolean,
                                                                                    student_id: Uint8Array
                                                                                  }];
  admin_secret(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  verify_eligibility(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  update_requirements(context: __compactRuntime.CircuitContext<PS>,
                      new_cgpa_0: bigint,
                      new_projects_0: bigint,
                      python_req_0: boolean,
                      new_deadline_0: bigint,
                      new_max_0: bigint,
                      active_0: boolean): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  verify_eligibility(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  update_requirements(context: __compactRuntime.CircuitContext<PS>,
                      new_cgpa_0: bigint,
                      new_projects_0: bigint,
                      python_req_0: boolean,
                      new_deadline_0: bigint,
                      new_max_0: bigint,
                      active_0: boolean): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
  admin_public_key(sk_0: Uint8Array): Uint8Array;
  make_nullifier(student_id_0: Uint8Array): Uint8Array;
  make_issuer_hash(issuer_id_0: Uint8Array): Uint8Array;
}

export type Circuits<PS> = {
  verify_eligibility(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  update_requirements(context: __compactRuntime.CircuitContext<PS>,
                      new_cgpa_0: bigint,
                      new_projects_0: bigint,
                      python_req_0: boolean,
                      new_deadline_0: bigint,
                      new_max_0: bigint,
                      active_0: boolean): __compactRuntime.CircuitResults<PS, []>;
  admin_public_key(context: __compactRuntime.CircuitContext<PS>,
                   sk_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  make_nullifier(context: __compactRuntime.CircuitContext<PS>,
                 student_id_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  make_issuer_hash(context: __compactRuntime.CircuitContext<PS>,
                   issuer_id_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
}

export type Ledger = {
  readonly admin: Uint8Array;
  readonly credential_issuer: Uint8Array;
  readonly min_cgpa: bigint;
  readonly min_projects: bigint;
  readonly require_python: boolean;
  readonly deadline: bigint;
  readonly active: boolean;
  readonly max_claims: bigint;
  readonly claim_count: bigint;
  readonly used_nullifiers: {
    isEmpty(): boolean;
    size(): bigint;
    member(elem_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<Uint8Array>
  };
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>,
               admin_hash_0: Uint8Array,
               issuer_hash_0: Uint8Array,
               threshold_cgpa_0: bigint,
               threshold_projects_0: bigint,
               python_required_0: boolean,
               expiry_0: bigint,
               claim_limit_0: bigint): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
export declare const expectedVk: Record<string, string>;
