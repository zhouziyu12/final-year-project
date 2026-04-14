# Project Status Baseline

This document records the current, code-verified state of the project as of 2026-04-14.

Its purpose is to distinguish:

- what is already implemented
- what is only partially implemented
- what is described in docs or reports but not fully realized in the current codebase
- what appears stale or inconsistent

This file should be treated as the current source of truth for project-scoping discussions until the rest of the documentation is synchronized.

## 1. Implemented Today

### 1.1 Smart Contract Layer

The repository contains and compiles the following contract sources:

- `ModelAccessControl.sol`
- `ModelRegistry.sol`
- `ProvenanceTracker.sol` (`ModelProvenanceTracker`)
- `ModelAuditLog.sol`
- `ModelNFT.sol`
- `ModelStaking.sol`
- `RealZKBridge.sol`
- `Verifier.sol`

The currently recorded deployed addresses in `address_v2_multi.json` cover these active deployment targets:

- `ModelAccessControl`
- `ModelRegistry`
- `ModelProvenanceTracker`
- `ModelAuditLog`
- `ModelNFT`
- `ModelStaking`

The active deployment file currently targets:

- Sepolia
- BNB Testnet (`tbnb`)

### 1.2 Backend Service

The backend in `server/server.js` is implemented and acts as the main orchestration layer.

Implemented backend capabilities include:

- health and status endpoints
- model list and model detail read endpoints
- audit verification endpoints
- recent audit event querying
- protected write routes using API key + timestamp + nonce
- replay protection with persisted nonce state
- IP-based write rate limiting
- optional read-only startup mode when `PRIVATE_KEY` is absent
- Pinata-backed file and metadata upload endpoints
- model registration relay
- SDK provenance relay

### 1.3 Frontend Application

The React frontend in `client/` is implemented as a demo and inspection interface.

Implemented UI sections:

- `Overview`
- `Training`
- `Registry`
- `Audit`
- `System`
- `NFT`

What the frontend currently does well:

- reads backend health, status, model, and audit data
- shows registry inventory and per-model detail
- displays current backend write posture
- supports local demo registration if `VITE_WRITE_API_KEY` is configured
- presents the training pipeline as an explanatory workflow

### 1.4 Python SDK and Local Training Flow

The Python SDK in `sdk/python/provenance_sdk.py` is implemented and is currently the main route for end-to-end provenance submission.

Implemented SDK behavior:

- hash a local model file
- resolve or auto-register a model through the backend
- generate a local ZK proof by calling `test_zk_standalone.js`
- upload files or metadata to IPFS when Pinata credentials exist
- submit a provenance record to the backend relay

Implemented training-side scripts:

- `train1.py`
- `train2.py`

These scripts currently represent the main documented local training entry points.

### 1.5 ZK Tooling

The repository contains a working local proof-generation flow:

- circuit source in `zk/circuit.circom`
- witness/proof artifacts in the repo
- local standalone generator/verifier in `test_zk_standalone.js`

The current implementation successfully supports local proof generation and local proof verification.

### 1.6 Tests and Support Scripts

The repository includes:

- contract smoke/integration scripts
- zk proof tests
- SDK/backend integration tests
- a PowerShell test runner

Main active test entry points:

- `scripts/test_contracts.cjs`
- `test_zk_standalone.js`
- `tests/test_sdk_backend.py`
- `tests/run_all_tests.ps1`

## 2. Partially Implemented

### 2.1 ZK-Provenance Integration

ZK proof generation is implemented locally in the SDK flow.

However, the current backend submission path does not fully enforce or settle the proof through the bridge contracts. In practice:

- the SDK generates the proof
- proof-related data is included in metadata
- the backend submits provenance mainly through the normal tracker record path

So the project currently has:

- local ZK proof generation: implemented
- local ZK proof verification: implemented
- full end-to-end bridge-backed ZK settlement in the default app flow: not fully wired

### 2.2 Audit Story vs Audit Write Path

The project exposes audit read functionality and includes a dedicated `ModelAuditLog` contract.

