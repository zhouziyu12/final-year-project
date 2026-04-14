# API Reference

## Base URL

Default local address:

```text
http://127.0.0.1:3000
```

## Authentication

All write endpoints require these headers:

- `x-api-key`
- `x-auth-timestamp`
- `x-auth-nonce`

The backend enforces:

- API key validation
- timestamp window validation
- nonce replay protection
- IP-based rate limiting

If `WRITE_API_KEY` is not configured, write endpoints return `503`.

## Scope Note

The current API surface is centered on:

- backend relay
- model registration
- provenance tracking
- lifecycle lookup by secret
- audit reads
- IPFS upload helpers

The default provenance write path is now verifier-gated:

- artifacts are stored on IPFS
- the SDK builds a canonical metadata JSON string
- the backend recomputes `statementHash`
- the backend writes through `ZKProvenanceTracker.addVerifiedRecord(...)`

## Read Endpoints

### `GET /api/health`

Returns service health and startup warnings.

### `GET /api/v2/status`

Returns platform status, including:

- backend status
- `sepolia` and `tbnb` connectivity
- wallet write mode
- known model count
- `zkReady`
- `zkEnforced`
- deployed contract addresses per chain

Legacy compatibility route:

- `GET /api/status`

### `GET /api/v2/models`

Returns the model list.

Optional query parameter:

- `chain=sepolia|tbnb`

Possible model states include:

- `DRAFT`
- `ACTIVE`
- `DEPRECATED`
- `REVOKED`
- `PENDING_REGISTRATION`

`PENDING_REGISTRATION` means the backend has already broadcast a registration transaction and predicted the model ID, but the on-chain read path has not confirmed yet.

Legacy compatibility route:

- `GET /api/models`

### `GET /api/v2/models/:id`

Returns a single model summary.

Parameters:

- path parameter `:id`
- query parameter `chain`

### `GET /api/v2/audit/recent`

Returns recent audit events.

Parameters:

- `chain=sepolia|tbnb`
- `limit=<number>`

### `GET /api/v2/audit/verify/:id`

Verifies the provenance chain for a model and returns:

- `verified`
- `recordCount`
- `latestRecord`

### `GET /api/v2/lifecycle`

Loads the version history for one model series by lifecycle secret.

Required query parameter:

- `secret=<lifecycle-secret>`

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

Current runtime expectation:

- the downloadable artifact is resolved from IPFS
- for older records, the backend may recover `ipfsCid` by reading the on-chain provenance metadata and matching `modelHash` or `versionTag`

### `GET /api/v2/lifecycle/download`

Downloads one model version by lifecycle secret and version hash.

Required query parameters:

- `secret=<lifecycle-secret>`
- `modelHash=<model-hash>`

Behavior:

- the backend resolves the version entry for that model series
- it then fetches the corresponding file from IPFS gateways
- if the version does not resolve to an IPFS CID, the route returns `404`

### `GET /api/ipfs/cat/:cid`

Fetches IPFS content by CID.

## Write Endpoints

### `POST /api/register`

Registers model metadata.

Request body:

```json
{
  "name": "ExampleModel",
  "description": "Demo model",
  "ipfsCid": "optional",
  "checksum": "optional",
  "framework": "PyTorch",
  "license": "MIT",
  "chain": "sepolia"
}
```

Behavior:

- if a same-name model exists and is readable on-chain, the backend returns the existing model ID
- if the local cache is stale, the backend clears the stale mapping first
- for new registrations, the backend uses `staticCall` to predict the model ID, then sends the transaction and waits for confirmation before returning

Typical response:

```json
{
  "success": true,
  "id": "12",
  "numericId": 12,
  "name": "ExampleModel",
  "chain": "sepolia",
  "verified": false,
  "pending": true,
  "txHash": "0x..."
}
```

### `POST /api/sdk/provenance`

Primary SDK write endpoint. It only accepts verifier-gated provenance submissions.

Key request fields:

- `modelId`
- `modelName`
- `chain`
- `canonicalMetadata`
- `zkProof`

Notes:

- the model must already be registered before this route is called
- `canonicalMetadata` must be valid stable JSON and must not contain raw proof fields
- the backend validates `modelName` and `chain` against `canonicalMetadata`
- the backend recomputes `statementHash = keccak256(bytes(canonicalMetadata)) % field`
- `zkProof.publicSignals[1]` must match `modelId`
- `zkProof.publicSignals[2]` must match the recomputed `statementHash`
- if proof validation fails, the route returns an error and does not write on-chain
- successful writes go through `ZKProvenanceTracker.addVerifiedRecord(...)`

Expected top-level request shape:

```json
{
  "modelId": 12,
  "modelName": "ExampleModel",
  "chain": "sepolia",
  "canonicalMetadata": "{\"action\":\"UPDATED\",...}",
  "zkProof": {
    "pA": ["...", "..."],
    "pB": [["...", "..."], ["...", "..."]],
    "pC": ["...", "..."],
    "publicSignals": ["...", "...", "..."]
  }
}
```

### `POST /api/audit`

Triggers an audit verification lookup by model ID.

### `POST /api/ipfs/upload/file`

Uploads binary file content to Pinata.

### `POST /api/ipfs/upload/metadata`

Uploads JSON metadata to Pinata.

## Example Requests

### Health

```bash
curl http://127.0.0.1:3000/api/health
```

### Status

```bash
curl http://127.0.0.1:3000/api/v2/status
```

### List Models on Sepolia

```bash
curl "http://127.0.0.1:3000/api/v2/models?chain=sepolia"
```

### Register a Model

```bash
curl -X POST http://127.0.0.1:3000/api/register \
  -H "Content-Type: application/json" \
  -H "x-api-key: <WRITE_API_KEY>" \
  -H "x-auth-timestamp: <unix-ms>" \
  -H "x-auth-nonce: <random-nonce>" \
  -d "{\"name\":\"ExampleModel\",\"chain\":\"sepolia\"}"
```

### Submit Provenance

```bash
curl -X POST http://127.0.0.1:3000/api/sdk/provenance \
  -H "Content-Type: application/json" \
  -H "x-api-key: <WRITE_API_KEY>" \
  -H "x-auth-timestamp: <unix-ms>" \
  -H "x-auth-nonce: <random-nonce>" \
  -d "{\"modelName\":\"ExampleModel\",\"chain\":\"sepolia\",\"action\":\"UPDATED\",\"sender\":\"0xYourAddress\",\"versionTag\":\"v1.0.0\",\"commit\":\"Initial training\"}"
```

## Contracts Behind the API

Primary runtime-facing contracts:

- `ModelAccessControl`
- `ModelRegistry`
- `Groth16Verifier`
- `ZKProvenanceTracker`
- `ModelAuditLog`
- `ModelNFT`
- `ModelStaking`

Repository-level but not default API-path contracts:

- `Verifier`
- `RealZKBridge`

Current deployment addresses are stored in `address_v2_multi.json`.
