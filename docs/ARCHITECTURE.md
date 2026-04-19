# Architecture

This document describes the final repository-aligned architecture baseline as of 2026-04-15.

## 1. Architecture Summary

The project is now organized around a clear separation of roles:

- Python SDK
  Submission client for training-time writes.

- Backend relay
  Auth issuer, owner-aware registry relay, verifier-gated provenance writer, lifecycle service, and chain reader.

- Frontend
  Read-only presentation surface plus authenticated lifecycle lookup and download.

- Contracts
  Access control, registry, verifier-gated provenance, audit, and optional extension logic.

The old public write-key browser flow is no longer the main path.

## 2. Primary Write Sequence

The end-to-end runtime is:

1. A local training script produces a model artifact.
2. The SDK logs in with `POST /api/auth/login`.
3. The backend returns a JWT bound to one stored user and one wallet address.
4. The SDK computes the artifact hash.
5. The SDK resolves the target model by `chain + owner + modelName`.
6. If the model does not exist, the SDK calls `POST /api/register`.
7. The backend relay executes `ModelRegistry.registerModelFor(owner, ...)`.
8. The SDK uploads the artifact to IPFS.
9. The SDK constructs `canonicalMetadata`.
10. The SDK computes `statementHash = keccak256(canonicalMetadata) % snark_field`.
11. The prover writes a dedicated run directory under `.proof_runs/<run-id>/`.
12. The SDK submits `canonicalMetadata + zkProof` to `POST /api/sdk/provenance`.
13. The backend recomputes `statementHash`, validates ownership, verifies the proof, and calls `ZKProvenanceTracker.addVerifiedRecord(...)`.
14. The frontend later reads status, registry entries, audit results, and lifecycle downloads from backend APIs.

## 3. Ownership Semantics

The ownership drift is intentionally fixed by contract and relay changes.

### 3.1 Contract

`ModelRegistry` now exposes:

- `registerModel(...)`
- `registerModelFor(address owner, ...)`

The relay uses `registerModelFor(...)`, so the stored chain owner is the authenticated user's bound wallet address instead of the relay wallet.

### 3.2 Backend

The backend stores users in a file-backed auth store at `server/data/auth_store.json` by default.

Each user record includes:

- `username`
- password hash
- `walletAddress`
- `role`
- `status`
- token/session version metadata
- lockout and login timestamps

Write routes trust the JWT session and use `req.auth.walletAddress` as the submitter identity.

### 3.3 SDK

The SDK no longer treats model names as globally unique. The lookup key is:

```text
chain + owner + modelName
```

This means:

- same-name models from different owners do not collide
- one owner can resolve their own model deterministically

## 4. Backend Index Semantics

`/api/v2/models` is backed by a backend-managed index plus live contract reads.

That index is stored in `model_name_map.json` and is now versioned and owner-scoped:

```json
{
  "version": 2,
  "chains": {
    "sepolia": {
      "owners": {
        "0x...owner": {
          "examplemodel": {
            "id": 1,
            "name": "ExampleModel",
            "owner": "0x...owner"
          }
        }
      }
    }
  }
}
```

Important consequence:

- `/api/v2/models` is useful and live
- it is not claimed to be a complete on-chain inventory service

## 5. ZK and Provenance Semantics

### 5.1 Canonical Metadata

The application-level provenance payload is centered on `canonicalMetadata`, not on ad hoc top-level write fields.

Required fields include:

- `action`
- `artifactCid`
- `chain`
- `commit`
- `modelHash`
- `modelName`
- `sender`
- `submittedAt`
- `trainingMetadata`
- `versionTag`

`trainingMetadata` is still a nested business metadata object, but proof material is forbidden inside it.

### 5.2 Statement Hash vs Message Hash

The runtime terminology is:

- `statementHash`
  Application term used by the SDK and backend.

- `messageHash`
  Circuit compatibility field name still used by the witness/prover.

In practice:

- the SDK computes `statementHash` from `canonicalMetadata`
- the prover receives that value in the witness slot named `messageHash`
- the backend recomputes `statementHash` and checks it against `zkProof.publicSignals[2]`

### 5.3 Proof Artifacts

Proof files are no longer written to one shared repository root location.

Each submission generates a dedicated directory such as:

```text
.proof_runs/20260415T190632-4f3a9d2e/
  last_proof_input.json
  proof.json
  public.json
  proof_calldata_debug.txt
```

This prevents concurrent SDK runs from overwriting each other.

### 5.4 On-Chain Write Target

The main provenance write path is verifier-gated:

- contract: `ZKProvenanceTracker`
- verifier: `Groth16Verifier`

`ModelProvenanceTracker` still exists in the repository and is still used by some read/audit helpers, but it is not the primary story for authenticated SDK submissions.

`ModelNFT`, `ModelStaking`, and `RealZKBridge` are also retained as optional extensions. They are not surfaced as the default frontend workflow and they are not part of the main thesis write-path claim.

## 6. Frontend Role

The frontend no longer:

- registers models directly
- depends on `VITE_WRITE_API_KEY`
- acts as a public write demo

The frontend now:

- shows health and system readiness
- displays registry records returned by `/api/v2/models`
- shows audit verification results
- allows authenticated lifecycle lookup and download

The UI is therefore aligned with the real system boundary:

- SDK writes
- backend relays
- frontend presents and downloads

## 7. Lifecycle Service

Lifecycle access was changed specifically to remove secret leakage from URLs.

Old shape:

- `GET /api/v2/lifecycle?secret=...`
- `GET /api/v2/lifecycle/download?secret=...&modelHash=...`

Final route shape:

- `POST /api/v2/lifecycle/query`
- `POST /api/v2/lifecycle/download`

Both now accept a JSON body and require a JWT.

## 8. Status and Audit Vocabulary

The API vocabulary is intentionally split:

- registry/list/detail endpoints use `isActive`
- audit verification endpoints use `chainVerified`

The older generic `verified` field is no longer the recommended wording for the final UI or API docs.

## 9. Deployment Baseline

Deployment metadata was refreshed on 2026-04-15 and written to `address_v2_multi.json`.

Primary write-path contracts:

- Sepolia
  - `ModelRegistry`: `0x487C02203D72b378a69F47daC0957c0c3354C9aC`
  - `Groth16Verifier`: `0xE1639d60F78F4Ba37C2D00BCD3612cAfD858af17`
  - `ZKProvenanceTracker`: `0xCaE0d0ff07DfC0cdd21e9Ddb2813dA66931bC5cD`

- tBNB
  - `ModelRegistry`: `0x8d32A2dcBDa306c678cab2370F3dafA3E1D46948`
  - `Groth16Verifier`: `0x7054577279D496DcF00E37FdBe9a192631e195D4`
  - `ZKProvenanceTracker`: `0x947a547ad9da78E12c3F2F4e1197787ADD9Ff61a`

## 10. Not the Primary Path

The following are still present in the repository, but they are not the main authenticated application flow:

- frontend registration by public API key
- lifecycle secrets in URL query strings
- bridge-first provenance narrative
- flat global `modelName -> id` cache semantics
- embedding proof fields inside `trainingMetadata`

That scope reduction is intentional. The repository now tells one consistent story:

```text
SDK main write path
-> backend JWT auth
-> owner-aware relay
-> verifier-gated provenance
-> frontend presentation and download
```
