# Deployment Guide

## Scope

This guide covers the local deployment and verification flow for the current repository layout.

## Prerequisites

- Node.js 18+
- Python 3.10+
- npm
- a populated `.env` file for blockchain-backed operations

## Install Dependencies

```bash
npm install
cd client && npm install
cd ..
```

## Compile Contracts

```bash
npx hardhat compile
```

## Deploy Contracts

Use the multi-chain deployment script:

```bash
node scripts/deploy_multi_chain.cjs
```

The deployment metadata is written to `address_v2_multi.json`.

## Start the Backend

```bash
node server/server.js
```

Default local API base:

```text
http://127.0.0.1:3000
```

## Build the Frontend

```bash
cd client
npm run build
```

## Run the Full Verification Flow

```powershell
powershell -ExecutionPolicy Bypass -File tests/run_all_tests.ps1
```

## Repository Paths

```text
contracts/      smart contracts
scripts/        deployment and contract test scripts
server/         backend service
client/         frontend app
sdk/python/     Python SDK
tests/          test runners and summaries
zk/             Circom circuit and proof artifacts
docs/           documentation
```

## Current Notes

- `ModelNFT` deployment depends on both `ModelAccessControl` and `ModelRegistry`
- the backend exposes both current `/api/v2/*` routes and selected legacy compatibility routes
- ZK proving assets live under `zk/`, not the repository root
