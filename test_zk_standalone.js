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
    // Ensure console output is UTF-8 friendly on Windows terminals.
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

  if (secret === undefined || modelId === undefined) {
    throw new Error("Input JSON must contain both 'secret' and 'modelId'.");
  }

  return {
    secret: secret.toString(),
    modelId: modelId.toString(),
  };
}

async function main() {
  setupUtf8ForWindows();

  logStep(1, "Starting standalone ZK robustness test (snarkjs core).");

  // Required input path from your request.
  const inputPath = path.resolve(__dirname, "scripts", "last_proof_input.json");
  const wasmPath = path.resolve(__dirname, "build", "circuit_js", "circuit.wasm");
  const zkeyPath = path.resolve(__dirname, "circuit_final.zkey");
  const proofOutPath = path.resolve(__dirname, "proof.json");
  const publicOutPath = path.resolve(__dirname, "public.json");

  logStep(2, `Loading input file: ${inputPath}`);
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }
  const rawInput = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  const input = normalizeInput(rawInput);
  logInfo(`Input loaded. secret=${input.secret}, modelId=${input.modelId}`);

  logStep(3, "Checking circuit artifacts...");
  if (!fs.existsSync(wasmPath)) {
    throw new Error(`WASM not found: ${wasmPath}`);
  }
  if (!fs.existsSync(zkeyPath)) {
    throw new Error(`ZKey not found: ${zkeyPath}`);
  }
  logInfo("Circuit artifacts found.");

  logStep(4, "Generating Groth16 proof (no hard timeout; waiting until completion)...");
  const start = Date.now();

  // Verbose heartbeat so you can see progress during long witness/proof generation.
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

  logStep(6, "Converting proof to Solidity calldata...");
  const calldata = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);

  logInfo("Calldata conversion completed.");
  
  // Write to file for Python SDK file-bridge mode (Windows pipe deadlock workaround)
  const calldataDebugPath = path.resolve(__dirname, "proof_calldata_debug.txt");
  const calldataContent = `========== Solidity Calldata ==========\n${calldata}\n=======================================\n`;
  fs.writeFileSync(calldataDebugPath, calldataContent, "utf8");
  logInfo(`Calldata written to: ${calldataDebugPath}`);

  console.log("\n========== Solidity Calldata ==========");
  console.log(calldata);
  console.log("=======================================\n");

  logStep(7, "Standalone ZK test finished successfully.");
  process.exit(0);  // Explicit success exit
}

main().catch((err) => {
  logError(err?.stack || err?.message || String(err));
  process.exit(1);
});
