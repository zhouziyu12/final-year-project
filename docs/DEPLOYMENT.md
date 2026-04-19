# Deployment Modes

This document describes the runtime modes that exist after the JWT and owner-preserving relay refactor.

## 1. Relay-Enabled Mode

Triggered when:

- `.env` contains `PRIVATE_KEY`
- deployment addresses are present in `address_v2_multi.json`

Behavior:

- authenticated `POST /api/register` is available
- authenticated `POST /api/sdk/provenance` is available
- authenticated lifecycle and IPFS upload routes are available
- `/api/v2/status` reports:
  - `authMode: jwt`
  - `authStoreMode: stateful-file-store`
  - `relayMode: relay-enabled`

## 2. Read-Only Relay Mode

Triggered when:

- the backend starts without `PRIVATE_KEY`

Behavior:

- read endpoints remain available
- protected auth endpoints can still issue JWTs
- relay-dependent writes fail because no wallet is configured
- `/api/v2/status` reports:
  - `authMode: jwt`
  - `authStoreMode: stateful-file-store`
  - `relayMode: read-only`

This mode is still useful for:

- registry browsing
- audit verification
- lifecycle browsing against already stored secrets
- frontend demos that do not need fresh writes

## 3. Frontend Role

The frontend is no longer a write mode toggle.

Browser responsibilities:

- health and system visibility
- model registry browsing
- audit verification
- authenticated lifecycle lookup and download

The browser does not rely on `VITE_WRITE_API_KEY`.

## 4. First Boot Behavior

On first backend boot, the server seeds `server/data/auth_store.json` if it does not exist.

Default demo user:

- username: `researcher`
- password: `researcher-demo-pass`
- wallet: `0x1111111111111111111111111111111111111111`

## 5. Verified Commands

Re-run on 2026-04-15:

```bash
npx hardhat compile --show-stack-traces
node tests/test_zk_proof.js
python tests/test_sdk_backend.py
cd client && npm run lint
cd client && npm run build
```

## 6. Deployment Metadata

The chain deployments are stored in:

- `address_v2_multi.json`

The frontend ABI bundle can be refreshed with:

```bash
node client/scripts_extract_abi.js
```
