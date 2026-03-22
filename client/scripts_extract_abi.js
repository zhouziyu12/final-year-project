import fs from "fs";
import path from "path";

const artifactsPath = "../artifacts/contracts";
const addressPath = "../address_real.json";
const outputPath = "src/abis.json";

try {
  const getAbi = (contractName, file) => {
    const p = path.join(artifactsPath, file, contractName + ".json");
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p)).abi;
  };

  const abis = {
    ModelRegistry: getAbi("ModelRegistry", "ModelRegistry.sol"),
    ProvenanceTracker: getAbi("ProvenanceTracker", "ProvenanceTracker.sol"),
    Verifier: getAbi("Verifier", "Verifier.sol"),
    addresses: fs.existsSync(addressPath) ? JSON.parse(fs.readFileSync(addressPath)) : {}
  };

  fs.writeFileSync(outputPath, JSON.stringify(abis, null, 2));
  console.log("ABI extracted successfully.");
} catch (e) {
  console.error("Error extracting ABI:", e.message);
}
