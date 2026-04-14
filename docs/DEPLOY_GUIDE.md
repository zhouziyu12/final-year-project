# Deployment Guide

## Scope

This guide takes a clean checkout to a state where the project compiles, runs, and validates successfully.

## Prerequisites

- Node.js 18+
- Python 3.10+
- npm
- a populated `.env`

## 1. Install Dependencies

```bash
npm install
cd client && npm install
cd ..
```

## 2. Configure Environment

Copy `.env.example` to `.env` and populate:

- `PRIVATE_KEY`
- `SEPOLIA_URL`
- `BNB_TESTNET_URL`
- `WRITE_API_KEY`
- `VITE_WRITE_API_KEY`
- `PINATA_API_KEY`
- `PINATA_SECRET`

## 3. Compile Contracts

```bash
npx hardhat compile --show-stack-traces
```

## 4. Deploy Contracts

Use the multi-chain deployment script:

```bash
node scripts/deploy_multi_chain.cjs
```

Deployment metadata is merged into:

- `address_v2_multi.json`

Current default deployment scope:

- `ModelAccessControl`
- `ModelRegistry`
- `ModelProvenanceTracker`
- `ModelAuditLog`
- `ModelNFT`
- `ModelStaking`

Note:

- `Verifier.sol` and `RealZKBridge.sol` exist in the repository
- they are not part of the default `deploy_multi_chain.cjs` flow at the moment

## 5. Build ZK Assets

If the circuit changed, rebuild inside `zk/`:

```bash
cd zk
cmd /c ..\node_modules\.bin\circom2.cmd circuit.circom --r1cs --wasm --sym -o build -l ..\node_modules
cmd /c ..\node_modules\.bin\snarkjs.cmd groth16 setup build\circuit.r1cs pot12_final.ptau circuit_0000.zkey
cmd /c ..\node_modules\.bin\snarkjs.cmd zkey contribute circuit_0000.zkey circuit_final.zkey --name="local" -e="local"
cmd /c ..\node_modules\.bin\snarkjs.cmd zkey export verificationkey circuit_final.zkey verification_key.json
cmd /c ..\node_modules\.bin\snarkjs.cmd zkey export solidityverifier circuit_final.zkey ..\contracts\Verifier.sol
```

Then recompile contracts from the repo root:

```bash
cd ..
npx hardhat compile --show-stack-traces
```

## 6. Start the Backend

```bash
node server/server.js
```

Default API base:

```text
http://127.0.0.1:3000
```

## 7. Start the Frontend

```bash
cd client
npm run dev
```

## 8. Validate

```bash
cd client && npm run lint && npm run build && cd ..
node tests/test_zk_proof.js
python tests/test_sdk_backend.py
node tests/test_smart_contracts.js
```

Or run the Windows regression wrapper:

```powershell
powershell -ExecutionPolicy Bypass -File tests/run_all_tests.ps1
```

## Notes

- `ModelNFT` depends on `ModelAccessControl` and `ModelRegistry`.
- `/api/register` now predicts a model ID and returns a pending registration response immediately.
- ZK artifacts live under `zk/`, not the repository root.
- Native Windows circuit compilation is supported and already verified.
- Local proof generation is implemented today, but bridge-backed end-to-end settlement is still only partially integrated into the main application path.
