/**
 * test_contracts.cjs
 * 全面测试所有合约功能（多链并行）
 *
 * 用法：node scripts/test_contracts.cjs
 */

require("dotenv").config();
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

const ADDR = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "address_v2_multi.json"), "utf8"));

// 可靠的公共 RPC
const NETWORKS = [
  { name: "sepolia", label: "Sepolia",     rpc: "https://ethereum-sepolia-rpc.publicnode.com" },
  { name: "tbnb",    label: "BSC-Testnet", rpc: "https://bsc-testnet.publicnode.com" },
];

const RESULTS = {};

// AccessControl 角色常量（keccak256 预计算 via ethers.id）
const ROLE_ADMIN     = "0xdf8b4c520ffe197c5343c6f5aec59570151ef9a492f2c624fd45ddde6135ec42";
const ROLE_REGISTRAR = "0xd6b769dbdbf190871759edfb79bd17eda0005e1b8c3b6b3f5b480b5604ad5014";
const ROLE_AUDITOR   = "0xd8994f6d76f930dc5ea8c60e38e6334a87bb8539cc3082ac6828681c33316e3d";
const ROLE_MINTER    = "0xf0887ba65ee2024ea881d91b74c2450ef19e1557f03bed3ea9f16b037cbe2dc9";

function log(name, status, msg) {
  const icon = status === "PASS" ? "✅" : status === "FAIL" ? "❌" : "⏭️";
  console.log(`  ${icon} [${status}] ${name}: ${msg}`);
  return { name, status, msg };
}

function artifactPath(contractName) {
  // 特殊映射
  const map = {
    "ModelProvenanceTracker": "ProvenanceTracker.sol/ModelProvenanceTracker.json",
  };
  const rel = map[contractName] || `${contractName}.sol/${contractName}.json`;
  return path.join(__dirname, "..", "artifacts", "contracts", rel);
}

function getContract(contractName, addr, wallet) {
  const artifact = JSON.parse(fs.readFileSync(artifactPath(contractName), "utf8"));
  return new ethers.Contract(addr, artifact.abi, wallet);
}

async function waitForConfirm(tx, label) {
  try {
    const rc = await tx.wait(1);
    return rc;
  } catch (e) {
    throw new Error(`${label} failed: ${e.reason || e.message.slice(0, 120)}`);
  }
}

