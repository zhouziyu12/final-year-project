# User Manual

## What This System Does

The AI Model Provenance System records AI model lifecycle events across blockchain-backed components and exposes that data through a backend API, a frontend UI, and a Python SDK.

Core capabilities:

- model registration
- status transitions
- provenance event recording
- immutable audit logs
- NFT minting
- staking and slashing
- ZK proof generation support
- IPFS-backed file and metadata storage

## Main Workflows

### 1. Register a Model

Use the backend registration route or the contract flow to create a new model entry.

Backend route:

`POST /api/register`

### 2. Record Provenance from a Training Pipeline

Use the Python SDK:

```python
from sdk.python.provenance_sdk import ProvenanceSDK

sdk = ProvenanceSDK()
result = sdk.submit_provenance(
    model_path="artifacts/model.bin",
    model_series="ExampleModel",
    version="v1.0.0",
    commit="Initial training",
    sender="0xYourAddress",
    training_metadata={"accuracy": 0.95, "epochs": 10},
)

print(result)
```

### 3. Browse Models

Use:

- `GET /api/v2/models`
- `GET /api/v2/models/:id`

or open the frontend app from the `client` project.

### 4. Review Audit Activity

Use:

- `GET /api/v2/audit/recent`
- `GET /api/v2/audit/verify/:id`

## Running the System Locally

### Compile Contracts

```bash
npx hardhat compile
```

### Start the Backend

```bash
node server/server.js
```

### Start the Frontend

```bash
cd client
npm run dev
```

### Run All Tests

```powershell
powershell -ExecutionPolicy Bypass -File tests/run_all_tests.ps1
```

## File Guide

Important files and directories:

- `contracts/`
- `scripts/deploy_multi_chain.cjs`
- `scripts/test_contracts.cjs`
- `server/server.js`
- `sdk/python/provenance_sdk.py`
- `sdk/python/model_secret_manager.py`
- `tests/run_all_tests.ps1`
- `zk/circuit.circom`

## Current API Surface

Primary backend endpoints:

- `/api/health`
- `/api/v2/status`
- `/api/v2/models`
- `/api/v2/models/:id`
- `/api/v2/audit/recent`
- `/api/v2/audit/verify/:id`
- `/api/sdk/provenance`
- `/api/register`
- `/api/audit`

## Troubleshooting

### Contract compile fails

Run:

```bash
npx hardhat compile --show-stack-traces
```

### Frontend build fails

Run:

```bash
cd client
npm run build
```

### SDK/backend tests fail

Run the full orchestrated flow instead of running the Python script alone:

```powershell
powershell -ExecutionPolicy Bypass -File tests/run_all_tests.ps1
```
