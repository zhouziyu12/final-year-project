# AI Model Provenance System

A blockchain-based AI model provenance tracking system with zero-knowledge proof verification, RBAC access control, model NFT-ization, staking mechanism, and multi-chain storage.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.19-blue.svg)](https://soliditylang.org/)
[![Tests](https://img.shields.io/badge/Tests-50%2F50%20%E2%9C%94-brightgreen.svg)]()

## Features

### Core Blockchain Features
- 🔐 **Zero-Knowledge Proofs**: Verify model ownership without revealing secrets (Groth16 via snarkjs)
- ⛓️ **Multi-Chain Storage**: Records stored on Sepolia, BSC Testnet, and Somnia
- 📦 **IPFS Integration**: Decentralized model weight storage via Pinata
- 🔄 **Lifecycle Tracking**: Track all versions of a model series with a single secret

### Smart Contract Features (v2.0)
- 🎭 **RBAC Access Control**: 4 roles (ADMIN, REGISTRAR, AUDITOR, MINTER) + blacklist mechanism
- 📊 **Model State Machine**: DRAFT �?ACTIVE �?DEPRECATED �?REVOKED lifecycle management
- 📝 **Semantic Versioning**: MAJOR.MINOR.PATCH version control with type classification
- 🔄 **Ownership Transfer**: Request-accept-cancel transfer flow for model ownership
- 📋 **Immutable Audit Log**: Chain-hash linked tamper-proof audit trail (18 action types)
- 🏷�?**Model NFT-ization**: ERC-721 tokenization with 1:1 model-to-token mapping and transfer cooldown
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
| ModelAccessControl | 5 | �?|
| ModelRegistry | 7 | �?|
| ProvenanceTracker | 3 | �?|
| ModelAuditLog | 3 | �?|
| ModelNFT | 5 | �?|
| ModelStaking | 3 | �?|

## Architecture

```
┌─────────────────────────────────────────────────────────�?�?                  Training Script                        �?�?                   (Python + PyTorch)                   �?└────────────────────┬────────────────────────────────────�?                     �?                     �?┌─────────────────────────────────────────────────────────�?�?                 Provenance SDK                          �?�?        (ZK Proof + IPFS + Blockchain)                  �?└─────┬──────────────┬──────────────┬────────────────────�?      �?             �?             �?      �?             �?             �?┌──────────�? ┌──────────�? ┌──────────�? ┌──────────�?�?Sepolia  �? �?  BSC    �? �? Somnia  �? �?  IPFS   �?�?Testnet  �? �?Testnet  �? �?Testnet  �? �?(Pinata) �?└──────────�? └──────────�? └──────────�? └──────────�?      �?             �?             �?      └──────────────┴──────────────�?                     �?                     �?┌─────────────────────────────────────────────────────────�?�?             Backend API (Node.js)                       �?└────────────────────┬────────────────────────────────────�?                     �?                     �?┌─────────────────────────────────────────────────────────�?�?          Frontend (React + Vite)                       �?�?        Query �?Visualize �?Compare                      �?└─────────────────────────────────────────────────────────�?```

## Project Structure

```
ai-project/
├── contracts/                          # Solidity smart contracts
�?  ├── Verifier.sol                   # ZK proof verifier (snarkjs)
�?  ├── RealZKBridge.sol               # Cross-chain bridge
�?  ├── ModelAccessControl.sol         # RBAC + blacklist
�?  ├── ModelRegistry.sol              # Model registry + state machine
�?  ├── ModelProvenanceTracker.sol     # Lifecycle tracking
�?  ├── ModelAuditLog.sol             # Immutable audit trail
�?  ├── ModelNFT.sol                  # ERC-721 NFT
�?  └── ModelStaking.sol              # Staking mechanism
├── scripts/
�?  ├── deploy_multi_chain.cjs         # Multi-chain deployment
�?  └── test_contracts.cjs             # Multi-chain test suite
├── sdk/
�?  └── python/
�?      ├── provenance_sdk.py           # Main SDK
�?      └── model_secret_manager.py    # Secret management
├── server/                          # Backend API
├── client/                           # React frontend
├── tests/                            # Test suite
├── docs/                             # Documentation
├── circuit.circom                    # ZK circuit
├── test_zk_standalone.js              # ZK proof generator
└── package.json
```

## Technology Stack

### Blockchain
- **Solidity 0.8.19** - Smart contracts with viaIR optimization
- **Hardhat** - Development framework
- **ethers.js v6** - Blockchain interaction
- **Sepolia** - Ethereum testnet
- **BSC Testnet** - Binance Smart Chain testnet
- **Somnia** - Somnia testnet

### Backend & Frontend
- **Node.js** - Backend server
- **Express** - REST API framework
- **React** - UI framework
- **Vite** - Build tool
- **snarkjs** - Zero-knowledge proofs

### Storage
- **IPFS** - Decentralized file storage
- **Pinata** - IPFS pinning service

### ML Integration
- **PyTorch** - Deep learning framework
- **Python SDK** - Training script integration

## Security

- 🔐 Zero-knowledge proofs protect model secrets
- 🔑 Private keys never leave local environment
- ⛓️ Multi-chain redundancy for high availability
- 📝 Immutable blockchain records with chain-hash verification
- 🛡�?Cryptographic hash verification (SHA-256, keccak256)
- 🎭 Role-based access control with blacklist mechanism
- 💰 Slashing mechanism ensures model quality accountability

## Documentation

- [User Manual](docs/USER_MANUAL.md) - Complete usage guide
- [Deployment Guide](docs/DEPLOYMENT.md) - Installation from scratch
- [API Documentation](docs/API.md) - REST API and SDK reference
- [Test Results](test_results.json) - System verification (50/50 pass)

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Citation

If you use this system in your research, please cite:

```bibtex
@misc{zhou2026provenance,
  title={AI Model Provenance System with Zero-Knowledge Proofs and Multi-Chain Storage},
  author={Zhou, Ziyu},
  year={2026},
  institution={University of Nottingham Ningbo China}
}
```

## Acknowledgments

- University of Nottingham Ningbo China
- Dr. Pushendu Kar (Supervisor)
- Ethereum Foundation (Sepolia testnet)
- Binance (BSC testnet)
- Somnia (Somnia testnet)
- Pinata (IPFS infrastructure)

## Contact

- **Author**: Ziyu Zhou
- **Email**: scyzz10@nottingham.edu.cn
- **GitHub**: [@zhouziyu12](https://github.com/zhouziyu12)
- **Project**: [final-year-project](https://github.com/zhouziyu12/final-year-project)

## Roadmap

- [x] Zero-knowledge proof integration
- [x] Multi-chain storage (Sepolia + BSC + Somnia)
- [x] RBAC access control + blacklist
- [x] Model state machine (DRAFT→ACTIVE→DEPRECATED→REVOKED)
- [x] Semantic version management
- [x] Ownership transfer flow
- [x] Immutable audit log with chain-hash
- [x] Model NFT-ization (ERC-721)
- [x] Staking mechanism with slashing
- [x] Python SDK
- [x] Web interface
- [x] Full test suite (50/50)
- [ ] Support for additional blockchains (Arbitrum, Optimism)
- [ ] Model comparison visualization
- [ ] Federated learning integration
- [ ] Mobile app

---

**Status**: �?Production Ready | **Version**: 2.0.0 | **Last Updated**: 2026-03-18
