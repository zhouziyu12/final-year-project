# AI Model Provenance System

An SDK-first prototype for AI model registration, verifier-gated provenance, lifecycle tracking, audit inspection, and authenticated model download across Sepolia and BSC testnet.

## Current Primary Path

The real write path in this repository is now:

1. A user trains locally and uses the Python SDK.
2. The SDK logs in with a backend account and receives a JWT.
3. The SDK resolves a model by the tuple `chain + owner + modelName`.
4. If the model is missing, the backend relay calls `ModelRegistry.registerModelFor(owner, ...)`.
5. The SDK uploads the artifact to IPFS and builds `canonicalMetadata`.
6. The SDK derives `statementHash = keccak256(canonicalMetadata) % snark_field`.
7. The prover writes proof artifacts into an isolated `.proof_runs/<run-id>/` directory.
8. The SDK submits `canonicalMetadata + zkProof` to the backend.
9. The backend recomputes `statementHash`, validates the proof, and writes through `ZKProvenanceTracker.addVerifiedRecord(...)`.

The browser is no longer a public write console. The frontend is used to:

- inspect health, chain status, registry records, and audits
- sign in for lifecycle lookup and download
- present the authenticated SDK workflow during demos

## User Management

Backend users are stored in the file-backed auth store at `server/data/auth_store.json` by default.

This local username/password store is the current runnable prototype baseline. It should not be described as the final production authentication architecture.

Default seeded account:

- username: `researcher`
- password: `researcher-demo-pass`

You can create additional local users with:

```bash
node scripts/create_user.cjs create --username alice --password strong-pass --wallet 0xYourWallet --role researcher
```

If you want to use the admin API next, bootstrap an admin account first:

```bash
node scripts/create_user.cjs create --username admin --password change-me --wallet 0xYourWallet --role admin
```

Useful helpers:

```bash
npm run user:list
npm run user:delete -- --username alice
```

Protected admin routes:

- `GET /api/admin/users`
- `POST /api/admin/users`
- `PATCH /api/admin/users/:username`
- `DELETE /api/admin/users/:username`

## Runtime Roles

- `sdk/python/`
  Main submission client. Handles login, artifact hashing, owner-scoped model resolution, IPFS upload, proof generation, and provenance submission.

- `server/`
  JWT auth issuer, backend relay, owner-scoped model index, lifecycle query/download service, and contract integration layer.

- `client/`
  Presentation and inspection UI. No `VITE_WRITE_API_KEY` write mode remains.

- `contracts/`
  Primary runtime contracts plus optional extension contracts retained in the repository.

## Deployments Updated On 2026-04-15

Primary write-path contracts were redeployed and synced to `address_v2_multi.json`.

- Sepolia
  - `ModelRegistry`: `0x487C02203D72b378a69F47daC0957c0c3354C9aC`
  - `Groth16Verifier`: `0xE1639d60F78F4Ba37C2D00BCD3612cAfD858af17`
  - `ZKProvenanceTracker`: `0xCaE0d0ff07DfC0cdd21e9Ddb2813dA66931bC5cD`

- tBNB
  - `ModelRegistry`: `0x8d32A2dcBDa306c678cab2370F3dafA3E1D46948`
  - `Groth16Verifier`: `0x7054577279D496DcF00E37FdBe9a192631e195D4`
  - `ZKProvenanceTracker`: `0x947a547ad9da78E12c3F2F4e1197787ADD9Ff61a`

The full contract set for both chains is recorded in [address_v2_multi.json](./address_v2_multi.json).

## Quick Start

### 1. Install Dependencies

```bash
npm install
cd client && npm install
cd ..
```

### 2. Configure Environment

Copy `.env.example` to `.env` and set at least:

- `PRIVATE_KEY`
- `JWT_SECRET`
- `PINATA_API_KEY`
- `PINATA_SECRET`

Optional:

- `SEPOLIA_URL`
- `BNB_TESTNET_URL`
- `VITE_API_URL`
- `SDK_USERNAME`
- `SDK_PASSWORD`
- `AUTH_USER_STORE_FILE`
- `AUTH_LOCKOUT_THRESHOLD`
- `AUTH_LOCKOUT_DURATION_SECONDS`

Notes:

- If `PRIVATE_KEY` is missing, the backend stays in read-only relay mode.
- Generate `JWT_SECRET` with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
- If `JWT_SECRET` is omitted, the backend now generates an ephemeral per-process secret and reports `jwtSecretMode: ephemeral` in health/status. That is acceptable for throwaway local sessions, but not for demos, shared environments, or any setup where sessions must survive a restart.
- On first backend boot, `server/data/auth_store.json` is seeded automatically with:
  - username: `researcher`
  - password: `researcher-demo-pass`
  - wallet: `0x1111111111111111111111111111111111111111`

### 3. Compile Contracts

```bash
npx hardhat compile --show-stack-traces
```

### 4. Start the Backend

```bash
node server/server.js
```

Default API address: `http://127.0.0.1:3000`

### 5. Start the Frontend

```bash
cd client
npm run dev
```

### 6. Use the SDK for Writes

The frontend does not register or submit models. Training-time writes should go through the Python SDK.

Typical SDK login inputs:

- `username`
- `password`
- `base_url`

See [docs/API.md](./docs/API.md) and [docs/ZK_GUIDE.md](./docs/ZK_GUIDE.md) for the exact request contract.

## Verified On 2026-04-15

These commands were re-run against the current code and current deployment metadata:

```bash
npx hardhat compile --show-stack-traces
node tests/test_zk_proof.js
python tests/test_sdk_backend.py
cd client && npm run lint
cd client && npm run build
```

Additional validation:

- `registerModelFor(owner, ...)` now assigns the authenticated user's wallet as on-chain owner
- lifecycle secret lookup and downloads use authenticated `POST` routes
- proof artifacts are isolated per SDK run under `.proof_runs/`

## Main API Surface

Public reads:

- `GET /api/health`
- `GET /api/v2/status`
- `GET /api/v2/models`
- `GET /api/v2/models/:id`
- `GET /api/v2/models/resolve`
- `GET /api/v2/audit/recent`
- `GET /api/v2/audit/verify/:id`
- `GET /api/ipfs/cat/:cid`

Authenticated routes:

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/admin/users`
- `POST /api/admin/users`
- `PATCH /api/admin/users/:username`
- `DELETE /api/admin/users/:username`
- `POST /api/register`
- `POST /api/sdk/provenance`
- `POST /api/v2/lifecycle/query`
- `POST /api/v2/lifecycle/download`
- `POST /api/audit`
- `POST /api/ipfs/upload/file`
- `POST /api/ipfs/upload/metadata`

Deprecated lifecycle URLs:

- `GET /api/v2/lifecycle` returns `410`
- `GET /api/v2/lifecycle/download` returns `410`

## Important Terminology

- `canonicalMetadata`
  The exact JSON string anchored through the verifier-gated provenance path.

- `statementHash`
  Application term for `keccak256(canonicalMetadata) % snark_field`.

- `messageHash`
  Circuit compatibility label only. The witness still uses this field name, but the application path now talks about `statementHash`.

- `/api/v2/models`
  A backend-managed owner-scoped index, not a claim of full chain inventory.

- `isActive`
  Registry list/detail status flag. Replaces the older ambiguous `verified` wording.

- `chainVerified`
  Audit verification result returned by audit endpoints.

- optional extensions
  `ModelProvenanceTracker`, `ModelNFT`, `ModelStaking`, and `RealZKBridge` remain in the repository, but they are not the primary authenticated write path.

## Repository Structure

```text
ai-project/
  client/                  React frontend
  contracts/               Solidity contracts
  docs/                    Architecture and API documentation
  model_name_map.json      Owner-scoped backend model index
  sdk/python/              Python SDK and secret manager
  server/                  Express backend and file-backed auth store
  tests/                   Integration and regression tests
  zk/                      Circom circuit and proving assets
  address_v2_multi.json    Multi-chain deployment addresses
```

## Documentation

- [docs/PROJECT_STATUS.md](./docs/PROJECT_STATUS.md)
- [docs/CURRENT_ARCHITECTURE.md](./docs/CURRENT_ARCHITECTURE.md)
- [docs/API.md](./docs/API.md)
- [docs/ZK_GUIDE.md](./docs/ZK_GUIDE.md)
- [docs/DEPLOY_GUIDE.md](./docs/DEPLOY_GUIDE.md)
- [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)
- [docs/USER_MANUAL.md](./docs/USER_MANUAL.md)
- [docs/openapi.yml](./docs/openapi.yml)
- [client/README.md](./client/README.md)

## License

MIT
