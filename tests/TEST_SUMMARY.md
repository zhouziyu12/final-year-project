# Test Summary

## Latest Verified Run

- Date: 2026-04-14
- Runner: `powershell -ExecutionPolicy Bypass -File tests/run_all_tests.ps1`
- Result: all suites passing

## Suite Results

| Suite | Result |
|---|---|
| Smart Contracts | PASS |
| ZK Proof System | PASS |
| SDK and Backend | PASS |

## Smart Contract Verification

Networks covered:

- Sepolia
- BSC Testnet

Checks covered:

- admin role validation
- registrar grant and revoke flow
- model registration and activation
- version history checks
- provenance chain verification
- audit chain verification
- NFT mint and ownership checks
- staking and slashing checks

The latest run completed successfully on both supported contract test networks.

## ZK Proof Verification

The latest standalone ZK run completed successfully with:

- proof generation from `scripts/last_proof_input.json`
- artifact resolution from `zk/build/circuit_js/circuit.wasm`
- proving key resolution from `zk/circuit_final.zkey`
- Solidity calldata export

## SDK and Backend Verification

The latest SDK/backend run completed successfully for:

- `GET /api/health`
- `GET /api/v2/status`
- `GET /api/v2/models`
- `GET /api/v2/audit/recent`
- Python SDK imports
- secret manager flow
- file structure checks
- Pinata configuration checks

## Notes

- The backend integration test is now orchestrated by `tests/run_all_tests.ps1`, which starts and stops the backend automatically.
- The standalone ZK script now supports the current `zk/` artifact layout and creates a default proof input when needed.
