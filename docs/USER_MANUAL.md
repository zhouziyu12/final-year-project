# User Manual

## What the System Does

This system treats an AI model as a traceable asset and records its path from registration to provenance submission and audit verification.

Core capabilities:

- model registration
- lifecycle status tracking
- provenance event writes
- audit log queries and verification
- IPFS-backed file and metadata storage
- SDK-driven ZK proof generation and submission
- NFT and staking presentation and extension points

## Main Interfaces

### Frontend

The frontend has six primary pages:

- `Overview`
- `Training`
- `Registry`
- `Audit`
- `System`
- `NFT`

Start it with:

```bash
cd client
npm run dev
```

### Backend

Default address:

```text
http://127.0.0.1:3000
```

Primary endpoints:

- `GET /api/health`
- `GET /api/v2/status`
- `GET /api/v2/models`
- `GET /api/v2/audit/recent`
- `POST /api/register`
- `POST /api/sdk/provenance`

## Common Workflows

### 1. Register a Model from the Frontend

Requirements:

- the backend is running
- `VITE_WRITE_API_KEY` is configured

Flow:

1. Open `Registry`
2. Fill in the model name, chain, and metadata
3. Submit the form, which calls `POST /api/register`
4. The new model may appear as `PENDING_REGISTRATION` before chain confirmation completes

### 2. Submit Provenance from Python

```python
from sdk.python.provenance_sdk import ProvenanceSDK

sdk = ProvenanceSDK()
result = sdk.submit_provenance(
    model_path="artifacts/model.bin",
    model_name="ExampleModel",
    version="v1.0.0",
    commit_msg="Initial training",
    sender="0xYourAddress",
    chain="sepolia",
)

print(result)
```

The SDK will:

1. hash the model file
2. resolve or register a real on-chain `modelId`
3. generate a ZK proof
4. upload the model to IPFS
5. call the backend to submit the provenance record

### 3. Verify a Model

Option A:

- open the `Audit` page
- pick a model or enter a model ID

Option B:

```bash
curl "http://127.0.0.1:3000/api/v2/audit/verify/1?chain=sepolia"
```

## Start the System Locally

### Compile

```bash
npx hardhat compile --show-stack-traces
```

### Start Backend

```bash
node server/server.js
```

### Start Frontend

```bash
cd client
npm run dev
```

## Troubleshooting

### Backend is read-only

This means `.env` is missing `PRIVATE_KEY` or `WRITE_API_KEY`.

### Frontend registration is disabled

This means `VITE_WRITE_API_KEY` is not configured, so the UI stays in read-only mode.

### Registration returns but model detail is not immediately available

This is expected. `/api/register` now returns a predicted ID and a `PENDING_REGISTRATION` state before the transaction is confirmed on-chain.

### ZK proof fails

Rebuild the circuit and confirm these files exist:

- `zk/build/circuit_js/circuit.wasm`
- `zk/circuit_final.zkey`
- `zk/verification_key.json`

See `docs/ZK_GUIDE.md` for the full flow.
