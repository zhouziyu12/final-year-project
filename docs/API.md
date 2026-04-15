# API Reference

## Base URL

Default local address:

```text
http://127.0.0.1:3000
```

## Authentication Model

The public shared write-key flow has been removed from the main path.

Authenticated routes now use:

1. `POST /api/auth/login`
2. `Authorization: Bearer <jwt>`

JWTs represent a backend user that is already bound to one wallet address. The relay uses that bound wallet address as the intended on-chain owner.

The current file-backed local account system is a runnable prototype baseline, not a claim of production-grade identity infrastructure.

## Scope Note

This API is centered on:

- SDK-authenticated model registration
- verifier-gated provenance submission
- backend-managed model indexing
- lifecycle lookup and download by secret
- audit inspection
- IPFS upload helpers

The browser is not the write entry point for model training. The Python SDK is.

## Authentication Endpoints

### `POST /api/auth/login`

Exchange username/password credentials for a JWT.

Request body:

```json
{
  "username": "researcher",
  "password": "researcher-demo-pass"
}
```

Typical response:

```json
{
  "success": true,
  "token": "<jwt>",
  "expiresAt": "2026-04-15T23:06:31.000Z",
  "user": {
    "username": "researcher",
    "walletAddress": "0x1111111111111111111111111111111111111111",
    "role": "researcher"
  }
}
```

### `GET /api/auth/me`

Returns the authenticated session identity.

Headers:

- `Authorization: Bearer <jwt>`

Response:

```json
{
  "success": true,
  "user": {
    "username": "researcher",
    "walletAddress": "0x1111111111111111111111111111111111111111",
    "role": "researcher"
  }
}
```

## Admin User Management

These routes are protected by:

- `Authorization: Bearer <jwt>`
- authenticated user role must be `admin`

Bootstrap note:

- the default seeded account is `researcher`, not `admin`
- create the first admin with `node scripts/create_user.cjs create ... --role admin`
- the default auth store path is `server/data/auth_store.json`

### `GET /api/admin/users`

Returns the current backend user list without password hashes.

### `POST /api/admin/users`

Create a new backend user.

Request body:

```json
{
  "username": "alice",
  "password": "strong-pass",
  "walletAddress": "0x1234567890abcdef1234567890abcdef12345678",
  "role": "researcher"
}
```

Allowed roles:

- `researcher`
- `admin`

### `DELETE /api/admin/users/:username`

Delete one backend user.

Guardrails:

- an admin cannot delete their own active account through the API
- the last remaining admin cannot be deleted through the API

### `PATCH /api/admin/users/:username`

Update one backend user.

Supported fields:

- `password`
- `walletAddress`
- `role`
- `status`

Notes:

- security-relevant changes revoke outstanding JWTs by incrementing the stored token version
- `status` is currently `active` or `disabled`
- the backend keeps at least one active admin account

## Status Endpoints

### `GET /api/health`

Returns service health and startup warnings.

Important field:

- `jwtSecretMode`
  - `configured` when `JWT_SECRET` is explicitly set
  - `ephemeral` when the backend had to generate a per-process fallback secret

### `GET /api/v2/status`

Returns runtime status, including:

- backend health per chain
- deployed contract addresses
- `zkReady`
- `zkEnforced`
- `authMode`
- `authStoreMode`
- `jwtSecretMode`
- `authLockoutPolicy`
- `inventoryMode`
- `inventoryScope`
- `relayMode`
- total indexed model count

Important fields:

- `authMode`
  Always `jwt` for the current main path.

- `authStoreMode`
  `stateful-file-store` for the current local account implementation.

- `jwtSecretMode`
  - `configured` means the backend is using an explicit persistent JWT signing secret
  - `ephemeral` means the backend auto-generated a temporary per-process secret because `JWT_SECRET` was missing
  - demos and shared presentation environments should report `configured`

- `relayMode`
  - `relay-enabled` when `PRIVATE_KEY` is configured
  - `read-only` when the relay wallet is unavailable

