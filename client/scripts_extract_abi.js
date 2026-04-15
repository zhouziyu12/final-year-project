/* global process */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");
const artifactsPath = path.join(projectRoot, "artifacts", "contracts");
const addressPath = path.join(projectRoot, "address_v2_multi.json");
const outputPath = path.join(scriptDir, "src", "abis.json");

function getAbi(fileName, contractName) {
  const artifactPath = path.join(artifactsPath, fileName, `${contractName}.json`);
  if (!fs.existsSync(artifactPath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(artifactPath, "utf8")).abi;
}

try {
  const addresses = fs.existsSync(addressPath)
    ? JSON.parse(fs.readFileSync(addressPath, "utf8"))
    : {};

  const abis = {
    generatedAt: new Date().toISOString(),
    addresses,
    ModelAccessControl: getAbi("ModelAccessControl.sol", "ModelAccessControl"),
    ModelRegistry: getAbi("ModelRegistry.sol", "ModelRegistry"),
    ModelProvenanceTracker: getAbi("ProvenanceTracker.sol", "ModelProvenanceTracker"),
    ProvenanceTracker: getAbi("ProvenanceTracker.sol", "ModelProvenanceTracker"),
    ZKProvenanceTracker: getAbi("ZKProvenanceTracker.sol", "ZKProvenanceTracker"),
    ModelAuditLog: getAbi("ModelAuditLog.sol", "ModelAuditLog"),
    ModelNFT: getAbi("ModelNFT.sol", "ModelNFT"),
    ModelStaking: getAbi("ModelStaking.sol", "ModelStaking"),
    Groth16Verifier: getAbi("Verifier.sol", "Groth16Verifier"),
    Verifier: getAbi("Verifier.sol", "Verifier"),
    RealZKBridge: getAbi("RealZKBridge.sol", "RealZKBridge")
  };

  fs.writeFileSync(outputPath, `${JSON.stringify(abis, null, 2)}\n`);
  console.log(`ABI extracted successfully to ${outputPath}`);
} catch (error) {
  console.error("Error extracting ABI:", error.message);
  process.exitCode = 1;
}