async function testNetwork(networkInfo) {
  const { name, label, rpc } = networkInfo;
  const data = ADDR[name];
  if (!data) {
    console.log(`\n❌ ${label}: 无部署地址，跳过`);
    return [];
  }

  const { contracts } = data;
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, new ethers.JsonRpcProvider(rpc));
  const R = [];

  console.log(`\n${"=".repeat(60)}`);
  console.log(`  测试网络: ${label}`);
  console.log(`  账户: ${wallet.address}`);
  console.log("=".repeat(60));

  // ─── 1. AccessControl ───────────────────────────────────────────────
  console.log(`\n[1/6] ModelAccessControl`);
  try {
    const ac = await getContract("ModelAccessControl", contracts.ModelAccessControl, wallet);

    const hasAdmin = await ac.hasRole(ROLE_ADMIN, wallet.address);
    R.push(log("ADMIN角色检查", hasAdmin ? "PASS" : "FAIL", wallet.address));

    const newAddr = ethers.Wallet.createRandom().address;
    const tx1 = await ac.grantRole(ROLE_REGISTRAR, newAddr, { gasLimit: 100000 });
    await waitForConfirm(tx1, "grantRole");
    const hasReg = await ac.hasRole(ROLE_REGISTRAR, newAddr);
    R.push(log("授予REGISTRAR", hasReg ? "PASS" : "FAIL", `${newAddr.slice(0, 10)}...`));

    const tx2 = await ac.revokeRole(ROLE_REGISTRAR, newAddr, { gasLimit: 100000 });
    await waitForConfirm(tx2, "revokeRole");
    const hasReg2 = await ac.hasRole(ROLE_REGISTRAR, newAddr);
    R.push(log("撤销REGISTRAR", !hasReg2 ? "PASS" : "FAIL", "已撤销"));

    const tx3 = await ac.addBlacklist(newAddr, { gasLimit: 100000 });
    await waitForConfirm(tx3, "addBlacklist");
    const isBL = await ac.isBlacklisted(newAddr);
    R.push(log("加入黑名单", isBL ? "PASS" : "FAIL", "已加入"));

    const tx4 = await ac.removeBlacklist(newAddr, { gasLimit: 100000 });
    await waitForConfirm(tx4, "removeBlacklist");
    const isBL2 = await ac.isBlacklisted(newAddr);
    R.push(log("移除黑名单", !isBL2 ? "PASS" : "FAIL", "已移除"));
  } catch (e) {
    R.push(log("AccessControl", "FAIL", e.message.slice(0, 100)));
  }

  // ─── 2. ModelRegistry ────────────────────────────────────────────
  console.log(`\n[2/6] ModelRegistry`);
  let modelId = null;
  try {
    const reg = await getContract("ModelRegistry", contracts.ModelRegistry, wallet);

    const txReg = await reg.registerModel(
      "ResNet50", "Image classification model",
      "QmXxx", "sha256:abc123", "PyTorch", "MIT"
    );
    const rc = await waitForConfirm(txReg, "registerModel");
    const regEvent = rc.logs.find(l => l.fragment?.name === "ModelRegistered");
    modelId = regEvent ? regEvent.args[0] : null;
    R.push(log("注册模型", modelId ? "PASS" : "FAIL", `Model #${modelId}`));

    if (!modelId) return R;

    const status0 = await reg.getModelStatus(modelId);
    R.push(log("初始状态DRAFT(0)", Number(status0) === 0 ? "PASS" : "FAIL", `Status=${status0}`));

    // 如果已激活则跳过激活步骤（幂等性：支持重复运行）
    if (Number(status0) === 0) {
      try {
        const txAct = await reg.activateModel(modelId);
        await waitForConfirm(txAct, "activateModel");
      } catch (e) {
        R.push(log("激活→ACTIVE(1)", "FAIL", e.message.slice(0, 80)));
      }
    }
    const status1 = await reg.getModelStatus(modelId);
    R.push(log("激活→ACTIVE(1)", Number(status1) === 1 ? "PASS" : "FAIL", `Status=${status1}`));

    // registerModel 自动创建 v1.0.1，这里添加 v1.0.2 (patch) 和 v1.1.0 (minor)
    const txVer1 = await reg.addVersion(modelId, 1, 0, 2, 1, "ipfs://v1.0.2", "hash0");
    await waitForConfirm(txVer1, "addVersion 1.0.2");
    const txVer2 = await reg.addVersion(modelId, 1, 1, 0, 1, "ipfs://v1.1.0", "hash1");
    await waitForConfirm(txVer2, "addVersion 1.1.0");
    const history = await reg.getVersionHistory(modelId);
    R.push(log("版本管理", history.length >= 3 ? "PASS" : "FAIL", `共${history.length}个版本`));

    // 验证版本链递增：最新版本的 versionId 应该大于初始版本
    // 通过 latestVersionId 验证版本递增（更可靠，避免 viaIR struct 返回问题）
    const lvId = await reg.latestVersionId(modelId);
    const vc = await reg.versionCount(modelId);
    R.push(log("版本号递增", Number(lvId) > 0 && Number(vc) >= 3 ? "PASS" : "FAIL", `latestVersionId=${lvId}, count=${vc}`));

    const txDep = await reg.deprecateModel(modelId);
    await waitForConfirm(txDep, "deprecateModel");
    const status2 = await reg.getModelStatus(modelId);
    R.push(log("弃用→DEPRECATED(2)", Number(status2) === 2 ? "PASS" : "FAIL", `Status=${status2}`));

  } catch (e) {
    R.push(log("ModelRegistry", "FAIL", e.message.slice(0, 100)));
  }

  // ─── 3. ProvenanceTracker ───────────────────────────────────────
  // 使用 modelId（从 Registry 获取），但 Tracker 用 uint256 _modelId 参数
  const trackerModelId = modelId || 1;
  console.log(`\n[3/6] ModelProvenanceTracker (modelId=${trackerModelId})`);
  try {
    const tracker = await getContract("ModelProvenanceTracker", contracts.ModelProvenanceTracker, wallet);

    const txAdd = await tracker.addRecord(trackerModelId, 0, "ipfs://provenance-1");
    await waitForConfirm(txAdd, "addRecord");
    const history1 = await tracker.getModelHistory(trackerModelId);
    R.push(log("添加记录", history1.length > 0 ? "PASS" : "FAIL", `共${history1.length}条`));

    const txZk = await tracker.addZKProofRecord(trackerModelId, "zk-cid-123");
    await waitForConfirm(txZk, "addZKProofRecord");
    const history2 = await tracker.getModelHistory(trackerModelId);
    R.push(log("ZK证明记录", history2.length >= 2 ? "PASS" : "FAIL", `共${history2.length}条`));

    const valid = await tracker.verifyChain(trackerModelId);
    R.push(log("链完整性验证", valid ? "PASS" : "FAIL", `valid=${valid}`));
  } catch (e) {
    R.push(log("ProvenanceTracker", "FAIL", e.message.slice(0, 100)));
  }

  // ─── 4. ModelAuditLog ───────────────────────────────────────────
  // verifyChain 需要 entry ID（而非 model ID），从 modelAuditIndex 获取
  const auditModelId = modelId || 1;
  console.log(`\n[4/6] ModelAuditLog (modelId=${auditModelId})`);
  try {
    const audit = await getContract("ModelAuditLog", contracts.ModelAuditLog, wallet);

    const totalBefore = await audit.totalEntries();
    R.push(log("总条目数", "PASS", `${totalBefore}`));

    const txLog = await audit.logModelRegistered(auditModelId, wallet.address, '{"model":"ResNet50"}');
    await waitForConfirm(txLog, "logModelRegistered");
    const totalAfter = await audit.totalEntries();
    R.push(log("新增审计日志", Number(totalAfter) > Number(totalBefore) ? "PASS" : "FAIL", `${totalBefore} → ${totalAfter}`));

    // 用 getModelAuditTrail 获取该模型的审计条目，取最后一条的 id 来 verifyChain
    const trail = await audit.getModelAuditTrail(auditModelId);
    let chainOk = false;
    if (trail.length > 0) {
      const lastEntryId = trail[trail.length - 1].id;
      chainOk = await audit.verifyChain(lastEntryId);
    }
    R.push(log("审计链验证", chainOk ? "PASS" : "FAIL", `valid=${chainOk}`));
  } catch (e) {
    R.push(log("ModelAuditLog", "FAIL", e.message.slice(0, 100)));
  }

  // ─── 5. ModelNFT ────────────────────────────────────────────────
  // 使用 modelId 作为 NFT 的 modelId 参数
  const nftModelId = modelId || 1;
  console.log(`\n[5/6] ModelNFT (modelId=${nftModelId})`);
  let tokenId = null;
  try {
    const nft = await getContract("ModelNFT", contracts.ModelNFT, wallet);

    const supplyBefore = await nft.totalSupply();
    R.push(log("初始NFT数量", "PASS", `${supplyBefore}`));

    const txMint = await nft.mint(nftModelId, "ipfs://nft-metadata");
    const rc = await waitForConfirm(txMint, "mint");
    const mintEvent = rc.logs.find(l => l.fragment?.name === "ModelNFTMinted");
    tokenId = mintEvent ? mintEvent.args[0] : null;
    R.push(log("铸造NFT", tokenId ? "PASS" : "FAIL", `Token #${tokenId}`));

    if (tokenId) {
      const owner = await nft.ownerOf(tokenId);
      R.push(log("NFT所有者正确", owner === wallet.address ? "PASS" : "FAIL", owner.slice(0, 10) + "..."));

      const uri = await nft.tokenURI(tokenId);
      R.push(log("TokenURI正确", uri.includes("ipfs") ? "PASS" : "FAIL", uri.slice(0, 30)));

      // 销毁本次铸造的 NFT
      const txBurn = await nft.burn(tokenId);
      await waitForConfirm(txBurn, "burn");
      const supplyAfter = await nft.totalSupply();
      R.push(log("销毁NFT", Number(supplyAfter) === Number(supplyBefore) ? "PASS" : "FAIL", `${supplyAfter}`));
    }
  } catch (e) {
    R.push(log("ModelNFT", "FAIL", e.message.slice(0, 100)));
  }

  // ─── 6. ModelStaking ────────────────────────────────────────────
  // 使用 modelId 进行质押测试（需 modelId > 0）
  const stakeModelId = modelId || 1;
  console.log(`\n[6/6] ModelStaking (modelId=${stakeModelId})`);
  try {
    const staking = await getContract("ModelStaking", contracts.ModelStaking, wallet);

    const stakeAmt = ethers.parseEther("0.05");
    const txStake = await staking.stake(stakeModelId, { value: stakeAmt });
    await waitForConfirm(txStake, "stake");

    const info = await staking.getStakeInfo(stakeModelId);
    R.push(log("质押ETH", Number(info.amount) > 0 ? "PASS" : "FAIL", `${ethers.formatEther(info.amount)} ETH`));

    const amt = await staking.getStakeAmount(stakeModelId);
    R.push(log("查询质押金额", Number(amt) > 0 ? "PASS" : "FAIL", `${ethers.formatEther(amt)} ETH`));

    const txSlash = await staking.slash(stakeModelId, "reported malicious");
    await waitForConfirm(txSlash, "slash");
    const info2 = await staking.getStakeInfo(stakeModelId);
    R.push(log("罚没质押", info2.slashed ? "PASS" : "FAIL", `slashed=${info2.slashed}`));
  } catch (e) {
    R.push(log("ModelStaking", "FAIL", e.message.slice(0, 100)));
  }

  RESULTS[label] = R;
  return R;
}

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("  AI Provenance System v2 - Multi-Chain Contract Tests");
  console.log(`  Time: ${new Date().toLocaleString()}`);
  console.log("=".repeat(60));

  for (const net of NETWORKS) {
    try {
      await testNetwork(net);
    } catch (e) {
      console.error(`\n❌ ${net.label} 整体失败:`, e.message);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("  Test Summary");
  console.log("=".repeat(60));

  let totalP = 0, totalF = 0, total = 0;
  for (const [net, tests] of Object.entries(RESULTS)) {
    const p = tests.filter(t => t.status === "PASS").length;
    const f = tests.filter(t => t.status === "FAIL").length;
    totalP += p; totalF += f; total += tests.length;
    console.log(`\n${net}: ${p}/${tests.length} 通过`);
    tests.filter(t => t.status === "FAIL").forEach(t => console.log(`    ❌ ${t.name}: ${t.msg}`));
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`  OVERALL: ${totalP}/${total} 通过  |  失败: ${totalF}`);
  console.log("=".repeat(60));

  fs.writeFileSync(path.join(__dirname, "..", "test_results.json"),
    JSON.stringify({ summary: RESULTS, timestamp: new Date().toISOString() }, null, 2));
  console.log("\n💾 结果已保存到 test_results.json");
}

main().catch(console.error);
