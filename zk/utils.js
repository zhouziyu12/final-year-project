/**
 * ZK Circuit Utilities
 *
 * Usage:
 *   node utils.js generate <modelId> [secret] [messageHash]
 *   node utils.js prove <modelId> <secret> [messageHash]
 *   node utils.js verify [proof.json] [public.json]
 *   node utils.js export
 */

import { execSync } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BUILD_DIR = path.join(__dirname, 'build');
const PROJECT_ROOT = path.join(__dirname, '..');
const SNARK_FIELD =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n;

function normalizeBigInt(value, fieldName) {
  try {
    if (typeof value === 'bigint') return value;
    if (typeof value === 'number') return BigInt(value);
    if (typeof value === 'string' && value.startsWith('0x')) return BigInt(value);
    return BigInt(String(value));
  } catch {
    throw new Error(`Invalid ${fieldName}: ${value}`);
  }
}

function toFieldHash(value) {
  const digest = crypto.createHash('sha256').update(String(value)).digest('hex');
  return BigInt(`0x${digest}`) % SNARK_FIELD;
}

function generateInput(modelId, secret, messageHash = null) {
  return {
    modelId: normalizeBigInt(modelId, 'modelId'),
    secret: normalizeBigInt(secret, 'secret'),
    messageHash: messageHash === null
      ? toFieldHash(`${modelId}:${secret}`)
      : normalizeBigInt(messageHash, 'messageHash')
  };
}

async function generateProof(modelId, secret, messageHash = null) {
  console.log(`\n[proof] Generating proof for modelId=${modelId}`);

  const input = generateInput(modelId, secret, messageHash);
  const inputPath = path.join(BUILD_DIR, 'input.json');
  fs.writeFileSync(
    inputPath,
    JSON.stringify(input, (key, value) => (typeof value === 'bigint' ? value.toString() : value), 2)
  );
  console.log(`[proof] Input written to ${inputPath}`);

  const wasmPath = path.join(BUILD_DIR, 'circuit_js', 'circuit.wasm');
  const wtnsPath = path.join(BUILD_DIR, 'witness.wtns');
  if (!fs.existsSync(wasmPath)) {
    console.log('[proof] WASM not found. Compile circuit first with: ./compile.sh');
    return null;
  }

  console.log('[proof] Calculating witness');
  execSync(`npx snarkjs wtns calculate "${wasmPath}" "${inputPath}" "${wtnsPath}"`, {
    cwd: BUILD_DIR,
    stdio: 'inherit'
  });

  const zkeyPath = path.join(__dirname, 'circuit_final.zkey');
  const proofPath = path.join(PROJECT_ROOT, 'proof.json');
  const publicPath = path.join(PROJECT_ROOT, 'public.json');
  if (!fs.existsSync(zkeyPath)) {
    console.log('[proof] Final zkey not found. Complete trusted setup first.');
    return null;
  }

  console.log('[proof] Generating proof');
  execSync(`npx snarkjs groth16 prove "${zkeyPath}" "${wtnsPath}" "${proofPath}" "${publicPath}"`, {
    cwd: BUILD_DIR,
    stdio: 'inherit'
  });
  console.log('[proof] Proof generated');

  const vkPath = path.join(__dirname, 'verification_key.json');
  console.log('[proof] Verifying proof');
  const result = execSync(`npx snarkjs groth16 verify "${vkPath}" "${publicPath}" "${proofPath}"`, {
    cwd: BUILD_DIR,
    encoding: 'utf8'
  });

  if (result.includes('OK!')) {
    console.log('[proof] Proof is valid');
  } else {
    console.log('[proof] Proof verification failed');
  }

  return { proof: proofPath, public: publicPath };
}

function verifyProof(proofPath, publicPath) {
  const vkPath = path.join(__dirname, 'verification_key.json');

  console.log('\n[verify] Verifying proof');
  console.log(`Proof: ${proofPath}`);
  console.log(`Public: ${publicPath}`);

  try {
    const result = execSync(
      `npx snarkjs groth16 verify "${vkPath}" "${publicPath}" "${proofPath}"`,
      { cwd: BUILD_DIR, encoding: 'utf8' }
    );

    if (result.includes('OK!')) {
      console.log('[verify] Proof is valid\n');
      return true;
    }

    console.log('[verify] Proof verification failed\n');
    return false;
  } catch (error) {
    console.log('[verify] Verification error:', error.message);
    return false;
  }
}

function exportSolidityVerifier() {
  const zkeyPath = path.join(__dirname, 'circuit_final.zkey');
  const outputPath = path.join(PROJECT_ROOT, 'contracts', 'Verifier.sol');

  if (!fs.existsSync(zkeyPath)) {
    console.log('[export] Final zkey not found. Complete trusted setup first.');
    return;
  }

  console.log(`\n[export] Exporting Solidity verifier to ${outputPath}`);
  execSync(`npx snarkjs zkey export solidityverifier "${zkeyPath}" "${outputPath}"`, {
    cwd: BUILD_DIR,
    stdio: 'inherit'
  });
  console.log('[export] Solidity verifier exported');
}

const args = process.argv.slice(2);
const command = args[0] || 'help';

switch (command) {
  case 'generate': {
    const modelId = parseInt(args[1] || '1', 10);
    const secret = args[2] || '123456';
    const messageHash = args[3] || toFieldHash(`${modelId}:${secret}`).toString();
    const input = generateInput(modelId, secret, messageHash);
    console.log('\n[input] Generated Input:');
    console.log(JSON.stringify(input, (key, value) => (typeof value === 'bigint' ? value.toString() : value), 2));
    console.log(`\n[input] Secret: ${secret}`);
    break;
  }

  case 'prove': {
    const modelId = parseInt(args[1] || '1', 10);
    const secret = args[2];
    const messageHash = args[3] || null;
    if (!secret) {
      console.log('Secret required: node utils.js prove <modelId> <secret> [messageHash]');
      process.exit(1);
    }
    generateProof(modelId, secret, messageHash).then((result) => {
      if (result) {
        console.log('\n[proof] Proof files:');
        console.log(`  Proof: ${result.proof}`);
        console.log(`  Public: ${result.public}`);
      }
    });
    break;
  }

  case 'verify': {
    const proofPath = args[1] || path.join(PROJECT_ROOT, 'proof.json');
    const publicPath = args[2] || path.join(PROJECT_ROOT, 'public.json');
    verifyProof(proofPath, publicPath);
    break;
  }

  case 'export':
    exportSolidityVerifier();
    break;

  case 'help':
  default:
    console.log(`
ZK Circuit Utilities

Usage:
  node utils.js <command> [args]

Commands:
  generate <modelId> [secret] [messageHash]
    Generate circuit input JSON

  prove <modelId> <secret> [messageHash]
    Generate a proof for the given model

  verify [proof.json] [public.json]
    Verify an existing proof

  export
    Export Solidity verifier contract
`);
    break;
}
