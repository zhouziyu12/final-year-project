# API Reference

## Base URL

Local development:

```text
http://127.0.0.1:3000
```

## REST Endpoints

### Health

`GET /api/health`

Returns a basic service health response.

### Status

`GET /api/v2/status`

Returns backend and blockchain status information.

Legacy compatibility:

`GET /api/status`

### Models

`GET /api/v2/models`

Returns the current model list.

`GET /api/v2/models/:id`

Returns details for a single model.

Legacy compatibility:

`GET /api/models`

### Audit

`GET /api/v2/audit/recent`

Returns recent audit entries.

`GET /api/v2/audit/verify/:id`

Verifies the audit chain up to a specific entry.

`POST /api/audit`

Creates an audit-related record through the backend flow.

### Provenance Submission

`POST /api/sdk/provenance`

This endpoint is used by the Python SDK.

Expected body fields include:

- `modelId`
- `action`
- `sender`
- `versionTag`
- `commit`
- `ipfsHash`
- `trainingMetadata`

Supported actions are mapped by the backend. Invalid actions are rejected instead of silently downgraded.

### Registration

`POST /api/register`

Registers a model through the backend orchestration flow.

### IPFS

`POST /api/ipfs/upload/file`

Uploads file content to IPFS through Pinata.

`POST /api/ipfs/upload/metadata`

Uploads metadata JSON to IPFS through Pinata.

`GET /api/ipfs/cat/:cid`

Fetches IPFS content by CID.

## Example Requests

### Health

```bash
curl http://127.0.0.1:3000/api/health
```

### Status

```bash
curl http://127.0.0.1:3000/api/v2/status
```

### List Models

```bash
curl http://127.0.0.1:3000/api/v2/models
```

### Submit Provenance

```bash
curl -X POST http://127.0.0.1:3000/api/sdk/provenance \
  -H "Content-Type: application/json" \
  -d "{\"modelId\":1,\"action\":\"UPDATED\",\"sender\":\"0xYourAddress\",\"versionTag\":\"v1.0.0\",\"commit\":\"Initial training\"}"
```

## Smart Contract Surface

Main deployed contract groups:

- `ModelAccessControl`
- `ModelRegistry`
- `ModelProvenanceTracker`
- `ModelAuditLog`
- `ModelNFT`
- `ModelStaking`
- `Verifier`
- `RealZKBridge`

See `address_v2_multi.json` for current deployed addresses.

## OpenAPI

The OpenAPI source is available at `docs/openapi.yml`.
