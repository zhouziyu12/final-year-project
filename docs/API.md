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
- for new registrations, the backend uses `staticCall` to predict the model ID, then sends the transaction and returns immediately

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

Primary SDK write endpoint. It can auto-register a model if needed and then writes a provenance event through `ModelProvenanceTracker`.

Key request fields:

- `modelId` or `modelName`
- `chain`
- `action`
- `sender`
- `versionTag`
- `commit`
- `modelHash`
- `ipfsHash`
- `metadataCid`
- `trainingMetadata`

Notes:

- if `modelName` is provided and there is no valid mapping, the backend attempts auto-registration
- `action` must be one of the backend-supported actions
- invalid model IDs, missing models, and invalid object payloads are rejected

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

- `ModelAccessControl`
- `ModelRegistry`
- `ModelProvenanceTracker`
- `ModelAuditLog`
- `ModelNFT`
- `ModelStaking`
- `Verifier`
- `RealZKBridge`

Current deployment addresses are stored in `address_v2_multi.json`.