Legacy compatibility route:

- `GET /api/status`

## Model Endpoints

### `GET /api/v2/models`

Returns model summaries from the backend-managed owner-scoped index.

Optional query parameters:

- `chain=sepolia|tbnb`

Notes:

- this is not advertised as a full chain inventory
- records come from the backend index plus live chain reads
- `isActive` replaces the older ambiguous `verified` field

Model response shape:

```json
{
  "success": true,
  "inventoryMode": "backend-index",
  "inventoryScope": "owner-scoped-known-models",
  "isCompleteInventory": false,
  "models": [
    {
      "id": "1",
      "numericId": 1,
      "name": "ExampleModel",
      "description": "Indexed by the backend-managed registry cache.",
      "chain": "sepolia",
      "owner": "0x1111111111111111111111111111111111111111",
      "status": "ACTIVE",
      "isActive": true,
      "staked": false
    }
  ]
}
```

Legacy compatibility route:

- `GET /api/models`

The `staked` field is preserved as an optional extension flag. It should not be treated as part of the main thesis write path.

### `GET /api/v2/models/:id`

Returns a single model summary.

Parameters:

- path parameter `:id`
- query parameter `chain`

### `GET /api/v2/models/resolve`

Resolve a model by owner scope.

Required query parameters:

- `chain`
- `owner`
- `name`

Example:

```text
/api/v2/models/resolve?chain=sepolia&owner=0x1111111111111111111111111111111111111111&name=ExampleModel
```

This is the preferred read helper for the SDK.

Typical response metadata:

- `resolutionMode: owner-scoped-backend-index`

### `POST /api/register`

Register a model through the backend relay.

Headers:

- `Authorization: Bearer <jwt>`

Request body:

```json
{
  "name": "ExampleModel",
  "description": "Demo model",
  "ipfsCid": "",
  "checksum": "",
  "framework": "PyTorch",
  "license": "MIT",
  "chain": "sepolia"
}
```

Behavior:

- the owner is taken from the authenticated user's bound wallet
- the backend relay calls `ModelRegistry.registerModelFor(owner, ...)`
- the backend stores the mapping in the owner-scoped index
- same-name models are allowed across different owners
- the uniqueness key is effectively `chain + owner + modelName`

Typical response:

```json
{
  "success": true,
  "id": "12",
  "numericId": 12,
  "name": "ExampleModel",
  "description": "Demo model",
  "chain": "sepolia",
  "owner": "0x1111111111111111111111111111111111111111",
  "isActive": false,
  "pending": true,
  "txHash": "0x..."
}
```

## Provenance Endpoint

### `POST /api/sdk/provenance`

Primary SDK write endpoint. This route only accepts verifier-gated submissions.

Headers:

- `Authorization: Bearer <jwt>`

Required top-level fields:

- `modelId`
- `modelName`
- `chain`
- `canonicalMetadata`
- `zkProof`

`canonicalMetadata` must be a JSON string that contains:

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

Important rules:

- `canonicalMetadata.modelName` must match the top-level `modelName`
- `canonicalMetadata.chain` must match the top-level `chain`
- proof fields are forbidden inside `canonicalMetadata` and inside `trainingMetadata`
- the backend recomputes `statementHash = keccak256(canonicalMetadata) % field`
- `zkProof.publicSignals[1]` must match `modelId`
- `zkProof.publicSignals[2]` must match the recomputed `statementHash`
- the authenticated user must own the target model on-chain

Example request:

```json
{
  "modelId": 12,
  "modelName": "ExampleModel",
  "chain": "sepolia",
  "canonicalMetadata": "{\"action\":\"UPDATED\",\"artifactCid\":\"QmArtifact\",\"chain\":\"sepolia\",\"commit\":\"Fine-tuned on dataset X\",\"modelHash\":\"0xabc\",\"modelName\":\"ExampleModel\",\"sender\":\"sdk:researcher\",\"submittedAt\":\"2026-04-15T00:00:00Z\",\"trainingMetadata\":{\"framework\":\"PyTorch\",\"epochs\":3},\"versionTag\":\"v1.0.0\"}",
  "zkProof": {
    "pA": ["1", "2"],
    "pB": [["3", "4"], ["5", "6"]],
    "pC": ["7", "8"],
    "publicSignals": ["9", "12", "10"]
  }
}
```

