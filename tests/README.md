# Test Suite Guide

This directory contains the project-level test runners, summaries, and integration checks.

## Main Entry Point

Run the full test flow on Windows:

```powershell
powershell -ExecutionPolicy Bypass -File tests/run_all_tests.ps1
```

The runner executes:

1. `node scripts/test_contracts.cjs`
2. `node test_zk_standalone.js`
3. `python tests/test_sdk_backend.py`

For the SDK/backend phase, the runner now starts `server/server.js` automatically and shuts it down after the test completes.

## Test Files

### Contract Test Script

`scripts/test_contracts.cjs`

Covers:

- access control
- model registration
- status transitions
- version history
- provenance chain verification
- audit log chain verification
- NFT mint/burn checks
- staking and slashing

### Standalone ZK Test

`test_zk_standalone.js`

Covers:

- loading proof input from `scripts/last_proof_input.json`
- fallback creation of a default test input if the file is missing
- proof generation using `zk/build/circuit_js/circuit.wasm`
- proving with `zk/circuit_final.zkey`
- calldata export for Solidity verifier usage

### SDK and Backend Integration Test

`tests/test_sdk_backend.py`

Covers:

- Python SDK imports
- backend health and status routes
- model and audit API responses
- secret manager behavior
- expected file layout checks
- Pinata environment configuration presence

## Output Files

The current flow writes:

- `test_results.json`
- `proof.json`
- `public.json`
- `proof_calldata_debug.txt`
- `tests/results_sdk_backend.json`
- `tests/test_summary.json`

## Expected Environment

- Node.js 18+
- Python 3.10+
- installed npm dependencies
- valid `.env` for blockchain-backed tests
- RPC connectivity for deployed testnet contracts

## Useful Direct Commands

Compile contracts:

```bash
npx hardhat compile
```

Run the frontend build:

```bash
cd client
npm run build
```

Run only the SDK/backend test:

```bash
python tests/test_sdk_backend.py
```

Run only the ZK proof flow:

```bash
node test_zk_standalone.js
```

## Status Labels

- `PASS`: the check completed successfully
- `FAIL`: the check completed but failed validation
- `WARN`: the check passed with a non-blocking issue
- `SKIP`: the check was intentionally skipped