But the backend currently emphasizes reading audit information more than writing to the dedicated audit contract in the main application flow. This means the audit narrative is stronger than the current write-side integration.

### 2.3 NFT and Staking Features

The repo includes contract support for NFT and staking features.

Current state:

- contracts exist
- deployment addresses exist for NFT and staking
- basic script-level interactions exist
- frontend NFT page is mostly presentational
- the app does not currently expose a complete user-facing NFT or staking workflow

### 2.4 Cross-Chain System Story

The project clearly aims to present a cross-chain provenance architecture.

Current code-verified state:

- active deployments are recorded on Sepolia and tBNB
- bridge-related contracts exist in source
- the default end-to-end runtime path is verifier-gated backend orchestration plus tracked chain state, while the fully trustless bridge workflow remains a separate architectural path

## 3. Not Fully Implemented or Not Verified in Current Mainline

The following should not currently be described as fully implemented without qualification:

- a production-complete trustless cross-chain bridge workflow
- end-to-end on-chain enforcement of all ZK verification steps in the default SDK/backend path
- a full user-facing NFT issuance and management workflow
- a full user-facing staking workflow
- automatic chain-wide model discovery independent of local cache/mapping files
- dynamic backend verification of ZK readiness at runtime

## 4. Confirmed Drift and Inconsistency

### 4.1 Documentation Drift

The current repository contains multiple descriptions of the system that do not fully match each other.

Observed drift includes:

- `README.md`
- `docs/`
- `FYP Interim Report.pdf`
- deployment scripts
- CI workflow

Examples:

- some materials describe a broader or more complete cross-chain story than the current runtime path supports
- some materials reference system behavior that has since changed
- some materials emphasize chains or flow variants that are not the active code path today

### 4.2 Script Drift

The following files appear outdated or mismatched with the current main interfaces:

- `train_v2_incremental.py`
- `query_lifecycle.py`
- `client/scripts_extract_abi.js`
- `create-dashboard.js`

Specific confirmed issues:

- `train_v2_incremental.py` does not appear to match the current `ProvenanceSDK.submit_provenance(...)` signature
- `query_lifecycle.py` appears written for an older plaintext secret storage structure, while the current secret manager stores encrypted payloads

### 4.3 CI Drift

The GitHub Actions workflow appears partially out of sync with the current repo layout and active commands.

Examples include:

- path assumptions that do not match the current folder structure
- dependency assumptions that do not match current lockfile placement
- stale or mismatched test entry expectations

## 5. Current Real System Flow

The most accurate current system description is:

1. A local training script produces a model artifact.
2. The Python SDK hashes the model.
3. The SDK ensures a model is registered through the backend.
4. The SDK generates a local ZK proof.
5. The SDK uploads model data or metadata to IPFS when configured.
6. The SDK submits provenance metadata to the backend.
7. The backend relays the write to chain-facing contract calls.
8. The frontend reads status, registry, and audit views back from the backend.

This means the practical center of gravity is:

- local Python tooling for creation
- backend relay for controlled writes
- frontend dashboard for visibility

## 6. Recommended Wording for Academic Writing

Safe wording:

- "The current prototype implements model registration, verifier-gated provenance tracking, protected backend relay, local ZK proof generation, IPFS-backed metadata handling, and a frontend audit dashboard."
- "Default provenance submissions are enforced through the verifier-gated backend and `ZKProvenanceTracker`, while cross-chain bridge-oriented settlement remains a separate architectural capability."
- "NFT and staking support are implemented at contract level, with limited integration at the application layer."

Wording to avoid without qualification:

- "The system fully achieves trustless end-to-end cross-chain settlement."
- "The frontend provides complete NFT and staking operations."

## 7. Immediate Cleanup Priorities

The highest-value next steps are:

1. synchronize README and docs with the current prototype
2. fix or retire stale scripts
3. align CI with current commands and folder layout
4. decide whether bridge/ZK claims in the paper should be presented as implemented, partially implemented, or future work
