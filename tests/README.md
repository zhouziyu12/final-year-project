# Test Guide

## Purpose

The `tests/` directory contains project-level regression tests and result files. The current suite covers:

- contract connectivity and read paths
- ZK proof generation and local verification
- Python SDK and backend integration

## Main Entry Point

On Windows, the recommended command is:

```powershell
powershell -ExecutionPolicy Bypass -File tests/run_all_tests.ps1
```

This script runs:

1. `node scripts/test_contracts.cjs`
2. `node test_zk_standalone.js`
3. starts `server/server.js`
4. `python tests/test_sdk_backend.py`
5. shuts down the backend process it started

## Direct Test Commands

### Smart Contracts

```bash
node tests/test_smart_contracts.js
```

Covers:

- Sepolia and BSC Testnet contract reachability
- read access to `ModelRegistry`, `ModelAccessControl`, `ModelAuditLog`, `ModelNFT`, and `ModelStaking`
- wallet balance checks
- basic database reads

### ZK Regression

```bash
node tests/test_zk_proof.js
```

Covers:

- circuit artifacts exist
- proof generation succeeds
- `groth16.verify` returns `true`
- Solidity calldata export works

### Standalone ZK Smoke Test

```bash
node test_zk_standalone.js
```

Useful for quickly checking:

- `scripts/last_proof_input.json`
- `zk/build/circuit_js/circuit.wasm`
- `zk/circuit_final.zkey`

### SDK and Backend

```bash
python tests/test_sdk_backend.py
```

If you run it directly, start the backend first:

```bash
node server/server.js
```

Covers:

- SDK imports
- write authentication
- backend health, status, models, and audit endpoints
- secret manager encrypted storage
- SDK model resolution and auto-registration

## Output Files

Common outputs:

- `test_results.json`
- `tests/results_sdk_backend.json`
- `tests/results_smart_contracts.json`
- `tests/results_zk_proof.json`
- `tests/test_summary.json`
- `proof.json`
- `public.json`
- `proof_calldata_debug.txt`

## Expected Environment

- Node.js 18+
- Python 3.10+
- installed npm dependencies
- a configured `.env`
- working testnet RPC access

## Status Labels

- `PASS`: check completed successfully
- `FAIL`: assertion failed
- `WARN`: non-blocking issue
- `SKIP`: intentionally skipped
