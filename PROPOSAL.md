# PROPOSAL.md — Product Idea Submission

**Project Name:** ProofPass  
**Network:** Midnight Network (Preprod Testnet)  
**Contract Address:** `dbb45e8ac051c39ae6cef7edeef391b309d3b0459d475b26af07bd9a3aa11a78`  
**Live Application:** [https://proofpass.netlify.app/](https://proofpass.netlify.app/)  
**GitHub Repository:** [https://github.com/prasad-ankit27/Proof_Pass](https://github.com/prasad-ankit27/Proof_Pass)  
**Author:** Ankit Prasad  

---

## 1. What is the Product, and Who Uses It? (Product & Users)

### 1.1 Product Overview
**ProofPass** is a privacy-first, decentralized skill and academic credential verification application engineered on the **Midnight Network** using the **Compact** smart contract language. ProofPass acts as a Zero-Knowledge (ZK) eligibility passport for students, job applicants, and scholarship candidates. 

In traditional recruitment and university admissions, applicants are forced to over-disclose sensitive personal records: official transcripts, exact Grade Point Averages (GPA/CGPA), complete project portfolios, identity numbers, and personal demographic details. Centralized job boards and recruitment databases aggregate this sensitive data, exposing applicants to data breaches, identity theft, and uncalibrated human bias during preliminary screenings.

ProofPass eliminates this vulnerability by decoupling **proof of qualification** from **disclosure of underlying data**. Using client-side zero-knowledge proofs, applicants prove mathematically that they satisfy an employer's exact criteria (e.g., "CGPA $\ge$ 8.0, completed at least 2 projects, and certified in Python") without disclosing their actual CGPA, transcript, identity, or wallet address to either the employer or the public blockchain.

### 1.2 Target Users & User Personas

| User Persona | Role & Core Workflow | Key Benefit from ProofPass |
| :--- | :--- | :--- |
| **Students & Job Applicants** | Connect browser wallet (1AM / Lace), input academic & skill credentials locally, generate a client-side ZK proof, and submit verification to claim an eligibility slot. | Absolute data privacy; zero exposure of grades, transcripts, or personal identifiers; anti-bias evaluation. |
| **Recruiters & Hiring Managers** | Deploy or configure eligibility campaigns with specific criteria thresholds (`min_cgpa`, `min_projects`, `requires_python`, `deadline`, `max_claims`), monitor verified candidates in real-time, and update campaign parameters securely. | Guaranteed cryptographic qualification of applicants; zero custody liability for sensitive applicant records; fraud prevention via on-chain nullifiers. |
| **Credential Issuers & Universities** | Issue cryptographic attestation hashes (`credential_issuer`) linked to verifiable applicant certificates. | Trustless credential verification without maintaining high-maintenance, vulnerable public query APIs. |

---

## 2. Why Midnight Specifically?

The Midnight Network offers architectural and cryptographic primitives uniquely suited for confidential credential verification that cannot be realized on conventional transparent blockchains:

### 2.1 Selective Disclosure & Dual-State Ledger Model
Transparent public blockchains (such as Ethereum, Cardano, or Solana) operate on public global state. Any function argument submitted to a public contract is immediately observable by validators and indexers. 
- On transparent chains, proving `cgpa >= 8.0` requires either revealing the applicant's CGPA or relying on complex, off-chain, centralized oracle networks.
- **Midnight's dual-state paradigm** natively partitions data into **public ledger state** (campaign rules, deadlines, aggregate applicant count) and **private witness state** (student CGPA, project count, unique student ID). Calculations over private witnesses occur entirely off-chain in ZK circuits, disclosing only the mathematical validity of the assertion to the public ledger.

### 2.2 Client-Side Proving via Compact & WebAssembly
Midnight's Compact toolchain compiles zero-knowledge circuits into WebAssembly (WASM) and Zero-Knowledge Intermediate Representation (ZKIR). This allows the entire proof generation pipeline to run directly within the applicant's web browser using the Midnight proof server / WASM runtime. The applicant's raw credentials never touch an external server, backend database, or network packet.

### 2.3 On-Chain Anonymous Nullifier Set (Sybil & Replay Protection)
A critical challenge in zero-knowledge credential verification is preventing double-claiming: what stops an eligible student from submitting 100 applications to monopolize an interview quota?
- On Midnight, ProofPass implements an on-chain **Nullifier Set** (`Set<Bytes<32>>`).
- The circuit deterministically computes an anonymous nullifier:  
  $$\text{nullifier} = \text{persistentHash}([\text{"proofpass:nullifier:v1"}, \text{student\_id}])$$
- The smart contract verifies that `nullifier` is not present in the ledger's set, registers the nullifier, and increments the verification counter.
- Because the nullifier uses a one-way cryptographic hash with domain separation, the applicant's real `student_id` cannot be reversed or linked across campaigns, achieving complete anonymity with strict single-use integrity.

### 2.4 Zero-Knowledge Admin Authorization
Campaign administrators (recruiters) update eligibility parameters without disclosing their secret keys on-chain. Using Midnight's `admin_secret()` witness and the `admin_public_key` pure circuit, the recruiter proves authority in zero knowledge against an on-chain hash commitment (`admin = persistentHash(["proofpass:admin:v1", sk])`).

---

## 3. Data Model

The ProofPass data model is defined in `contracts/proofpass.compact` and coordinates public on-chain state, private witnesses, and pure circuit cryptographic helpers.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Midnight Network Ledger                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  PUBLIC LEDGER STATE                                                        │
│  ├── admin: Bytes<32>              (Admin public hash commitment)           │
│  ├── credential_issuer: Bytes<32>  (Issuing body identifier hash)           │
│  ├── min_cgpa: Uint<32>            (Scaled integer threshold, e.g. 80)      │
│  ├── min_projects: Uint<32>        (Minimum project count threshold)        │
│  ├── requires_python: Boolean      (Python requirement toggle)              │
│  ├── deadline: Uint<64>            (Unix timestamp cutoff)                  │
│  ├── is_active: Boolean            (Campaign active/paused state)           │
│  ├── max_claims: Uint<32>          (Maximum allowable applicants)           │
│  ├── total_verified: Uint<32>      (Cumulative verified count)              │
│  └── nullifiers: Set<Bytes<32>>    (On-chain nullifier set for replay prev) │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Verified by ZK Proof
┌──────────────────────────────────────┴──────────────────────────────────────┐
│                    Student Client / Local Browser Environment               │
├─────────────────────────────────────────────────────────────────────────────┤
│  PRIVATE WITNESSES (Never leave user's device)                              │
│  struct StudentCredentials {                                                │
│      cgpa: Uint<32>,          // e.g., 85 (representing 8.5 CGPA)           │
│      project_count: Uint<32>, // e.g., 4 completed projects                 │
│      has_python: Boolean,     // e.g., true                                 │
│      student_id: Bytes<32>    // Private unique identifier                  │
│  }                                                                          │
│  witness admin_secret(): Bytes<32>  // Recruiter private authentication key │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Public Ledger State Specifications

| State Variable | Type | Visibility | Purpose |
| :--- | :--- | :--- | :--- |
| `admin` | `Bytes<32>` | Public Ledger | Domain-separated hash commitment of the recruiter's authorization key (`proofpass:admin:v1`). |
| `credential_issuer` | `Bytes<32>` | Public Ledger | Hash identifier of the authorized credential issuing institution. |
| `min_cgpa` | `Uint<32>` | Public Ledger | Minimum qualifying CGPA, scaled by a factor of 10 (e.g., 8.0 CGPA = `80`). |
| `min_projects` | `Uint<32>` | Public Ledger | Minimum number of verified technical projects required. |
| `requires_python` | `Boolean` | Public Ledger | Flag indicating whether Python language proficiency is required. |
| `deadline` | `Uint<64>` | Public Ledger | Epoch millisecond / second timestamp after which applications close. |
| `is_active` | `Boolean` | Public Ledger | Administrative circuit kill-switch / pause flag. |
| `max_claims` | `Uint<32>` | Public Ledger | Maximum number of candidate verifications accepted before closing. |
| `total_verified` | `Uint<32>` | Public Ledger | Counter of verified eligible candidates. |
| `nullifiers` | `Set<Bytes<32>>` | Public Ledger | Persistent cryptographic set preventing duplicate proof submissions by the same student. |

### 3.2 Private Witness Model

```compact
struct StudentCredentials {
    cgpa: Uint<32>,          // Scaled CGPA value (e.g. 8.47 -> 84)
    project_count: Uint<32>, // Exact number of completed projects
    has_python: Boolean,     // Specific skill proficiency flag
    student_id: Bytes<32>    // Unique student identifier
}

witness student_credentials(): StudentCredentials;
witness admin_secret(): Bytes<32>;
```

### 3.3 Core Circuits & Logic Execution

1. **`constructor(...)`**:
   - Initializes contract state with recruiter-defined thresholds (`min_cgpa`, `min_projects`, `requires_python`, `deadline`, `max_claims`), issuer hash, and admin commitment.
   - Sets `is_active = true` and `total_verified = 0`.

2. **`verify_eligibility(): []` (Student Execution Circuit)**:
   - **Public pre-condition assertions:** Checks that `is_active` is true, the current block time is prior to `deadline` (`blockTimeLt(deadline)`), and `total_verified < max_claims`.
   - **Private credential evaluation:** Asserts `creds.cgpa >= min_cgpa`, `creds.project_count >= min_projects`, and `(!requires_python || creds.has_python)`.
   - **Anti-replay nullifier insertion:** Computes `nul = make_nullifier(creds.student_id)`, checks `!nullifiers.member(disclose(nul))`, inserts `nul` into `nullifiers`, and increments `total_verified`.

3. **`update_requirements(...)` (Admin Management Circuit)**:
   - Proves knowledge of private witness `admin_secret()` such that `admin_public_key(admin_secret()) == admin`.
   - Updates requirements, deadlines, caps, or pause status in public ledger state.

4. **Pure Utility Circuits**:
   - `admin_public_key(sk: Bytes<32>): Bytes<32>`: `persistentHash(["proofpass:admin:v1", sk])`.
   - `make_nullifier(student_id: Bytes<32>): Bytes<32>`: `persistentHash(["proofpass:nullifier:v1", student_id])`.
   - `make_issuer_hash(issuer_id: Bytes<32>): Bytes<32>`: `persistentHash(["proofpass:issuer:v1", issuer_id])`.

---

## 4. Scope Feasibility (Scope & Feasibility)

### 4.1 Hackathon Milestones & Implementation Status (Levels 1–4 Completed)
ProofPass has completed all progression stages of the **New Moon to Full: Monthly Moonshots on Midnight** builder journey:

- **Level 1: Setup & First Contract (Completed)**  
  Environment initialized, Compact toolchain configured, and `proofpass.compact` authored and compiled to WASM and ZKIR intermediate representations.
- **Level 2: Frontend Integration (Completed)**  
  Built a cyber-dark, responsive UI using React 19, TypeScript, and Vite. Integrated `@midnight-ntwrk/dapp-connector-api` for seamless connection with the **1AM wallet** extension.
- **Level 3: Production-Grade dApp & Testing (Completed)**  
  Implemented 6 comprehensive integration tests covering successful verification, CGPA boundary rejections, skill mismatches, project count failures, and double-claim nullifier prevention. Automated test suite runs on GitHub Actions CI.
- **Level 4: Live Preprod Deployment & Demonstration (Completed)**  
  Deployed to the **Midnight Preprod Testnet**, published the production frontend on Netlify CDN, recorded a video demonstration, and open-sourced all code and documentation.

### 4.2 Verified Test Coverage Matrix

| Test Scenario | Input Criteria | Expected Circuit Outcome | Status |
| :--- | :--- | :--- | :--- |
| **Contract Initialization** | Thresholds: CGPA $\ge$ 8.0, 2+ projects, Python required | State correctly instantiated on ledger | Passed ✅ |
| **Eligible Student Verification** | Student: 8.5 CGPA, 4 projects, has Python | ZK proof succeeds, counter increments, nullifier recorded | Passed ✅ |
| **Below Threshold CGPA** | Student: 6.5 CGPA (< 8.0 threshold) | Circuit assertion failure; no on-chain state mutated | Passed ✅ |
| **Missing Required Skill** | Student: 8.5 CGPA, 4 projects, lacks Python | Circuit assertion failure triggered | Passed ✅ |
| **Insufficient Project Count** | Student: 1 project (< 2 threshold) | Circuit assertion failure triggered | Passed ✅ |
| **Sybil Double-Claim Rejection** | Student submits second proof with same `student_id` | Nullifier set check fails; transaction reverted | Passed ✅ |

### 4.3 Technical Feasibility & Performance Metrics
- **Client-Side Proof Latency:** Scaled integer arithmetic (`Uint<32>`) and optimized hashing (`persistentHash`) keep ZK proof generation under 4–8 seconds on standard consumer laptop browsers.
- **Ledger Storage Efficiency:** The on-chain footprint is limited to a single 32-byte nullifier per approved candidate, guaranteeing sustainable ledger scaling.
- **Zero Custody Liability:** Because recruiters never hold raw student transcripts or ID numbers, the system eliminates compliance liabilities under privacy regulations such as GDPR and CCPA.

### 4.4 Mainnet Feasibility & Future Roadmap
1. **Decentralized Identifier (DID) & W3C Verifiable Credential Integration:** In future iterations, credential issuer attestations will transition from single issuer hashes to W3C-compliant Verifiable Credentials with selective disclosure Merkle trees.
2. **Dynamic Multi-Skill Bitmasks:** Expand single-skill flags to 64-bit skill matrices, allowing recruiters to assert arbitrary boolean combinations of technical competencies (e.g., Rust AND Docker OR Kubernetes).
3. **Multi-Tenant Recruiter Platform:** Enable recruiter organizations to deploy and manage self-sovereign qualification campaigns dynamically from a unified portal interface.
