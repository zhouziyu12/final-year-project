# Zero-Knowledge Proof Guide

## Overview

The ZK flow binds model submission and bridge data to a Groth16 proof. The current circuit and bridge constraints are aligned around:

- `modelId`
- `messageHash`
- proof public signals
- destination chain, nonce, and payload binding in `RealZKBridge`

## Key Files

- `zk/circuit.circom`
- `zk/build/circuit.r1cs`
- `zk/build/circuit.sym`
- `zk/build/circuit_js/circuit.wasm`
- `zk/circuit_0000.zkey`
- `zk/circuit_final.zkey`
- `zk/verification_key.json`
- `zk/utils.js`
- `contracts/Verifier.sol`
- `contracts/RealZKBridge.sol`

Test and debug outputs:

- `scripts/last_proof_input.json`
- `proof.json`
- `public.json`
- `proof_calldata_debug.txt`

## Current Circuit Inputs

The circuit now uses:

- `secret`
- `modelId`
- `messageHash`

Notes:

- `secret` is private input
- `modelId` and `messageHash` are public signals
- the circuit computes a `Poseidon(3)` commitment internally

Example input:

```json
{
  "secret": "123456",
  "modelId": "999999999",
  "messageHash": "424242"
}
```

## Compile on Windows

The repository has already verified native Windows compilation:

```bash
cd zk
cmd /c ..\node_modules\.bin\circom2.cmd circuit.circom --r1cs --wasm --sym -o build -l ..\node_modules
```

This produces:

- `build/circuit.r1cs`
- `build/circuit.sym`
- `build/circuit_js/circuit.wasm`

## Generate Proving Assets

```bash
cd zk
cmd /c ..\node_modules\.bin\snarkjs.cmd groth16 setup build\circuit.r1cs pot12_final.ptau circuit_0000.zkey
cmd /c ..\node_modules\.bin\snarkjs.cmd zkey contribute circuit_0000.zkey circuit_final.zkey --name="local" -e="local"
cmd /c ..\node_modules\.bin\snarkjs.cmd zkey export verificationkey circuit_final.zkey verification_key.json
cmd /c ..\node_modules\.bin\snarkjs.cmd zkey export solidityverifier circuit_final.zkey ..\contracts\Verifier.sol
```

After that, recompile contracts:

```bash
cd ..
npx hardhat compile --show-stack-traces
```

## Run the Proof Regression

```bash
node tests/test_zk_proof.js
```

This script:

- creates or reads a test input
- uses wasm + zkey to generate a proof
- writes `proof.json` and `public.json`
- exports Solidity calldata
- calls `groth16.verify` locally

## Standalone Flow

The older standalone smoke path is still available:

```bash
node test_zk_standalone.js
```

## Bridge Binding

`RealZKBridge.sol` now binds the bridge proof to:

- `modelId`
- `dstChainId`
- `bridgeNonce`
- `payload`
- `msg.sender`
- `block.chainid`

It also tracks:

- `usedBridgeNonces`
- `usedNullifiers`

This blocks:

- cross-chain replay
- same-chain replay
- proof reuse with a modified payload

## Troubleshooting

### `circom2` cannot write output

Delete old `zk/build/circuit_js`, `zk/build/circuit_cpp`, `zk/build/circuit.r1cs`, and `zk/build/circuit.sym`, then rerun the compile command inside `zk/`.

### Verifier and circuit do not match

Regenerate:

- `zk/verification_key.json`
- `contracts/Verifier.sol`

Then rerun:

```bash
npx hardhat compile --show-stack-traces
```

### Need calldata for contract debugging

After a successful `node tests/test_zk_proof.js`, use:

- `proof.json`
- `public.json`
- `proof_calldata_debug.txt`
