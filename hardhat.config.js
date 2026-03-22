import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";

dotenv.config();

// Load keys from .env
const PRIVATE_KEY_A = process.env.PRIVATE_KEY; 
const PRIVATE_KEY_B = process.env.PRIVATE_KEY_B;

if (!PRIVATE_KEY_A || !PRIVATE_KEY_B) {
  console.warn("⚠️ Warning: Private keys not found in .env. Real network deployment will fail.");
}

const config = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true
    }
  },
  networks: {
    // 1. Localhost (For quick testing)
    hardhat: {
      chainId: 1337
    },
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    
    // 2. Sepolia Testnet (Institution A)
    sepolia: {
      url: process.env.SEPOLIA_URL || "https://rpc.sepolia.org",
      accounts: PRIVATE_KEY_A ? [PRIVATE_KEY_A] : [],
      chainId: 11155111
    },

    // 3. Somnia Testnet (Institution B / L2)
    somnia: {
      url: "https://dream-rpc.somnia.network",
      accounts: PRIVATE_KEY_A ? [PRIVATE_KEY_A] : [],
      chainId: 50312
    },

    // 4. BSC Testnet (tBNB Hub)
    tbnb: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      accounts: PRIVATE_KEY_A ? [PRIVATE_KEY_A] : [],
      chainId: 97
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};

export default config;