Typical success response:

```json
{
  "success": true,
  "tx": "0x...",
  "modelId": 12,
  "eventType": 2,
  "owner": "0x1111111111111111111111111111111111111111",
  "statementHash": "123456789",
  "nullifier": "987654321",
  "proofVerified": true
}
```

## Audit Endpoints

### `GET /api/v2/audit/recent`

Returns recent audit events.

Optional query parameters:

- `chain=sepolia|tbnb`
- `limit=<number>`

### `GET /api/v2/audit/verify/:id`

Returns provenance verification status for one model.

Key fields:

- `chainVerified`
- `recordCount`
- `latestRecord`

### `POST /api/audit`

Convenience verification endpoint with a JSON body.

Request body:

```json
{
  "modelId": 12,
  "chain": "sepolia"
}
```

This route is effectively a lookup helper even though it uses `POST`.

## Lifecycle Endpoints

Lifecycle lookup and download are now authenticated `POST` endpoints so secrets do not appear in URLs.

### `POST /api/v2/lifecycle/query`

Headers:

- `Authorization: Bearer <jwt>`

Request body:

```json
{
  "secret": "<lifecycle-secret>"
}
```

Response highlights:

- `series`
- `storageMode`
- `createdAt`
- `versions[]`

Each version entry may include:

- `version`
- `modelId`
- `modelHash`
- `chain`
- `ipfsCid`
- `txHash`
- `downloadReady`
- `downloadSource`

### `POST /api/v2/lifecycle/download`

Headers:

- `Authorization: Bearer <jwt>`

Request body:

```json
{
  "secret": "<lifecycle-secret>",
  "modelHash": "<model-hash>"
}
```

Behavior:

- resolves the matching version for the provided secret
- fetches the artifact from IPFS
- returns `application/octet-stream`

Deprecated routes:

- `GET /api/v2/lifecycle` returns `410`
- `GET /api/v2/lifecycle/download` returns `410`

## IPFS Endpoints

### `POST /api/ipfs/upload/file`

Headers:

- `Authorization: Bearer <jwt>`

Request body:

```json
{
  "data": "<base64-binary>",
  "fileName": "weights.bin"
}
```

### `POST /api/ipfs/upload/metadata`

Headers:

- `Authorization: Bearer <jwt>`

Request body:

```json
{
  "metadata": {
    "modelName": "ExampleModel"
  }
}
```

### `GET /api/ipfs/cat/:cid`

Fetches IPFS content and returns it as base64.

## Example Flow

### 1. Login

```bash
curl -X POST http://127.0.0.1:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"researcher\",\"password\":\"researcher-demo-pass\"}"
```

### 2. Register Through the Relay

```bash
curl -X POST http://127.0.0.1:3000/api/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt>" \
  -d "{\"name\":\"ExampleModel\",\"chain\":\"sepolia\"}"
```

### 3. Query Lifecycle Without Leaking the Secret in the URL

```bash
curl -X POST http://127.0.0.1:3000/api/v2/lifecycle/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt>" \
  -d "{\"secret\":\"<lifecycle-secret>\"}"
```

## Contracts Behind the API

Primary runtime-facing contracts:

- `ModelAccessControl`
- `ModelRegistry`
- `Groth16Verifier`
- `ZKProvenanceTracker`
- `ModelAuditLog`

Optional extensions retained in the repository:

- `ModelProvenanceTracker`
- `ModelNFT`
- `ModelStaking`
- `Verifier`
- `RealZKBridge`

These modules may still appear in deployment metadata or helper scripts, but they are not the primary authenticated SDK write path and should not be presented as the thesis main workflow.

Current deployment addresses are stored in `address_v2_multi.json`.
