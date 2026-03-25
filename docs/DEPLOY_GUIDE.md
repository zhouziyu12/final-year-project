# AI Model Provenance System - Deployment Guide

## ⚠️ Security Warning

This document contains sensitive credentials. Handle with care:
- Never commit `.env` to git
- Never share credentials in public channels
- Use testnet wallets, not mainnet wallets

---

## 1. Quick Setup

### 1.1 Clone the Repository

```bash
git clone https://github.com/zhouziyu12/final-year-project
cd final-year-project
```

### 1.2 Create Environment File

Create `.env` file in the project root:

```bash
cp .env.example .env
```

Then edit `.env` with your values (see section 2).

### 1.3 Install Dependencies

```bash
# Install all dependencies
npm install

# Install frontend dependencies
cd client && npm install && cd ..
```

### 1.4 Deploy Contracts

```bash
# Compile smart contracts
npx hardhat compile

# Deploy to Sepolia testnet
npx hardhat run scripts/deploy.js --network sepolia
```

### 1.5 Start Server

```bash
cd server && node server.js
```

Server runs on http://localhost:3000

### 1.6 Start Frontend

```bash
cd client && npm run dev
```

Frontend runs on http://localhost:5173

---

## 2. Environment Variables

Edit `.env` with your actual values:

```bash
# Blockchain - Wallet Private Key (WITH 0x prefix!)
PRIVATE_KEY=0x019ef439d8a1a061e5e1ac1f4be7ca2bea83f87f84e08a427a5ff1dc6f7fba55
PRIVATE_KEY_B=0x019ef439d8a1a061e5e1ac1f4be7ca2bea83f87f84e08a427a5ff1dc6f7fba55

# Network RPC URLs
SEPOLIA_URL=https://rpc.sepolia.org

# Infura (optional, for faster RPC)
INFURA_API_KEY=8a031362da754c57814a57aebbd2e9db
SEPOLIA_RPC=https://sepolia.infura.io/v3/8a031362da754c57814a57aebbd2e9db

# IPFS (Pinata)
PINATA_API_KEY=5b2dd2e97b59897ac815
PINATA_SECRET_KEY=6cdfd99e4278c231efbea4788037ddd8177134ef578135434d92de28c4d2b5a0

# Server
PORT=3000
CLIENT_URL=http://localhost:5173
```

---

## 3. Running Tests

### API Test
```bash
node server/test-api.cjs
```

### Blockchain Connection Test
```bash
node server/test-blockchain.cjs
```

### Build Frontend
```bash
cd client && npm run build
```

---

## 4. Project Structure

```
final-year-project/
├── contracts/           # Solidity smart contracts
├── scripts/             # Deployment scripts
├── server/              # Express backend
│   ├── server.js        # Main server file
│   ├── errors.js        # Error handling
│   ├── test-api.cjs     # API tests
│   └── test-blockchain.cjs  # Blockchain tests
├── client/              # React frontend (Vite)
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # Page components
│   │   └── App.jsx      # Main app
│   └── dist/            # Production build
├── zk/                  # ZK circuits (Circom)
├── docs/                # Documentation
└── .env                 # Environment variables (DO NOT COMMIT!)
```

---

## 5. Troubleshooting

### Server won't start
```bash
# Check if port 3000 is in use
netstat -ano | findstr :3000

# Verify .env exists
ls -la .env
```

### Blockchain connection issues
```bash
# Test blockchain connectivity
node server/test-blockchain.cjs

# Check RPC URL in .env
```

### Frontend build fails
```bash
# Clear cache and reinstall
cd client
rm -rf node_modules dist
npm install
npm run build
```

---

## 6. Tech Stack

| Component | Technology |
|-----------|------------|
| Blockchain | Hardhat + Solidity |
| ZK Proofs | Circom + snarkjs |
| Backend | Node.js + Express |
| Frontend | React + Vite + Tailwind |
| Storage | IPFS (Pinata) |
| Networks | Sepolia, BSC Testnet, Somnia |

---

## 7. GitHub Repository

**URL**: https://github.com/zhouziyu12/final-year-project

**Main Branch**: master

---

## 8. For CI/CD

The project includes GitHub Actions workflows in `.github/workflows/`:

- `ci.yml` - Runs on every push
  - Compiles contracts
  - Builds frontend
  - Runs tests

**Note**: CI/CD uses GitHub Secrets for environment variables.
