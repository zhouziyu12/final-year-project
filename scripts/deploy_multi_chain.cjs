/**
 * deploy_multi_chain.cjs
 * Deploy contracts directly with ethers.js using the private key from .env.
 */
require("dotenv").config();
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY) {
  console.error("PRIVATE_KEY not found in .env");
  process.exit(1);
}

const NETWORKS = [
  { name: "sepolia", label: "Sepolia", rpc: "https://ethereum-sepolia-rpc.publicnode.com", chainId: 11155111 },
  { name: "tbnb", label: "BSC-Testnet", rpc: "https://bsc-testnet.publicnode.com", chainId: 97 }
];

const OUTPUT = path.join(__dirname, "..", "address_v2_multi.json");

function loadArtifact(name) {
  const map = {
    ModelProvenanceTracker: "ProvenanceTracker.sol/ModelProvenanceTracker.json",
    Groth16Verifier: "Verifier.sol/Groth16Verifier.json",
    ZKProvenanceTracker: "ZKProvenanceTracker.sol/ZKProvenanceTracker.json"
  };
  const rel = map[name] || `${name}.sol/${name}.json`;
  return JSON.parse(fs.readFileSync(path.join(__dirname, "..", "artifacts", "contracts", rel), "utf8"));
}

function getContract(name, addr, wallet) {
  return new ethers.Contract(addr, loadArtifact(name).abi, wallet);
}

async function deployNetwork(net) {
  const { label, rpc } = net;
  console.log(`\n${"=".repeat(55)}`);
  console.log(`  ${label}`);
  console.log("=".repeat(55));

  const provider = new ethers.JsonRpcProvider(rpc);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  console.log(`Account: ${wallet.address}`);

  try {
    const bal = await provider.getBalance(wallet.address);
    console.log(`Balance: ${parseFloat(ethers.formatEther(bal)).toFixed(4)} ETH`);
    if (bal === 0n) {
      console.log("No balance, skip");
      return null;
    }
  } catch (error) {
    console.log("Balance check failed:", error.message.slice(0, 60));
  }

  const deployed = {};

  const CONTRACTS = [
    { name: "ModelAccessControl", args: () => [wallet.address] },
    { name: "ModelRegistry", args: (d) => [d.ModelAccessControl] },
    { name: "Groth16Verifier", args: () => [] },
    { name: "ModelProvenanceTracker", args: (d) => [d.ModelAccessControl, d.ModelRegistry] },
    { name: "ZKProvenanceTracker", args: (d) => [d.ModelAccessControl, d.ModelRegistry, d.Groth16Verifier] },
    { name: "ModelAuditLog", args: (d) => [d.ModelAccessControl] },
    { name: "ModelNFT", args: (d) => [d.ModelAccessControl, d.ModelRegistry] },
    { name: "ModelStaking", args: (d) => [d.ModelAccessControl, wallet.address] }
  ];

  for (const { name: contractName, args } of CONTRACTS) {
    try {
      const art = loadArtifact(contractName);
      const Factory = new ethers.ContractFactory(art.abi, art.bytecode, wallet);
      const contract = await Factory.deploy(...args(deployed), { gasLimit: 10000000 });
      await contract.waitForDeployment();
      const addr = await contract.getAddress();
      deployed[contractName] = addr;
      console.log(`  [+] ${contractName.replace("Model", "")}: ${addr}`);
    } catch (error) {
      console.log(`  [!] ${contractName}: ${error.message.slice(0, 80)}`);
    }
  }

  if (deployed.ModelAccessControl) {
    try {
      const ac = getContract("ModelAccessControl", deployed.ModelAccessControl, wallet);
      const REG = ethers.id("REGISTRAR");
      const AUD = ethers.id("AUDITOR");
      const MIN = ethers.id("MINTER");
      await ac.grantRole(REG, wallet.address, { gasLimit: 100000 });
      await ac.grantRole(AUD, wallet.address, { gasLimit: 100000 });
      await ac.grantRole(MIN, wallet.address, { gasLimit: 100000 });
      console.log("  [+] Roles granted");
    } catch (error) {
      console.log(`  [!] Roles: ${error.message.slice(0, 80)}`);
    }
  }

  return Object.keys(deployed).length > 0 ? deployed : null;
}

async function main() {
  console.log("\n" + "=".repeat(55));
  console.log("  AI Provenance v2 - Multi-Chain Deployment");
  console.log(`  ${new Date().toLocaleString()}`);
  console.log("=".repeat(55));

  let results = {};
  if (fs.existsSync(OUTPUT)) {
    try {
      results = JSON.parse(fs.readFileSync(OUTPUT, "utf8"));
    } catch {
      results = {};
    }
  }
  for (const net of NETWORKS) {
    const deployed = await deployNetwork(net);
    if (deployed) {
      const provider = new ethers.JsonRpcProvider(net.rpc);
      const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
      results[net.name] = {
        deployer: wallet.address,
        contracts: deployed,
        timestamp: new Date().toISOString()
      };
    }
  }

  fs.writeFileSync(OUTPUT, JSON.stringify(results, null, 2));
  console.log(`\nSaved: ${OUTPUT}`);

  console.log("\n" + "=".repeat(55));
  console.log("  Summary");
  console.log("=".repeat(55));
  for (const [net, data] of Object.entries(results)) {
    console.log(`\n${net.toUpperCase()} (${data.deployer})`);
    for (const [name, address] of Object.entries(data.contracts)) {
      console.log(`  ${name}: ${address}`);
    }
  }
}

main().catch(console.error);
