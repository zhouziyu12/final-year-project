# Zero-Knowledge Proof Guide

## Overview

This project uses **Groth16** zero-knowledge proofs via **snarkjs** to prove AI model ownership without revealing sensitive information.

## How It Works

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   Prover    │    │   Circuit    │    │  Verifier   │
│  (Frontend) │───▶│  (On-chain)  │◀───│ (Smart      │
│             │    │              │    │  Contract)  │
└─────────────┘    └──────────────┘    └─────────────┘
     │                   │                   │
     │  modelId (public) │                   │
     │  secret (private) │                   │
     │                   │                   │
     │  Proof π          │                   │
     └───────────────────┼───────────────────┘
                         │ (modelId, proof)
                         ▼
                  ┌──────────────┐
                  │  Verifier   │
                  │  Contract   │
                  │  (Solidity) │
                  └──────────────┘
```

## Circuit: ModelProver

The circuit proves knowledge of a secret `s` such that:

```
commitment = Poseidon(s, modelId)
```

Where:
- `modelId` is **public** (known to everyone)
- `secret` is **private** (never revealed)
- `commitment` is stored **on-chain**

## Quick Start

### 1. Compile Circuit

```bash
cd zk
./compile.sh
```

This generates:
- `build/circuit.r1cs` - Constraint system
- `build/circuit_js/circuit.wasm` - WASM for witness generation
- `build/circuit_final.zkey` - Proving key

### 2. Generate Proof (Frontend)

```javascript
import { groth16 } from 'snarkjs';

// Input (from user)
const input = {
  modelId: 123,
  secret: "0x..."
};

// Generate proof
const { proof, publicSignals } = await groth16.fullProve(
  input,
  "circuit.wasm",
  "circuit_final.zkey"
);

// Send to contract
await verifierContract.verify(proof, publicSignals);
```

### 3. Verify On-Chain

```solidity
// In your smart contract
Verifier verifier;

function verifyZKProof(
    uint[2] calldata a,
    uint[2][2] calldata b,
    uint[2] calldata c,
    uint[2] calldata pubSignals
) external {
    require(
        verifier.verifyProof(a, b, c, pubSignals),
        "ZK proof verification failed"
    );
    // Continue with logic...
}
```

## Circuit Templates

### ModelProver (Basic)
- Input: `modelId` (public), `secret` (private)
- Output: `commitment`
- Use case: Basic ownership proof

### ModelVersionProver (Extended)
- Input: `modelId`, `versionHash` (public), `secret`, `versionSalt` (private)
- Output: `commitment`, `versionCommitment`
- Use case: Prove specific model version

### ModelUpdateProver (Update Chain)
- Input: `modelId`, `prevCommitment`, `newVersion` (public), `secret`, `updateHash` (private)
- Output: `commitment`
- Use case: Sequential updates with integrity

## Security Considerations

1. **Secret Protection**: Never log or expose the secret key
2. **Randomness**: Use cryptographically secure random for salts
3. **Trusted Setup**: For production, run a proper Powers of Tau ceremony
4. **Field Elements**: All inputs must be valid field elements

## Common Issues

### "Constraint system not satisfied"
- Your inputs don't satisfy the circuit constraints
- Check that `modelId` is a valid public signal

### "Invalid witness"
- The WASM calculation produced invalid witness
- Ensure all inputs are within field bounds

### "Proof verification failed"
- On-chain verifier received malformed proof
- Check ABI encoding is correct

## Resources

- [snarkjs documentation](https://github.com/iden3/snarkjs)
- [Circom documentation](https://docs.circom.io/)
- [ZoKrates](https://zokrates.github.io/) - Alternative ZK toolkit
