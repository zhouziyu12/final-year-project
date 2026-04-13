# Zero-Knowledge Proof Guide

## ZK Assets

The current repository stores ZK proof assets under `zk/`.

Important paths:

- `zk/circuit.circom`
- `zk/build/circuit_js/circuit.wasm`
- `zk/circuit_final.zkey`
- `zk/verification_key.json`
- `zk/utils.js`
- `zk/compile.sh`

Proof input used by the standalone test:

- `scripts/last_proof_input.json`

## Compile the Circuit

From the repository root:

```bash
cd zk
./compile.sh
```

This produces the circuit build output and proving artifacts used by the standalone flow.

## Standalone Proof Test

Run:

```bash
node test_zk_standalone.js
```

The script now:

- loads `scripts/last_proof_input.json`
- creates a default input file if it is missing
- resolves artifacts from the current `zk/` layout
- generates `proof.json`
- generates `public.json`
- writes Solidity calldata to `proof_calldata_debug.txt`

## Proof Input Format

Example:

```json
{
  "secret": "123456",
  "modelId": "999999999"
}
```

## Related Files

- `contracts/Verifier.sol`
- `contracts/RealZKBridge.sol`
- `sdk/python/provenance_sdk.py`

## Troubleshooting

### Missing WASM or proving key

Rebuild the circuit:

```bash
cd zk
./compile.sh
```

### Proof test cannot find input

The standalone script will now generate a default `scripts/last_proof_input.json` automatically.

### Need Solidity calldata for debugging

After a successful standalone run, use:

- `proof.json`
- `public.json`
- `proof_calldata_debug.txt`
