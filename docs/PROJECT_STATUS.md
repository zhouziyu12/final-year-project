# Project Status

Updated: 2026-04-15

This document records the validated implementation baseline after the ownership, authentication, lifecycle, and terminology drift cleanup.

## 1. Final System Statement

The repository now presents one consistent primary workflow:

- the Python SDK is the write client
- the backend issues JWTs and relays writes
- the registry stores the real authenticated owner address
- provenance writes are verifier-gated
- the frontend is a presentation and download surface

## 2. Implemented Now

### 2.1 Authentication and Identity

Implemented:

- file-backed backend auth store in `server/data/auth_store.json`
- `POST /api/auth/login`
- `GET /api/auth/me`
- account status, lockout, and token-version checks
- JWT-protected write and lifecycle routes
- ephemeral fallback JWT signing secret when `JWT_SECRET` is unset, with runtime warnings and status visibility

Boundary note:

- the local username/password account store in this repository is a prototype-friendly baseline, not the final production identity stack

Default seeded account:

- username: `researcher`
- password: `researcher-demo-pass`
- wallet: `0x1111111111111111111111111111111111111111`

### 2.2 Ownership and Registry

Implemented:

- `ModelRegistry.registerModelFor(address owner, ...)`
- backend relay uses the authenticated user's bound wallet as the on-chain owner
- owner-scoped model resolution via `GET /api/v2/models/resolve`
- owner-scoped backend index in `model_name_map.json`

Identity rule:

```text
chain + owner + modelName
```

### 2.3 SDK Submission Path

Implemented:

- SDK login and bearer-token session handling
- owner-aware model resolution
- authenticated `POST /api/register`
- authenticated `POST /api/sdk/provenance`
- canonical metadata string as the authoritative write payload
- `statementHash` computation from `canonicalMetadata`
- isolated proof outputs under `.proof_runs/<run-id>/`

### 2.4 Frontend

Implemented:

- read-only status, registry, and audit pages
- authenticated lifecycle lookup and download
- removal of browser registration flow
- removal of `VITE_WRITE_API_KEY` dependency

### 2.5 Lifecycle Access

Implemented:

- `POST /api/v2/lifecycle/query`
- `POST /api/v2/lifecycle/download`

Deprecated:

- `GET /api/v2/lifecycle`
- `GET /api/v2/lifecycle/download`

The deprecated `GET` routes now return `410`.

### 2.6 Terminology Cleanup

Implemented:

- `isActive` replaces list/detail `verified`
- `chainVerified` is used for audit verification results
- `statementHash` is the application term
- `messageHash` is kept only for circuit compatibility

## 3. Deployment Baseline

Deployment metadata was refreshed and written to `address_v2_multi.json`.

### Sepolia

- `ModelAccessControl`: `0x81f11fB35a79ed025d271C1d4e7a27c2227B37F3`
- `ModelRegistry`: `0x487C02203D72b378a69F47daC0957c0c3354C9aC`
- `Groth16Verifier`: `0xE1639d60F78F4Ba37C2D00BCD3612cAfD858af17`
- `ZKProvenanceTracker`: `0xCaE0d0ff07DfC0cdd21e9Ddb2813dA66931bC5cD`
- `ModelAuditLog`: `0x78483775fB4fE3fF6e16b1E0349ac2576fa379a9`

Optional extensions still deployed:
- `ModelProvenanceTracker`: `0x29F7dD3f13cB0AC3AD7Bb30696E5dC54FdA78433`
- `ModelNFT`: `0x0c0fEEe0905Ce3bEf2398F0901cf409BA33d0102`
- `ModelStaking`: `0x9d61cb24661e765b52E7E679e2CD0c8dEeC69D73`

These extension addresses are retained for completeness, but they are not part of the primary paper narrative or authenticated SDK write path.

### tBNB

- `ModelAccessControl`: `0x4FA4C2176750F6FfB8864b8086432C6Cdd1fFFc6`
- `ModelRegistry`: `0x8d32A2dcBDa306c678cab2370F3dafA3E1D46948`
- `Groth16Verifier`: `0x7054577279D496DcF00E37FdBe9a192631e195D4`
- `ZKProvenanceTracker`: `0x947a547ad9da78E12c3F2F4e1197787ADD9Ff61a`
- `ModelAuditLog`: `0x5e502baC7D8379B481c0e2fD8A0c052d8F151959`

Optional extensions still deployed:
- `ModelProvenanceTracker`: `0xFF29f9100d0142e0E3324547Af12a91f173f069E`
- `ModelNFT`: `0x5a802AE610D3F9640446d5511Bc303C8ea5Ffa24`
- `ModelStaking`: `0x4b7ede20bE885E11A57a4F4Af6103bA6c298d337`

These extension addresses are retained for completeness, but they are not part of the primary paper narrative or authenticated SDK write path.

## 4. Validated On This Baseline

Re-run on the validated codebase:

- `npx hardhat compile --show-stack-traces`
- `python tests/test_sdk_backend.py`
- `node tests/test_zk_proof.js`
- `cd client && npm run lint`
- `cd client && npm run build`

Observed outcomes:

- backend auth and SDK integration test suite passed after redeployment
- SDK model resolution succeeded against the new `registerModelFor` deployment
- lifecycle access no longer exposes secrets in the request URL
- proof outputs no longer overwrite each other across concurrent runs

## 5. Baseline Truths

True today:

- model ownership on-chain reflects the authenticated user, not the relay wallet
- the backend write path is JWT-authenticated
- frontend write mode is removed
- the registry list is owner-aware and backend-managed
- the verifier-gated provenance route is the primary SDK write path

Not claimed today:

- that `/api/v2/models` is a complete chain-wide inventory
- that the browser is the normal training submitter
- that bridge contracts are the default provenance route
- that proof blobs are persisted on-chain

## 6. Near-Term Deferred Scope

Still intentionally secondary or deferred:

- upgrading `ModelAuditLog` into the sole authoritative write ledger
- full wallet-signature login instead of local username/password auth
- a browser-based training control plane
- bridge-first multi-chain settlement as the default narrative

The present repo baseline is therefore aligned with the paper-friendly statement:

```text
SDK main path
+ backend relay
+ verifier-gated provenance
+ ownership-preserving registry writes
+ frontend display and download
```
