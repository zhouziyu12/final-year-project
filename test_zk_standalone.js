#!/usr/bin/env node
import * as snarkjs from "snarkjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function setupUtf8ForWindows() {
  if (process.platform !== "win32") return;

  try {
    if (process.stdout && typeof process.stdout.setDefaultEncoding === "function") {
      process.stdout.setDefaultEncoding("utf8");
    }
    if (process.stderr && typeof process.stderr.setDefaultEncoding === "function") {
      process.stderr.setDefaultEncoding("utf8");
    }
  } catch {
    // Non-fatal; continue execution.
  }
}

function logStep(step, message) {
  const now = new Date().toISOString();
  console.log(`[${now}] [STEP ${step}] ${message}`);
}

function logInfo(message) {
  const now = new Date().toISOString();
  console.log(`[${now}] [INFO] ${message}`);
}

function logError(message) {
  const now = new Date().toISOString();
  console.error(`[${now}] [ERROR] ${message}`);
}

function normalizeInput(raw) {
  const secret = raw?.secret;
  const modelId = raw?.modelId;
  const messageHash = raw?.messageHash ?? "424242";

  if (secret === undefined || modelId === undefined) {
    throw new Error("Input JSON must contain both 'secret' and 'modelId'.");
  }

  return {
    secret: secret.toString(),
    modelId: modelId.toString(),
    messageHash: messageHash.toString(),
  };
}

function resolveExistingPath(candidates, label) {
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(`${label} not found. Checked: ${candidates.join(", ")}`);
}

async function main() {
  setupUtf8ForWindows();

  logStep(1, "Starting standalone ZK robustness test (snarkjs core).");

  const inputPath = path.resolve(__dirname, "scripts", "last_proof_input.json");
  const proofOutPath = path.resolve(__dirname, "proof.json");
  const publicOutPath = path.resolve(__dirname, "public.json");
  const wasmPath = resolveExistingPath(
    [
      path.resolve(__dirname, "build", "circuit_js", "circuit.wasm"),
      path.resolve(__dirname, "zk", "build", "circuit_js", "circuit.wasm"),
    ],
    "WASM"
  );
  const zkeyPath = resolveExistingPath(
    [
      path.resolve(__dirname, "circuit_final.zkey"),
      path.resolve(__dirname, "zk", "circuit_final.zkey"),
    ],
    "ZKey"
  );
  const verificationKeyPath = resolveExistingPath(
    [
      path.resolve(__dirname, "verification_key.json"),
      path.resolve(__dirname, "zk", "verification_key.json"),
    ],
    "Verification key"
  );

  logStep(2, `Loading input file: ${inputPath}`);
  let rawInput;
  if (!fs.existsSync(inputPath)) {
    rawInput = { secret: "123456", modelId: "999999999", messageHash: "424242" };
    fs.writeFileSync(inputPath, JSON.stringify(rawInput, null, 2), "utf8");
    logInfo("Input file was missing. Created a default proof input for standalone testing.");
  } else {
    rawInput = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  }
  const input = normalizeInput(rawInput);
  logInfo(
    `Input loaded. secret=${input.secret}, modelId=${input.modelId}, messageHash=${input.messageHash}`
  );

  logStep(3, "Checking circuit artifacts...");
  logInfo(`Circuit artifacts found. wasm=${wasmPath}, zkey=${zkeyPath}`);

  logStep(4, "Generating Groth16 proof (no hard timeout; waiting until completion)...");
  const start = Date.now();
  const heartbeat = setInterval(() => {
    const sec = Math.floor((Date.now() - start) / 1000);
    logInfo(`Proof generation in progress... elapsed=${sec}s`);
  }, 15000);

  let proof;
  let publicSignals;
  try {
    const result = await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);
    proof = result.proof;
    publicSignals = result.publicSignals;
  } finally {
    clearInterval(heartbeat);
  }

  const elapsedMs = Date.now() - start;
  logInfo(`Proof generation completed in ${(elapsedMs / 1000).toFixed(2)}s.`);

  logStep(5, `Writing outputs: ${proofOutPath}, ${publicOutPath}`);
  fs.writeFileSync(proofOutPath, JSON.stringify(proof, null, 2), "utf8");
  fs.writeFileSync(publicOutPath, JSON.stringify(publicSignals, null, 2), "utf8");
  logInfo("proof.json and public.json generated successfully.");

  logStep(5.5, "Verifying proof against verification_key.json...");
  const verificationKey = JSON.parse(fs.readFileSync(verificationKeyPath, "utf8"));
  const verified = await snarkjs.groth16.verify(verificationKey, publicSignals, proof);
  if (!verified) {
    throw new Error("Generated proof did not verify against verification_key.json");
  }
  logInfo("Generated proof verified successfully.");

  logStep(6, "Converting proof to Solidity calldata...");
  const calldata = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);
  logInfo("Calldata conversion completed.");

  const calldataDebugPath = path.resolve(__dirname, "proof_calldata_debug.txt");
  const calldataContent = `========== Solidity Calldata ==========\n${calldata}\n=======================================\n`;
  fs.writeFileSync(calldataDebugPath, calldataContent, "utf8");
  logInfo(`Calldata written to: ${calldataDebugPath}`);

  console.log("\n========== Solidity Calldata ==========");
  console.log(calldata);
  console.log("=======================================\n");

  logStep(7, "Standalone ZK test finished successfully.");
  process.exit(0);
}

main().catch((err) => {
  logError(err?.stack || err?.message || String(err));
  process.exit(1);
});
