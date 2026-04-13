# Deployment Notes

## Verified Local Build Chain

The following commands are currently verified in this repository:

```bash
npx hardhat compile
cd client && npm run build
python -m py_compile sdk/python/provenance_sdk.py sdk/python/model_secret_manager.py tests/test_sdk_backend.py
```

Full regression:

```powershell
powershell -ExecutionPolicy Bypass -File tests/run_all_tests.ps1
```

## Backend Startup

Run the API server from the repository root:

```bash
node server/server.js
```

Health check:

```bash
curl http://127.0.0.1:3000/api/health
```

## Frontend Startup

Development:

```bash
cd client
npm run dev
```

Production build:

```bash
cd client
npm run build
```

## Common Outputs

- `client/dist/` for the frontend build
- `artifacts/` for Hardhat compile output
- `tests/test_summary.json` for the test-run summary

## Current Deployment Metadata

Addresses are stored in `address_v2_multi.json` for:

- `sepolia`
- `tbnb`
- `somnia`

## Notes on Windows

- Hardhat compile is expected to work directly from PowerShell or `cmd`
- the project no longer requires WSL to complete the normal compile/build/test path
