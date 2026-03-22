/**
 * deploy_multi_chain.cjs
 * 使用 .env 私钥直接部署（不依赖 hardhat 网络账户配置）
 * 直接用 ethers.js + dotenv
 */
require("dotenv").config();
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY) {
  console.error("PRIVATE_KEY not found in .env"); process.exit(1);
}

const NETWORKS = [
  { name: "sepolia", label: "Sepolia",    rpc: "https://ethereum-sepolia-rpc.publicnode.com",  chainId: 11155111 },
  { name: "tbnb",    label: "BSC-Testnet",rpc: "https://bsc-testnet.publicnode.com",         chainId: 97      },
  { name: "somnia",  label: "Somnia",     rpc: "https://dream-rpc.somnia.network",            chainId: 50312   },
];

const OUTPUT = path.join(__dirname, "..", "address_v2_multi.json");

function loadArtifact(name) {
  const map = { "ModelProvenanceTracker": "ProvenanceTracker.sol/ModelProvenanceTracker.json" };
  const rel = map[name] || `${name}.sol/${name}.json`;
  return JSON.parse(fs.readFileSync(path.join(__dirname, "..", "artifacts", "contracts", rel), "utf8"));
}

function getContract(name, addr, wallet) {
  return new ethers.Contract(addr, loadArtifact(name).abi, wallet);
}

// 部署顺序：先硬编码依赖，后续合约通过参数传入
async function deployNetwork(net) {
  const { name, label, rpc } = net;
  console.log(`\n${"=".repeat(55)}`);
  console.log(`  ${label}`);
  console.log("=".repeat(55));

  const provider = new ethers.JsonRpcProvider(rpc);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  console.log(`Account: ${wallet.address}`);

  try {
    const bal = await provider.getBalance(wallet.address);
    console.log(`Balance: ${parseFloat(ethers.formatEther(bal)).toFixed(4)} ETH`);
    if (bal === 0n) { console.log("No balance, skip"); return null; }
  } catch (e) {
    console.log("Balance check failed:", e.message.slice(0, 60));
  }

  const deployed = {};

  const CONTRACTS = [
    { name: "ModelAccessControl",     args: () => [wallet.address] },
    { name: "ModelRegistry",          args: (d) => [d.ModelAccessControl] },
    { name: "ModelProvenanceTracker", args: (d) => [d.ModelAccessControl, d.ModelRegistry] },
    { name: "ModelAuditLog",          args: (d) => [d.ModelAccessControl] },
    { name: "ModelNFT",               args: (d) => [d.ModelAccessControl] },
    { name: "ModelStaking",           args: (d) => [d.ModelAccessControl, wallet.address] },
  ];

  for (const { name: cname, args } of CONTRACTS) {
    try {
      const art = loadArtifact(cname);
      const Factory = new ethers.ContractFactory(art.abi, art.bytecode, wallet);
      const c = await Factory.deploy(...args(deployed), { gasLimit: 10000000 });
      await c.waitForDeployment();
      const addr = await c.getAddress();
      deployed[cname] = addr;
      console.log(`  [+] ${cname.replace("Model","")}: ${addr}`);
    } catch (e) {
      console.log(`  [!] ${cname}: ${e.message.slice(0, 80)}`);
    }
  }

  // 分配角色
  if (deployed.ModelAccessControl) {
    try {
      const ac = getContract("ModelAccessControl", deployed.ModelAccessControl, wallet);
      const REG = ethers.id("REGISTRAR");
      const AUD = ethers.id("AUDITOR");
      const MIN = ethers.id("MINTER");
      const AD  = ethers.id("ADMIN");
      await ac.grantRole(REG, wallet.address, { gasLimit: 100000 });
      await ac.grantRole(AUD, wallet.address, { gasLimit: 100000 });
      await ac.grantRole(MIN, wallet.address, { gasLimit: 100000 });
      console.log("  [+] Roles granted");
    } catch (e) {
      console.log(`  [!] Roles: ${e.message.slice(0, 80)}`);
    }
  }

  return Object.keys(deployed).length > 0 ? deployed : null;
}

async function main() {
  console.log("\n" + "=".repeat(55));
  console.log("  AI Provenance v2 - Multi-Chain Deployment");
  console.log(`  ${new Date().toLocaleString()}`);
  console.log("=".repeat(55));

  const results = {};
  for (const net of NETWORKS) {
    const deployed = await deployNetwork(net);
    if (deployed) {
      const provider = new ethers.JsonRpcProvider(net.rpc);
      const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
      results[net.name] = {
        deployer: wallet.address,
        contracts: deployed,
        timestamp: new Date().toISOString(),
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
    for (const [n, a] of Object.entries(data.contracts)) console.log(`  ${n}: ${a}`);
  }
}

main().catch(console.error);
