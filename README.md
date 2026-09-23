# ProofPass

**Privacy-Preserving Skill & Credential Verification on the Midnight Network**

[![Midnight Network](https://img.shields.io/badge/Network-Midnight-blueviolet?style=for-the-badge)](https://midnight.network)
[![Language](https://img.shields.io/badge/Language-Compact-orange?style=for-the-badge)](https://midnight.network)
[![Tested With](https://img.shields.io/badge/Tested%20With-Vitest-yellow?style=for-the-badge)](https://vitest.dev)
[![State](https://img.shields.io/badge/Level-4%20Complete-success?style=for-the-badge)](#)
[![CI](https://github.com/prasad-ankit27/Proof_Pass/actions/workflows/ci.yaml/badge.svg)](https://github.com/prasad-ankit27/Proof_Pass/actions/workflows/ci.yaml)
[![Deploy on Netlify](https://img.shields.io/badge/Deploy-Netlify-00AD9F?style=for-the-badge&logo=netlify&logoColor=white)](https://proofpass.netlify.app/)
[![GitHub](https://img.shields.io/badge/GitHub-prasad--ankit27-181717?style=for-the-badge&logo=github)](https://github.com/prasad-ankit27)

---

## Abstract

ProofPass is a decentralized application (dApp) engineered on the **Midnight Network** utilizing the **Compact** smart contract language. The platform serves as a Zero-Knowledge (ZK) eligibility passport for internships, jobs, and skill certifications. It empowers students to cryptographically prove that they meet stringent academic and technical prerequisites (such as minimum CGPA, completed project count, and specialized programming proficiencies like Python) without ever exposing their raw academic marks, transcript, project portfolio, or personal identity to centralized recruitment portals or the public blockchain ledger.

---

## Table of Contents

1. [Official Submission Links](#official-submission-links)
2. [Architectural Overview](#architectural-overview)
3. [Zero-Knowledge Privacy Model](#zero-knowledge-privacy-model)
4. [System Updates & Feature Highlights](#system-updates--feature-highlights)
5. [Smart Contract Implementation](#smart-contract-implementation)
6. [Hackathon Progression (Levels 1-4)](#hackathon-progression-levels-1-4)
7. [Project Showcase & Verification Proofs](#project-showcase--verification-proofs)
8. [Local Development & Setup Guide](#local-development--setup-guide)
9. [Author & Acknowledgements](#author--acknowledgements)

---

## Official Submission Links

- **Live Application (Netlify):** [https://proofpass.netlify.app/](https://proofpass.netlify.app/)
- **Deployed Contract (Midnight Preprod):** [`dbb45e8ac051c39ae6cef7edeef391b309d3b0459d475b26af07bd9a3aa11a78`](https://preprod.midnightexplorer.com/contracts/dbb45e8ac051c39ae6cef7edeef391b309d3b0459d475b26af07bd9a3aa11a78)
- **Deployment Transaction (1AM Explorer):** [`dc3a8e2f372e88be9104bb212ae8c17322334f8d839cb27b712d9035e82a5b5c`](https://explorer.1am.xyz/tx/dc3a8e2f372e88be9104bb212ae8c17322334f8d839cb27b712d9035e82a5b5c?network=preprod)
- **Demo Video Presentation:** [Watch on Google Drive](https://drive.google.com/file/d/1TZr6_D3N10vfaWdfvIOy57r1wpFZ2OGl/view?usp=sharing)
- **GitHub Repository:** [https://github.com/prasad-ankit27/Proof_Pass](https://github.com/prasad-ankit27/Proof_Pass)

---

## Architectural Overview

ProofPass bridges modern decentralized web infrastructure with cutting-edge Zero-Knowledge cryptography on Midnight Network:

- **Smart Contract Layer:** Written in Compact (`contracts/proofpass.compact`), compiled to WebAssembly (WASM) and Zero-Knowledge Intermediate Representation (ZKIR). Deployed on the Midnight Preprod testnet. Supports multi-condition assertions, anonymous nullifier sets to eliminate double-claiming, and ZK-authenticated admin parameter updates.
- **Frontend Application Layer:** Built with React 19, TypeScript, and Vite. Features a cyber-dark aesthetic with dynamic glassmorphism and client-side WASM proving directly in the user's browser.
- **Wallet Infrastructure:** Integrated with the `@midnight-ntwrk/dapp-connector-api` to interface directly with the **1AM wallet** browser extension for private state management, proof generation, and transaction signing.
- **Testing & CI/CD:** End-to-end testing utilizing Vitest and local Docker-based Midnight network stacks (indexer, proof server, node). Automated CI/CD pipeline via GitHub Actions.

---

## Zero-Knowledge Privacy Model

The core value proposition of ProofPass is absolute data sovereignty and privacy for applicants and students.

### The Traditional Vulnerability
In conventional job portals and scholarship platforms, students must upload unencrypted, sensitive transcripts, grade sheets, and identity documents. These centralized databases frequently suffer security breaches, expose students to unfair recruiting bias, and leak personal identity details.

### The ProofPass ZK Solution
ProofPass replaces raw document submission with trustless mathematical proofs:

1. **Public State (Ledger Data):** The recruiter sets and publishes eligibility thresholds (`min_cgpa`, `min_projects`, `requires_python`, `deadline`, and `max_claims`) to the public Midnight ledger. These values are transparent and verifiable.
2. **Private Witness (User Data):** The student inputs their credentials (exact CGPA, project count, skill flags, and unique `student_id`) locally into their browser. These remain private witnesses and are never broadcast over the network.
3. **Local Proof Generation:** The browser compiles a Zero-Knowledge circuit locally, validating that the student satisfies all constraints (`cgpa >= min_cgpa`, `project_count >= min_projects`, and optional Python requirement).
4. **Anonymous Nullifier Insertion:** The circuit deterministically computes a cryptographic hash `make_nullifier(student_id)`. The nullifier is published to an on-chain set to enforce a strict one-proof-per-student policy without disclosing who the student is.
5. **On-Chain Verification:** Network validators verify the validity of the ZK proof against the public contract state. If valid, the recruiter sees **"Eligible ✅"** and the verification counter increments.

**Observer Matrix:**
- **Visible on-chain:** Recruiter thresholds, deadline, total verified counter, verification acceptance status, and anonymous nullifier hash.
- **Hidden permanently:** Student's actual CGPA, exact number of completed projects, transcript data, student ID, and wallet identity.

---

## System Updates & Feature Highlights

### Architecture & Security Enhancements

- **Domain-Separated Cryptographic Hashes**: Uses domain separators (`proofpass:nullifier:v1`, `proofpass:admin:v1`) to prevent hash collisions across different circuit contexts.
- **Scaled Integer Representation**: Academic CGPA is represented as `Uint<32>` scaled by 10 (e.g., 8.0 is stored as 80), ensuring high precision integer comparison within Compact circuits.
- **Anti-Replay Nullifier Set**: Incorporates an on-chain `Set<Bytes<32>>` preventing students from claiming eligibility repeatedly under the same job/internship posting.
- **ZK Admin Key Derivation**: Recruiters authenticate requirements updates via a private secret key whose hash is stored on-chain, keeping the secret key confidential.
- **Dual Portal User Experience**: Dedicated Student Verification Portal for generating proofs, plus a Recruiter Admin Portal for deploying contracts and monitoring applicant metrics.

### Automated Test Suite (6 Integration Tests)

| Test Case | Scenario Tested | Result |
|-----------|-----------------|--------|
| `Deploys ProofPass contract with recruiter thresholds` | Initializes contract with CGPA ≥ 8.0, 2+ projects, Python required | Passed ✅ |
| `Verifies an eligible student` | Student with 8.5 CGPA, 4 projects, and Python satisfies all criteria | Passed ✅ |
| `Rejects a student with CGPA below threshold` | Student with 6.5 CGPA (< 8.0) fails ZK circuit assertion | Passed ✅ |
| `Rejects a student without Python` | Missing mandatory Python proficiency triggers circuit failure | Passed ✅ |
| `Rejects a student with insufficient project count` | Student with 1 project (< 2 threshold) is rejected | Passed ✅ |
| `Prevents double claiming via nullifier` | Re-submitting proof with the same student ID is blocked by on-chain nullifier | Passed ✅ |

---

## Smart Contract Implementation

The Compact contract (`contracts/proofpass.compact`) guarantees data confidentiality while enforcing recruiter requirements:

```compact
pragma language_version >= 0.22;
import CompactStandardLibrary;

// Public ledger state visible on-chain
export ledger admin: Bytes<32>;
export ledger min_cgpa: Uint<32>;
export ledger min_projects: Uint<32>;
export ledger requires_python: Boolean;
export ledger deadline: Uint<64>;
export ledger is_active: Boolean;
export ledger max_claims: Uint<32>;
export ledger total_verified: Uint<32>;
export ledger nullifiers: Set<Bytes<32>>;

// Private witness data — never leaves student's device
struct StudentCredentials {
    cgpa: Uint<32>,          // Scaled by 10 (e.g. 8.47 -> 84)
    project_count: Uint<32>, // Completed projects
    has_python: Boolean,     // Python proficiency flag
    student_id: Bytes<32>    // Unique student identifier
}

witness student_credentials(): StudentCredentials;

// Core ZK verification circuit
export circuit verify_eligibility(): [] {
    assert(disclose(is_active), "Contract is paused");
    assert(blockTimeLt(disclose(deadline)), "Application deadline has passed");
    assert(disclose(total_verified) < disclose(max_claims), "Maximum verifications reached");

    const creds = student_credentials();

    // Verify requirements without disclosing private values
    assert(creds.cgpa >= min_cgpa, "CGPA below required threshold");
    assert(creds.project_count >= min_projects, "Insufficient project count");
    assert(!disclose(requires_python) || creds.has_python, "Python proficiency required");

    // Nullifier prevents duplicate verification anonymously
    const nul = make_nullifier(creds.student_id);
    assert(!nullifiers.member(disclose(nul)), "Already verified — cannot claim twice");

    nullifiers.insert(disclose(nul));
    total_verified = disclose((total_verified + 1) as Uint<32>);
}
```

---

## Hackathon Progression (Levels 1-4)

This repository fulfills the progression requirements of the **"New Moon to Full" Midnight Builder Journey**:

### Level 1: Setup & First Contract
- **Objective:** Establish the toolchain, design the foundational Compact contract, and verify compilation.
- **Status:** Complete. The `proofpass.compact` contract compiles cleanly into WASM and ZKIR intermediate representations.

### Level 2: Frontend Integration
- **Objective:** Develop a responsive frontend application and establish wallet connectivity with 1AM Wallet.
- **Status:** Complete. Full integration with `@midnight-ntwrk/dapp-connector-api` enabling local proof generation and transaction submission.
- **Deployed Contract Address (Preprod):**  
  [`dbb45e8ac051c39ae6cef7edeef391b309d3b0459d475b26af07bd9a3aa11a78`](https://preprod.midnightexplorer.com/contracts/dbb45e8ac051c39ae6cef7edeef391b309d3b0459d475b26af07bd9a3aa11a78)

### Level 3: Production-Grade dApp
- **Objective:** Implement comprehensive automated testing, CI/CD pipeline, and a polished recruiter/student UI.
- **Status:** Complete. 6 end-to-end integration tests covering all boundary conditions and nullifier replay. Automated GitHub Actions CI workflow runs tests on every commit.

### Level 4: MVP Goes Live
- **Objective:** Deploy frontend to production CDN, verify on Preprod testnet, create demonstration video, and publish documentation.
- **Status:** Complete.
  - **Live Application:** [https://proofpass.netlify.app/](https://proofpass.netlify.app/)
  - **Deployed Contract (Preprod):** [`dbb45e8ac051c39ae6cef7edeef391b309d3b0459d475b26af07bd9a3aa11a78`](https://preprod.midnightexplorer.com/contracts/dbb45e8ac051c39ae6cef7edeef391b309d3b0459d475b26af07bd9a3aa11a78)
  - **Deployment Transaction:** [`dc3a8e2f372e88be9104bb212ae8c17322334f8d839cb27b712d9035e82a5b5c`](https://explorer.1am.xyz/tx/dc3a8e2f372e88be9104bb212ae8c17322334f8d839cb27b712d9035e82a5b5c?network=preprod)
  - **Demo Video Presentation:** [Watch on Google Drive](https://drive.google.com/file/d/1TZr6_D3N10vfaWdfvIOy57r1wpFZ2OGl/view?usp=sharing)
  - **Public Brand Presence:** [GitHub Repository](https://github.com/prasad-ankit27/Proof_Pass)

---

## Project Showcase & Verification Proofs

### 🏠 Landing Page
*Privacy-first hero interface introducing Zero-Knowledge credential proof capabilities.*

<p align="center">
  <img src="./User_interface/Screenshot%202026-09-23%20124216.png" alt="ProofPass Landing Page" width="100%">
</p>

### 🔒 Privacy Comparison — What the Recruiter Actually Sees
*Visualizing what remains private on the student's device versus what is disclosed on-chain.*

<p align="center">
  <img src="./User_interface/Screenshot%202026-09-23%20234925.png" alt="Privacy Showcase" width="100%">
</p>

### 🎓 Student Verification Portal
*Entering private credentials (CGPA, projects, certifications) and generating client-side ZK proof with anonymous nullifier.*

<p align="center">
  <img src="./User_interface/Screenshot%202026-09-23%20234803.png" alt="Student Verification Portal" width="100%">
</p>

### 💼 Recruiter Admin Portal
*Configuring eligibility thresholds, deadline, and deploying smart contract to Midnight Preprod network.*

<p align="center">
  <img src="./User_interface/Screenshot%202026-09-23%20234627.png" alt="Recruiter Admin Setup" width="100%">
</p>

<p align="center">
  <img src="./User_interface/Screenshot%202026-09-23%20234644.png" alt="Recruiter Admin Deployment" width="100%">
</p>

---

## Local Development & Setup Guide

For developers and auditors wishing to verify the Zero-Knowledge circuits and run the application locally, please follow these instructions.

### 1. System Requirements
- **OS:** Windows Subsystem for Linux 2 (WSL2) or native Linux / macOS / Windows.
- **Containerization:** Docker Desktop with compose support.
- **Runtime:** Node.js (v22.0.0 or higher) and Yarn package manager.
- **Compiler:** Compact compiler (`compact` CLI v0.31.0+).

### 2. Dependency Initialization
Clone the repository and install dependencies from the root directory:
```bash
git clone https://github.com/prasad-ankit27/Proof_Pass.git
cd Proof_Pass
yarn install
```

### 3. Smart Contract Compilation
Compile the Compact zero-knowledge circuits into intermediate representation and generate the strictly-typed TypeScript interfaces:
```bash
yarn compile
```
*Note: This generates proving keys, ZKIR artifacts, and TypeScript contract definitions inside `contracts/managed/proofpass/`.*

### 4. Running the Local Midnight Network and Test Suite
To run the automated tests against a local Midnight stack:
```bash
yarn env:up
yarn test:local
```
Once testing is complete, terminate the Docker services:
```bash
yarn env:down
```

### 5. Running the Frontend Application
To run the React frontend locally:
```bash
cd frontend
npm install
npm run dev
```
Navigate to `http://localhost:5173`. Make sure the **1AM wallet** browser extension is installed and connected to the appropriate network (Local or Preprod).

---

## Author & Acknowledgements

**ProofPass** was developed by **Ankit Prasad** as part of the Midnight Network hackathon.

- **GitHub:** [@prasad-ankit27](https://github.com/prasad-ankit27)
- **Repository:** [prasad-ankit27/Proof_Pass](https://github.com/prasad-ankit27/Proof_Pass)

*Special thanks to the Midnight Network team and the developer community for foundational tooling and guidance.*
