# AI Provenance System v2 - Deployment Guide

## Table of Contents
1. [System Requirements](#system-requirements)
2. [Fresh Installation](#fresh-installation)
3. [Environment Configuration](#environment-configuration)
4. [Contract Deployment](#contract-deployment)
5. [Smart Contract Verification](#smart-contract-verification)
6. [Blockchain Setup](#blockchain-setup)
7. [IPFS Configuration](#ipfs-configuration)
8. [Backend Deployment](#backend-deployment)
9. [Frontend Deployment](#frontend-deployment)
10. [Verification](#verification)
11. [Production Deployment](#production-deployment)

---

## System Requirements

### Hardware Requirements
- **CPU**: 2+ cores
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 10GB free space
- **Network**: Stable internet connection

### Software Requirements
- **Operating System**: Windows 10/11, macOS, or Linux
- **Node.js**: v16.0.0 or higher
- **Python**: 3.8 or higher
- **Git**: Latest version
- **npm**: v7.0.0 or higher

### Optional
- **MetaMask** or similar wallet for blockchain interactions
- **Pinata Account** for IPFS uploads (free tier available)

---

## Fresh Installation

### Step 1: Install Git
```bash
# Windows: https://git-scm.com/download/win
# macOS: brew install git
# Linux: sudo apt install git -y
git --version
```

### Step 2: Install Node.js
```bash
# Windows: https://nodejs.org/ (use LTS)
# macOS: brew install node
# Linux: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt install -y nodejs
node --version
npm --version
```

### Step 3: Install Python
```bash
# Windows: https://www.python.org/downloads/ (check "Add Python to PATH")
# macOS: brew install python@3.11
# Linux: sudo apt install python3 python3-pip -y
python --version
pip --version
```

### Step 4: Clone the Repository
```bash
cd ~/Desktop
git clone https://github.com/zhouziyu12/final-year-project.git
cd final-year-project
```

### Step 5: Install Project Dependencies
```bash
# Node.js Dependencies
npm install

# Python Dependencies
pip install torch torchvision requests python-dotenv

# Frontend Dependencies
cd client
npm install
cd ..
```

---

## Environment Configuration

### Create .env File
```bash
# Windows
New-Item -Path .env -ItemType File

# macOS/Linux
touch .env
```

### Configure Environment Variables
Open `.env` in a text editor:

```env
# Blockchain Configuration
PRIVATE_KEY=your_wallet_private_key_here

# IPFS Configuration (Optional)
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key

# RPC Endpoints (Optional - defaults provided)
SEPOLIA_URL=https://ethereum-sepolia-rpc.publicnode.com
BNB_URL=https://bsc-testnet.publicnode.com
```

**Important**: Never commit `.env` to Git!

---

## Contract Deployment

### Step 1: Compile Contracts
```bash
npx hardhat compile
```
Expected output:
```
Compiled 8 Solidity files successfully
```

### Step 2: Deploy to All Chains
```bash
node scripts/deploy_multi_chain.cjs
```

Expected output:
```
Deploying to sepolia...
  ModelAccessControl: 0x2b10c15a6e9a4FBDe74705AAd497CBf9013a1E77
  ModelRegistry: 0x0416E82F7463f65E22B9209Aa1866c8895Ff4167
  ModelProvenanceTracker: 0xF4DD796B894c79B197E9420350DD59F3602b7095
  ModelAuditLog: 0x584Bb2E2d2E18d99976779C3bd817B69B3A579bc
  ModelNFT: 0x02Ca5220360eb44c0F8c4FB7AEf732115e46f2a0
  ModelStaking: 0xe920208f1787f804A675e23E755A232eF192Ebe2
Deploying to tbnb (BSC)...
  ...
Deploying to somnia...
  ...
Saved to address_v2_multi.json
```

### Step 3: Verify Deployment
```bash
node scripts/test_contracts.cjs
```
Expected: **50/50 tests passing**

---

## Smart Contract Verification

### Deployed Contract Addresses

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

#### Somnia Testnet
| Contract | Address |
|----------|---------|
| ModelAccessControl | `0x5218C37411Fe49c15F3889DF131EA405Fe491703` |

All addresses are saved in `address_v2_multi.json` in the project root.

---

## Blockchain Setup

### Step 1: Create a Wallet
```javascript
// Run in Node.js console
const { ethers } = require('ethers');
const wallet = ethers.Wallet.createRandom();
console.log('Address:', wallet.address);
console.log('Private Key:', wallet.privateKey);
```

### Step 2: Add Private Key to .env
```env
PRIVATE_KEY=0x1234567890abcdef...
```

### Step 3: Get Testnet Tokens

#### Sepolia Testnet
1. Visit: https://sepoliafaucet.com/
2. Enter your wallet address
3. Wait for tokens (usually 0.5 ETH)

Alternative faucets:
- https://www.alchemy.com/faucets/ethereum-sepolia
- https://faucet.quicknode.com/ethereum/sepolia

#### BSC Testnet
1. Visit: https://testnet.bnbchain.org/faucet-smart
2. Enter your wallet address
3. Receive 0.5 tBNB

#### Somnia Testnet
1. Visit: https://faucet.somnia.network/
2. Enter your wallet address

### Step 4: Verify Wallet Balance
```bash
node -e "require('dotenv').config(); const {ethers}=require('ethers'); const w=new ethers.Wallet(process.env.PRIVATE_KEY, new ethers.JsonRpcProvider('https://ethereum-sepolia-rpc.publicnode.com')); w.provider.getBalance(w.address).then(b=>console.log('ETH:', parseFloat(ethers.formatEther(b)).toFixed(4)));"
```

---

## IPFS Configuration

### Option 1: Use Pinata (Recommended)

#### Step 1: Create Pinata Account
1. Visit: https://app.pinata.cloud/
2. Sign up for free account

#### Step 2: Generate API Keys
1. Go to: https://app.pinata.cloud/keys
2. Click "New Key"
3. Enable permissions: `pinFileToIPFS`, `pinJSONToIPFS`
4. Click "Create Key"
5. **Copy both API Key and API Secret immediately!**

#### Step 3: Add to .env
```env
PINATA_API_KEY=your_api_key_here
PINATA_SECRET_KEY=your_secret_key_here
```

### Option 2: Skip IPFS Configuration
If you don't configure Pinata, the backend will handle IPFS uploads automatically.

---

## Backend Deployment

### Start the Backend
```bash
node server.js
```

Expected output:
```
[dotenv] injecting env (3) from .env
Server running on http://127.0.0.1:3000
Database initialized: server/database.json
```

### Test Backend API
```bash
# Test health endpoint
curl http://127.0.0.1:3000/api/series

# Expected response:
# {"success":true,"series":[]}
```

---

## Frontend Deployment

### Start Development Server
```bash
cd client
npm install
npm run dev
```

Expected output:
```
VITE ready in 312 ms
➜  Local:   http://localhost:5173/
```

---

## Verification

### Run Test Suite
```bash
# v2 Smart Contract Tests (main suite)
node scripts/test_contracts.cjs

# ZK Proof Tests
node tests/test_zk_proof.js

# SDK and Backend Tests
python tests/test_sdk_backend.py

# Or run all at once (Windows)
powershell -File tests/run_all_tests.ps1
```

All tests should pass:
- **v2 Smart Contracts**: 50/50 ✅
- **ZK Proof System**: 9/9 ✅
- **SDK & Backend**: 15/15 ✅

---

## Production Deployment

### Backend with PM2
```bash
# Install PM2
npm install -g pm2

# Start backend
pm2 start server.js --name "ai-provenance-backend"

# Auto-restart on reboot
pm2 startup
pm2 save

# View logs
pm2 logs ai-provenance-backend
```

### Frontend Build
```bash
cd client
npm run build
```

This creates a `dist/` folder with optimized static files.

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /path/to/final-year-project/client/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

---

## Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

### Permission Denied
```bash
# Don't use sudo with npm!
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### Module Not Found
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## Security Best Practices

1. **Protect Your Private Key** - Never commit `.env` to Git
2. **API Keys** - Rotate Pinata keys periodically
3. **Network Security** - Use HTTPS in production
4. **Regular Updates** - `npm update` and `pip install --upgrade`

---

## Next Steps

1. Read the [User Manual](USER_MANUAL.md) to learn how to use the system
2. Check the [API Documentation](API.md) for integration details
3. Review [Test Results](../tests/TEST_SUMMARY.md) for system health

---

**Last Updated**: 2026-03-18
**Version**: 2.0.0
