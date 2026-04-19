# Deployment Guide

This guide follows the final repository semantics: JWT-authenticated SDK writes, backend relay ownership preservation, and verifier-gated provenance.

## 1. Required Environment

Set these values in `.env`:

- `PRIVATE_KEY`
- `JWT_SECRET`
- `PINATA_API_KEY`
- `PINATA_SECRET`
- `SEPOLIA_URL` or use the default public endpoint
- `BNB_TESTNET_URL` or use the default public endpoint

Optional:

- `PORT`
- `CLIENT_URL`
- `VITE_API_URL`

No frontend write key is required.

For any demo, shared, or examiner-facing environment:

- set an explicit long random `JWT_SECRET`
- do not rely on the backend's ephemeral fallback secret
- confirm `/api/health` or `/api/v2/status` reports `jwtSecretMode: configured`

## 2. Compile Contracts

```bash
npx hardhat compile --show-stack-traces
```

## 3. Deploy to Sepolia and tBNB

```bash
node scripts/deploy_multi_chain.cjs
```

Expected output:

- `address_v2_multi.json` is rewritten
- both networks receive fresh contract addresses
- the new `ModelRegistry` supports `registerModelFor(owner, ...)`

## 4. Refresh Frontend ABI Metadata

```bash
node client/scripts_extract_abi.js
```

This updates:

- `client/src/abis.json`

## 5. Start the Backend

```bash
node server/server.js
```

On first boot the backend seeds `server/data/auth_store.json` if needed.

## 6. Start the Frontend

```bash
cd client
npm run dev
```

## 7. Verify the Build

Run:

```bash
python tests/test_sdk_backend.py
node tests/test_zk_proof.js
cd client && npm run lint
cd client && npm run build
```

## 8. Expected Runtime Semantics

After deployment:

- `/api/auth/login` issues JWTs
- `/api/register` relays to `registerModelFor(owner, ...)`
- `/api/sdk/provenance` writes through `ZKProvenanceTracker`
- lifecycle queries use authenticated `POST` bodies
- frontend stays presentation-only for writes

## 9. Troubleshooting

### Status shows `relayMode: read-only`

Cause:

- `PRIVATE_KEY` is missing or invalid

### Login works but writes fail with `403`

Cause:

- the authenticated user's bound wallet does not own the target model

### Health/status shows `jwtSecretMode: ephemeral`

Cause:

- `JWT_SECRET` is missing

Fix:

- generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- place it in `.env` as `JWT_SECRET=...`
- restart the backend

### SDK cannot resolve a model by name

Check:

- chain
- owner wallet address
- model name spelling
- `model_name_map.json` owner bucket

### Lifecycle query fails after URL migration

Use:

- `POST /api/v2/lifecycle/query`
- `POST /api/v2/lifecycle/download`

Do not use the deprecated `GET` URLs.
