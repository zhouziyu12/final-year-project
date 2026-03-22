# AI Provenance System v2 - User Manual

## Table of Contents
1. [Introduction](#introduction)
2. [v2 New Features](#v2-new-features)
3. [Quick Start](#quick-start)
4. [Using the SDK](#using-the-sdk)
5. [Smart Contract System](#smart-contract-system)
6. [Training Models with Provenance](#training-models-with-provenance)
7. [Querying Model History](#querying-model-history)
8. [Frontend Interface](#frontend-interface)
9. [Troubleshooting](#troubleshooting)

---

## Introduction

The AI Provenance System v2 provides blockchain-based tracking for AI model training with zero-knowledge proof verification, RBAC access control, model NFT tokenization, and staking mechanism.

### Key Features (v2)
- **Zero-Knowledge Proofs**: Verify model ownership without revealing secrets
- **Multi-Chain Storage**: Records stored on Sepolia, BSC Testnet, and Somnia
- **RBAC Access Control**: 4 roles (ADMIN, REGISTRAR, AUDITOR, MINTER) with blacklist
- **Model State Machine**: DRAFT → ACTIVE → DEPRECATED → REVOKED lifecycle
- **Semantic Versioning**: MAJOR.MINOR.PATCH version control
- **Ownership Transfer**: Request-accept-cancel model ownership flow
- **Immutable Audit Log**: Chain-hash linked tamper-proof audit trail
- **Model NFT-ization**: ERC-721 token with 1:1 model mapping and transfer cooldown
- **Staking Mechanism**: ETH staking with slashing for quality assurance
- **IPFS Integration**: Decentralized model weight storage

---

## v2 New Features

### RBAC Access Control
The system uses role-based access control with 4 roles:
- **ADMIN**: System administrator, can grant/revoke roles, manage blacklist
- **REGISTRAR**: Can register new models
- **AUDITOR**: Can write audit logs
- **MINTER**: Can mint model NFTs

Blacklist mechanism prevents specific addresses from interacting with the system.

### Model State Machine
Every model follows a strict lifecycle:
```
DRAFT → ACTIVE → DEPRECATED → REVOKED
```
- **DRAFT**: Model registered but not yet active
- **ACTIVE**: Model is operational, can receive transfers and staking
- **DEPRECATED**: Model no longer recommended
- **REVOKED**: Model permanently revoked (irreversible)

### Version Management
Models support semantic versioning (MAJOR.MINOR.PATCH):
- **MAJOR**: Breaking changes
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes

Each version is chain-hash linked to its parent for tamper detection.

### Ownership Transfer
Model ownership can be transferred via a request-accept flow:
1. Owner requests transfer to a new address
2. New owner accepts the transfer
3. Owner can cancel before acceptance

### Immutable Audit Log
All sensitive operations are recorded with chain-hash verification:
- Model registration, activation, deprecation, revocation
- Version additions
- Ownership transfers
- Role changes
- Staking operations

### Model NFT-ization
Models can be tokenized as ERC-721 NFTs:
- 1:1 mapping between model ID and token ID
- Transfer cooldown prevents rapid trading
- NFT ownership mirrors model ownership

### Staking Mechanism
Model owners can stake ETH for quality assurance:
- Configurable minimum stake (default 0.01 ETH)
- Slashing mechanism (default 50% penalty)
- Lock period prevents immediate withdrawal

---

## Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- Git

### Clone the Repository
```bash
git clone https://github.com/zhouziyu12/final-year-project.git
cd final-year-project
```

### Install Dependencies
```bash
# Install Node.js dependencies
npm install

# Install Python dependencies
pip install torch torchvision requests python-dotenv
```

### Configure Environment
Create a `.env` file in the project root:
```env
PRIVATE_KEY=your_wallet_private_key_here
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key
```

### Deploy Contracts
```bash
# Compile all contracts
npx hardhat compile

# Deploy to all chains
node scripts/deploy_multi_chain.cjs

# Run tests
node scripts/test_contracts.cjs
```

### Start the Backend
```bash
node server.js
```
The backend will start on `http://127.0.0.1:3000`

### Start the Frontend (Optional)
```bash
cd client
npm install
npm run dev
```
The frontend will start on `http://localhost:5173`

---

## Using the SDK

### Basic Usage

The Python SDK (`sdk/python/provenance_sdk.py`) provides a simple interface for recording model provenance.

#### Import the SDK
```python
from sdk.python.provenance_sdk import ProvenanceSDK
```

#### Initialize the SDK
```python
sdk = ProvenanceSDK(
    backend_url='http://127.0.0.1:3000',
    pinata_api_key='your_api_key',
    pinata_secret_key='your_secret_key'
)
```

#### Submit Provenance After Training
```python
result = sdk.submit_provenance(
    model_path='path/to/model.pth',
    model_series='MyModelSeries',
    version='v1.0',
    commit='Initial training',
    sender='0xYourAddress',
    training_metadata={
        'accuracy': 0.95,
        'final_loss': 0.15,
        'epochs': 10
    }
)

print(f"Model ID: {result['modelId']}")
print(f"Secret: {result['secret']}")
print(f"IPFS Hash: {result['ipfsHash']}")
```

**Important**: Save the `secret` - you'll need it to query all versions of this model series!

---

## Smart Contract System

### Contract Architecture

```
contracts/
├── Verifier.sol                    # Groth16 ZK proof verifier
├── RealZKBridge.sol               # Cross-chain ZK bridge
├── ModelAccessControl.sol          # RBAC + blacklist
├── ModelRegistry.sol              # Model state machine + versioning
├── ModelProvenanceTracker.sol      # Lifecycle events + chain-hash
├── ModelAuditLog.sol             # Immutable audit trail
├── ModelNFT.sol                   # ERC-721 NFT
└── ModelStaking.sol              # ETH staking with slashing
```

### Deployed Addresses (v2)

#### Sepolia Testnet
| Contract | Address |
|----------|---------|
| ModelAccessControl | `0x2b10c15a6e9a4FBDe74705AAd497CBf9013a1E77` |
| ModelRegistry | `0x0416E82F7463f65E22B9209Aa1866c8895Ff4167` |
| ModelProvenanceTracker | `0xF4DD796B894c79B197E9420350DD59F3602b7095` |
| ModelAuditLog | `0x584Bb2E2d2E18d99976779C3bd817B69B3A579bc` |
| ModelNFT | `0x02Ca5220360eb44c0F8c4FB7AEf732115e46f2a0` |
| ModelStaking | `0x1D263F7f4B5F36b81138E6c809159090bb383a16` |

#### BSC Testnet
| Contract | Address |
|----------|---------|
| ModelAccessControl | `0xF6bD1a729eE2Ae2E8bcE5834127E9e518470e517` |
| ModelRegistry | `0x67fe7a49778674C4152fFe875dFb06C002f85E95` |
| ModelProvenanceTracker | `0xDd0C2E81D9134A914fcA7Db9655d9813C87D5701` |
| ModelAuditLog | `0x2Ee33973d1DbE6355E4a12f2e73E55645744DbD8` |
| ModelNFT | `0x8Ddfa02851982E964E713CF0d432Fd050962b662` |
| ModelStaking | `0x2FAaaC1764CDA120405A390de2D6C86c10934397` |

---

## Training Models with Provenance

### Example Training Script

```python
import os
os.environ['KMP_DUPLICATE_LIB_OK'] = 'TRUE'

import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms
from sdk.python.provenance_sdk import ProvenanceSDK

class SimpleNet(nn.Module):
    def __init__(self):
        super(SimpleNet, self).__init__()
        self.fc1 = nn.Linear(784, 128)
        self.fc2 = nn.Linear(128, 10)

    def forward(self, x):
        x = x.view(-1, 784)
        x = torch.relu(self.fc1(x))
        x = self.fc2(x)
        return x

def train():
    model = SimpleNet()
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)

    transform = transforms.Compose([transforms.ToTensor()])
    train_dataset = datasets.MNIST('./data', train=True, download=True, transform=transform)
    train_loader = torch.utils.data.DataLoader(train_dataset, batch_size=64, shuffle=True)

    model.train()
    initial_loss = None
    final_loss = None

    for epoch in range(5):
        for batch_idx, (data, target) in enumerate(train_loader):
            optimizer.zero_grad()
            output = model(data)
            loss = criterion(output, target)
            loss.backward()
            optimizer.step()

            if initial_loss is None:
                initial_loss = loss.item()
            final_loss = loss.item()

    model_path = 'artifacts/my_model.pth'
    os.makedirs('artifacts', exist_ok=True)
    torch.save(model.state_dict(), model_path)

    sdk = ProvenanceSDK()
    result = sdk.submit_provenance(
        model_path=model_path,
        model_series='SimpleNet',
        version='v1.0',
        commit='Initial training with MNIST',
        sender='0xYourAddress',
        training_metadata={
            'accuracy': 0.92,
            'final_loss': final_loss,
            'epochs': 5,
            'dataset': 'MNIST'
        }
    )

    print(f"\n✅ Provenance recorded!")
    print(f"Secret: {result['secret']} (SAVE THIS!)")
    print(f"Model ID: {result['modelId']}")

if __name__ == '__main__':
    train()
```

### Running the Training Script
```bash
python train_example.py
```

### Output Example
```
✅ Provenance recorded!
Secret: 738251 (SAVE THIS!)
Model ID: 887889005
Sepolia Tx: 0xc9258251e63d5f1ede2323bc286d5c1cec0961c3f990e39ed8a01fcb073c6d83
BSC Tx: 0x22ba6ba7911535eac72622ca49aceafd662610a6589ebdda29d9105ed9942873
```

---

## Querying Model History

### Using the CLI Tool
```bash
python query_lifecycle.py --secret 738251
```

### Using the Python SDK
```python
from sdk.python.model_secret_manager import ModelSecretManager

manager = ModelSecretManager()

# Get secret for a model series
secret = manager.get_secret('SimpleNet')
print(f"Secret: {secret}")

# List all model series
manager.list_series()
```

### Using the REST API
```bash
# Get all model series
curl http://127.0.0.1:3000/api/series

# Get lifecycle for a specific secret
curl http://127.0.0.1:3000/api/lifecycle/738251

# Get all provenance records
curl http://127.0.0.1:3000/api/history
```

---

## Frontend Interface

### Accessing the Frontend
Open your browser and navigate to: `http://localhost:5173`

### Features
1. **Model Series List** - View all registered model series
2. **Series Details** - View complete version timeline and metrics
3. **Query by Secret** - Enter 6-digit secret to view model lifecycle
4. **Version Comparison** - Compare two versions' metrics

---

## Troubleshooting

### Backend Not Starting
**Problem**: `Error: Cannot find module 'ethers'`
```bash
npm install
```

### Blockchain Transaction Fails
**Problem**: `Insufficient funds for gas`
1. Get testnet tokens:
   - Sepolia: https://sepoliafaucet.com/
   - BSC Testnet: https://testnet.bnbchain.org/faucet-smart

### IPFS Upload Fails
**Problem**: `Pinata upload failed`
1. Check your Pinata API keys in `.env`
2. Verify keys at: https://app.pinata.cloud/keys

### Frontend Shows "No model series found"
1. Ensure backend is running: `node server.js`
2. Train a model: `python train_example.py`
3. Refresh the frontend

### ZK Proof Generation Fails
**Problem**: `Circuit files not found`
```bash
ls circuit.circom
ls circuit_final.zkey
ls build/circuit_js/circuit.wasm
```

---

## Advanced Usage

### Custom Training Metadata
```python
training_metadata = {
    'accuracy': 0.95,
    'final_loss': 0.15,
    'epochs': 10,
    'batch_size': 64,
    'learning_rate': 0.001,
    'optimizer': 'Adam',
    'dataset': 'MNIST'
}
```

### Multiple Model Series
```python
# Series 1
sdk.submit_provenance(
    model_path='models/simple_v1.pth',
    model_series='SimpleNet',
    version='v1.0',
    ...
)

# Series 2
sdk.submit_provenance(
    model_path='models/resnet_v1.pth',
    model_series='ResNet50',
    version='v1.0',
    ...
)
```

Each series gets its own unique secret.

---

## Best Practices

1. **Save Your Secrets** - Store in a password manager, never commit to Git
2. **Version Naming** - Use semantic versioning: `v1.0`, `v1.1`, `v2.0`
3. **Training Metadata** - Always include accuracy and loss
4. **Model Storage** - Keep model files in `artifacts/` directory

---

## Appendix

### File Structure
```
final-year-project/
├── contracts/                          # v2 Smart contracts (8 contracts)
│   ├── ModelAccessControl.sol          # RBAC + blacklist
│   ├── ModelRegistry.sol               # State machine + versioning
│   ├── ModelProvenanceTracker.sol      # Lifecycle tracking
│   ├── ModelAuditLog.sol              # Immutable audit trail
│   ├── ModelNFT.sol                   # ERC-721 NFT
│   └── ModelStaking.sol              # ETH staking
├── scripts/
│   ├── deploy_multi_chain.cjs          # Multi-chain deployment
│   └── test_contracts.cjs              # Multi-chain test suite
├── sdk/python/
│   ├── provenance_sdk.py                # Main SDK
│   └── model_secret_manager.py         # Secret management
├── server.js                          # Backend API
├── client/                            # Frontend
├── tests/                             # Test suite
└── docs/                             # Documentation
```

### Blockchain Networks
| Network | Chain ID | RPC URL |
|---------|----------|---------|
| Sepolia | 11155111 | https://ethereum-sepolia-rpc.publicnode.com |
| BSC Testnet | 97 | https://bsc-testnet.publicnode.com |
| Somnia | 8889 | https://dream-rpc.somnia.network |

---

**Last Updated**: 2026-03-18
**Version**: 2.0.0
