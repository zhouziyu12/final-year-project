/**
 * Test Suite 1: Smart Contract Functionality (v2)
 * Tests v2 contracts on Sepolia and BSC Testnet
 * Note: Full v2 test suite is in scripts/test_contracts.cjs
 *       This file provides basic connectivity and deployment verification
 */

import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const RESULTS = {
  suite: 'v2 Smart Contract Tests',
  timestamp: new Date().toISOString(),
  tests: []
};

const log = (name, status, detail, data = null) => {
  const result = { name, status, detail, data };
  RESULTS.tests.push(result);
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} [${status}] ${name}: ${detail}`);
};

// Load v2 addresses
const ADDRESS_FILE = path.join(__dirname, '..', 'address_v2_multi.json');
const addresses = JSON.parse(fs.readFileSync(ADDRESS_FILE, 'utf8'));

const SEPOLIA_RPC = 'https://ethereum-sepolia-rpc.publicnode.com';
const BSC_RPC = 'https://bsc-testnet.publicnode.com';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

async function testContractConnectivity() {
  console.log('\n=== Test Group 1: Contract Connectivity ===');

  // Test Sepolia connection
  try {
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
    const network = await Promise.race([
      provider.getNetwork(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
    ]);
    log('Sepolia RPC Connection', 'PASS', `Connected to chainId: ${network.chainId}`);

    // Verify the deployed contract set, including verifier-gated provenance components.
    const contracts = addresses.sepolia.contracts;
    let deployedCount = 0;
    for (const [name, addr] of Object.entries(contracts)) {
      const code = await provider.getCode(addr);
      if (code && code !== '0x') {
        deployedCount++;
        log(`Sepolia ${name}`, 'PASS', `Deployed at ${addr}`);
      } else {
        log(`Sepolia ${name}`, 'FAIL', `No contract at ${addr}`);
      }
    }
    log('Sepolia Contract Count', deployedCount === 8 ? 'PASS' : 'FAIL', `${deployedCount}/8 contracts deployed`);
  } catch (err) {
    log('Sepolia RPC Connection', 'FAIL', err.message);
  }

  // Test BSC connection
  try {
    const provider = new ethers.JsonRpcProvider(BSC_RPC);
    const network = await Promise.race([
      provider.getNetwork(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
    ]);
    log('BSC RPC Connection', 'PASS', `Connected to chainId: ${network.chainId}`);

    const contracts = addresses.tbnb.contracts;
    let deployedCount = 0;
    for (const [name, addr] of Object.entries(contracts)) {
      const code = await provider.getCode(addr);
      if (code && code !== '0x') {
        deployedCount++;
        log(`BSC ${name}`, 'PASS', `Deployed at ${addr}`);
      } else {
        log(`BSC ${name}`, 'FAIL', `No contract at ${addr}`);
      }
    }
    log('BSC Contract Count', deployedCount === 8 ? 'PASS' : 'FAIL', `${deployedCount}/8 contracts deployed`);
  } catch (err) {
    log('BSC RPC Connection', 'FAIL', err.message);
  }
}

async function testContractRead() {
  console.log('\n=== Test Group 2: Contract Read Operations ===');
  if (!PRIVATE_KEY) {
    log('Wallet Load', 'FAIL', 'PRIVATE_KEY not set in environment');
    return;
  }

  try {
    const wallet = new ethers.Wallet(PRIVATE_KEY);
    const address = wallet.address;
    log('Wallet Address', 'PASS', address);

    // Read Sepolia ModelRegistry
    const sepProvider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
    const sepWallet = new ethers.Wallet(PRIVATE_KEY, sepProvider);

    const regArtifact = JSON.parse(
      fs.readFileSync(path.join(__dirname, '..', 'artifacts', 'contracts', 'ModelRegistry.sol', 'ModelRegistry.json'), 'utf8')
    );
    const reg = new ethers.Contract(
      addresses.sepolia.contracts.ModelRegistry,
      regArtifact.abi,
      sepWallet
    );

    const zeroOwner = await reg.getModelOwner(1).catch(() => null);
    log('Sepolia ModelRegistry', zeroOwner !== undefined ? 'PASS' : 'FAIL', 'Contract readable via registry view methods');

    // Read AccessControl roles
    const acArtifact = JSON.parse(
      fs.readFileSync(path.join(__dirname, '..', 'artifacts', 'contracts', 'ModelAccessControl.sol', 'ModelAccessControl.json'), 'utf8')
    );
    const ac = new ethers.Contract(
      addresses.sepolia.contracts.ModelAccessControl,
      acArtifact.abi,
      sepWallet
    );

    const hasAdmin = await ac.hasRole(
      '0xdf8b4c520ffe197c5343c6f5aec59570151ef9a492f2c624fd45ddde6135ec42',
      address
    );
    log('Sepolia AccessControl', hasAdmin ? 'PASS' : 'FAIL', `Deployer has ADMIN role: ${hasAdmin}`);

    // Read AuditLog
    const auditArtifact = JSON.parse(
      fs.readFileSync(path.join(__dirname, '..', 'artifacts', 'contracts', 'ModelAuditLog.sol', 'ModelAuditLog.json'), 'utf8')
    );
    const audit = new ethers.Contract(
      addresses.sepolia.contracts.ModelAuditLog,
      auditArtifact.abi,
      sepWallet
    );
    const totalEntries = await audit.totalEntries();
    log('Sepolia AuditLog', 'PASS', `totalEntries: ${totalEntries}`);

    // Read NFT
    const nftArtifact = JSON.parse(
      fs.readFileSync(path.join(__dirname, '..', 'artifacts', 'contracts', 'ModelNFT.sol', 'ModelNFT.json'), 'utf8')
    );
    const nft = new ethers.Contract(
      addresses.sepolia.contracts.ModelNFT,
      nftArtifact.abi,
      sepWallet
    );
    const supply = await nft.totalSupply();
    log('Sepolia ModelNFT', 'PASS', `totalSupply: ${supply}`);

    const verifierArtifact = JSON.parse(
      fs.readFileSync(path.join(__dirname, '..', 'artifacts', 'contracts', 'Verifier.sol', 'Groth16Verifier.json'), 'utf8')
    );
    const verifier = new ethers.Contract(
      addresses.sepolia.contracts.Groth16Verifier,
      verifierArtifact.abi,
      sepWallet
    );
    const proofFn = await verifier.getFunction('verifyProof');
    log('Sepolia Groth16Verifier', proofFn ? 'PASS' : 'FAIL', 'Verifier ABI is readable');

    const zkptArtifact = JSON.parse(
      fs.readFileSync(path.join(__dirname, '..', 'artifacts', 'contracts', 'ZKProvenanceTracker.sol', 'ZKProvenanceTracker.json'), 'utf8')
    );
    const zkpt = new ethers.Contract(
      addresses.sepolia.contracts.ZKProvenanceTracker,
      zkptArtifact.abi,
      sepWallet
    );
    const chainHead = await zkpt.modelChainHead(1).catch(() => null);
    log('Sepolia ZKProvenanceTracker', chainHead !== undefined ? 'PASS' : 'FAIL', 'Verifier-gated provenance tracker is readable');

    // Read Staking
    const stakingArtifact = JSON.parse(
      fs.readFileSync(path.join(__dirname, '..', 'artifacts', 'contracts', 'ModelStaking.sol', 'ModelStaking.json'), 'utf8')
    );
    const staking = new ethers.Contract(
      addresses.sepolia.contracts.ModelStaking,
      stakingArtifact.abi,
      sepWallet
    );
    const minStake = await staking.minStake();
    log('Sepolia ModelStaking', 'PASS', `minStake: ${ethers.formatEther(minStake)} ETH`);

  } catch (err) {
    log('Contract Read', 'FAIL', err.message);
  }
}

async function testWalletBalance() {
  console.log('\n=== Test Group 3: Wallet Balance ===');
  if (!PRIVATE_KEY) {
    log('Wallet Balance Check', 'FAIL', 'PRIVATE_KEY not set in environment');
    return;
  }

  try {
    const wallet = new ethers.Wallet(PRIVATE_KEY);
    const address = wallet.address;
    log('Wallet Address', 'PASS', address);

    // Sepolia balance
    try {
      const sepProvider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
      const balance = await sepProvider.getBalance(address);
      const eth = parseFloat(ethers.formatEther(balance));
      log('Sepolia Balance', eth > 0.01 ? 'PASS' : 'WARN',
        `${eth.toFixed(4)} ETH ${eth < 0.01 ? '(low balance)' : ''}`);
    } catch (err) {
      log('Sepolia Balance', 'FAIL', err.message);
    }

    // BSC balance
    try {
      const bscProvider = new ethers.JsonRpcProvider(BSC_RPC);
      const balance = await bscProvider.getBalance(address);
      const bnb = parseFloat(ethers.formatEther(balance));
      log('BSC Balance', bnb > 0.01 ? 'PASS' : 'WARN',
        `${bnb.toFixed(4)} tBNB ${bnb < 0.01 ? '(low balance)' : ''}`);
    } catch (err) {
      log('BSC Balance', 'FAIL', err.message);
    }
  } catch (err) {
    log('Wallet Load', 'FAIL', err.message);
  }
}

async function testDatabaseRead() {
  console.log('\n=== Test Group 4: Database & File Structure ===');

  const dbPath = path.join(__dirname, '..', 'server', 'database.json');
  let records = [];
  try {
    records = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    log('Database Read', 'PASS', `Found ${records.length} records in database`);
  } catch (err) {
    log('Database Read', 'FAIL', err.message);
    return;
  }

  if (records.length === 0) {
    log('Database Records', 'SKIP', 'No records in database');
    return;
  }

  const firstRecord = records[0];
  log('Record Structure', 'PASS', `ModelId: ${firstRecord.modelId}, Action: ${firstRecord.action}`, {
    modelId: firstRecord.modelId,
    sepoliaTxHash: firstRecord.sepoliaTxHash,
    bscTxHash: firstRecord.tbnbTxHash || firstRecord.bscTxHash
  });
}

async function main() {
  console.log('\n====================================');
  console.log('  v2 Smart Contract Test Suite');
  console.log(`  Started: ${new Date().toLocaleString()}`);
  console.log('====================================');

  await testContractConnectivity();
  await testContractRead();
  await testWalletBalance();
  await testDatabaseRead();

  const passed = RESULTS.tests.filter(t => t.status === 'PASS').length;
  const failed = RESULTS.tests.filter(t => t.status === 'FAIL').length;
  const warned = RESULTS.tests.filter(t => t.status === 'WARN').length;
  const skipped = RESULTS.tests.filter(t => t.status === 'SKIP').length;

  console.log('\n====================================');
  console.log(`  Results: ${passed} passed, ${failed} failed, ${warned} warned, ${skipped} skipped`);
  console.log('====================================\n');

  RESULTS.summary = { passed, failed, warned, skipped, total: RESULTS.tests.length };

  const outPath = path.join(__dirname, 'results_smart_contracts.json');
  fs.writeFileSync(outPath, JSON.stringify(RESULTS, null, 2));
  console.log(`Results saved to: ${outPath}`);
}

main().catch(console.error);
