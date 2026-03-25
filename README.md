# AI Model Provenance System

A blockchain-based AI model provenance tracking system with zero-knowledge proof verification, RBAC access control, model NFT-ization, staking mechanism, and multi-chain storage.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.19-blue.svg)](https://soliditylang.org/)
[![Tests](https://img.shields.io/badge/Tests-50/50%20pass-brightgreen.svg)]()

## Features

### Core Blockchain Features
- 🔐 **Zero-Knowledge Proofs**: Verify model ownership without revealing secrets (Groth16 via snarkjs)
- ⛓️ **Multi-Chain Storage**: Records stored on Sepolia, BSC Testnet, and Somnia
- 📦 **IPFS Integration**: Decentralized model weight storage via Pinata
- 🔄 **Lifecycle Tracking**: Track all versions of a model series with a single secret

### Smart Contract Features (v2.0)
- 🔱 **RBAC Access Control**: 4 roles (ADMIN, REGISTRAR, AUDITOR, MINTER) + blacklist mechanism
- 🏷️ **Model State Machine**: DRAFT → ACTIVE → DEPRECATED → REVOKED lifecycle management
- 📋 **Semantic Versioning**: MAJOR.MINOR.PATCH version control with type classification
- 🔄 **Ownership Transfer**: Request-accept-cancel transfer flow for model ownership
- 📜 **Immutable Audit Log**: Chain-hash linked tamper-proof audit trail (18 action types)
- 🎨 **Model NFT-ization**: ERC-721 tokenization with 1:1 model-to-token mapping and transfer cooldown
- 🚫 **Revocation & Blacklist**: Per-model and per-address blacklist with reasons
- 💰 **Staking Mechanism**: ETH staking with configurable slashing (50%) and lock periods

## Contract Architecture

```
contracts/
├── Verifier.sol                    # Groth16 ZK proof verifier (snarkjs generated)
├── RealZKBridge.sol               # Cross-chain ZK proof bridge
├── ModelAccessControl.sol          # RBAC + blacklist (ADMIN/REGISTRAR/AUDITOR/MINTER)
├── ModelRegistry.sol              # Model state machine + version control + ownership transfer
├── ModelProvenanceTracker.sol      # Lifecycle events + chain-hash records + ZK proof logs
├── ModelAuditLog.sol              # Immutable audit trail with genesis block
├── ModelNFT.sol                   # ERC-721 NFT with transfer cooldown
└── ModelStaking.sol              # ETH staking with slashing mechanism
```

## Deployed Addresses

### Sepolia Testnet
| Contract | Address |
|----------|---------|
| ModelAccessControl | `0x2b10c15a6e9a4FBDe74705AAd497CBf9013a1E77` |
| ModelRegistry | `0x0416E82F7463f65E22B9209Aa1866c8895Ff4167` |
| ModelProvenanceTracker | `0xF4DD796B894c79B197E9420350DD59F3602b7095` |
| ModelAuditLog | `0x584Bb2E2d2E18d99976779C3bd817B69B3A579bc` |
| ModelNFT | `0x02Ca5220360eb44c0F8c4FB7AEf732115e46f2a0` |
| ModelStaking | `0x1D263F7f4B5F36b81138E6c809159090bb383a16` |

### BSC Testnet
| Contract | Address |
|----------|---------|
| ModelAccessControl | `0xF6bD1a729eE2Ae2E8bcE5834127E9e518470e517` |
| ModelRegistry | `0x67fe7a49778674C4152fFe875dFb06C002f85E95` |
| ModelProvenanceTracker | `0xDd0C2E81D9134A914fcA7Db9655d9813C87D5701` |
| ModelAuditLog | `0x2Ee33973d1DbE6355E4a12f2e73E55645744DbD8` |
| ModelNFT | `0x8Ddfa02851982E964E713CF0d432Fd050962b662` |
| ModelStaking | `0x2FAaaC1764CDA120405A390de2D6C86c10934397` |

### Somnia Testnet
| Contract | Address |
|----------|---------|
| ModelAccessControl | `0x5218C37411Fe49c15F3889DF131EA405Fe491703` |

## Quick Start

### Prerequisites

- Node.js 16+
- Python 3.8+
- Git
- Ethereum wallet with Sepolia/BSC testnet funds

### Installation

```bash
# Clone the repository
git clone https://github.com/zhouziyu12/final-year-project.git
cd final-year-project

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your wallet private key

# Compile contracts
npx hardhat compile

# Deploy to all chains
node scripts/deploy_multi_chain.cjs

# Run tests
node scripts/test_contracts.cjs
```

## Testing

Run the complete multi-chain test suite:

```bash
node scripts/test_contracts.cjs
```

**Test Results**: 50/50 tests passing (100%) across Sepolia and BSC Testnet

| Contract | Tests | Status |
|----------|-------|--------|
| ModelAccessControl | 5 | ✅ Pass |
| ModelRegistry | 7 | ✅ Pass |
| ProvenanceTracker | 3 | ✅ Pass |
| ModelAuditLog | 3 | ✅ Pass |
| ModelNFT | 5 | ✅ Pass |
| ModelStaking | 3 | ✅ Pass |

## Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                        Training Script                              │
│                        (Python + PyTorch)                           │
└────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────┐
│                        Provenance SDK                               │
│              (ZK Proof + IPFS + Blockchain)                        │
└────────────────────────────────────────────────────────────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              ▼                     ▼                     ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│     Sepolia      │  │       BSC        │  │      Somnia      │
│    Testnet       │  │    Testnet      │  │    Testnet      │
└──────────────────┘  └──────────────────┘  └──────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────┐
│                      Backend API (Node.js)                          │
└────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────┐
│                   Frontend (React + Vite)                          │
│                    Query → Visualize → Compare                      │
└────────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
ai-project/
├── contracts/
│   ├── Verifier.sol                   # ZK proof verifier (snarkjs)
│   ├── RealZKBridge.sol               # Cross-chain bridge
│   ├── ModelAccessControl.sol         # RBAC + blacklist
│   ├── ModelRegistry.sol              # Model registry + state machine
│   ├── ModelProvenanceTracker.sol     # Lifecycle tracking
│   ├── ModelAuditLog.sol             # Immutable audit trail
│   ├── ModelNFT.sol                  # ERC-721 NFT
│   └── ModelStaking.sol              # Staking mechanism
├── scripts/
│   ├── deploy_multi_chain.cjs         # Multi-chain deployment
│   └── test_contracts.cjs            # Multi-chain test suite
├── sdk/
│   └── python/
│       ├── provenance_sdk.py           # Main SDK
│       └── model_secret_manager.py    # Secret management
├── server/                          # Express API server
├── client/                          # React frontend
├── train1.py                        # Training script v1
├── train2.py                        # Training script v2
├── query_lifecycle.py               # Lifecycle query tool
├── zk/                             # Zero-knowledge circuit
└── hardhat.config.js               # Hardhat configuration
```

## Security Features

### Zero-Knowledge Proofs
- **Groth16** proof system via snarkjs
- **Verification**: 1 input, 1 output, 1 public signal
- **Circuit**: Hash-based model ownership verification

### Access Control
- **4 Roles**: ADMIN, REGISTRAR, AUDITOR, MINTER
- **Blacklist**: Per-address blocking with reasons
- **Role Hierarchy**: ADMIN > REGISTRAR > AUDITOR > MINTER

### Audit Trail
- **Immutable**: Chain-hash linked records
- **18 Action Types**: Full lifecycle coverage
- **Genesis Block**: First timestamp record

## License

MIT License - See [LICENSE](LICENSE) for details.

## Author

Zhou Ziyu - [GitHub](https://github.com/zhouziyu12)
