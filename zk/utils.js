/**
 * ZK Circuit Input Generator
 * 
 * Utility for generating valid circuit inputs and verifying proofs.
 * 
 * Usage:
 *   node utils.js generate <modelId> <secret>
 *   node utils.js prove <modelId> <secret>
 *   node utils.js verify <proof.json> <public.json>
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BUILD_DIR = path.join(__dirname, 'build');

// ─── Poseidon Hash (simplified for demo) ───────────────────────────────────────
// For production, use proper circomlibjs or snarkjs hash functions

/**
 * Generate a simple hash for input generation
 * Note: For actual circuit, use the WASM-generated witness
 */
function simpleHash(modelId, secret) {
  // This is a placeholder - real hash requires circuit execution
  const data = `${modelId}:${secret}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generate circuit input JSON
 */
function generateInput(modelId, secret) {
  // Convert inputs to field elements
  // Note: Real Circom circuits use babyjubjub field, this is simplified
  const input = {
    modelId: BigInt(modelId),
    secret: BigInt(secret)
  };
  
  return input;
}

/**
 * Generate proof using snarkjs
 */
async function generateProof(modelId, secret) {
  console.log(`\n🔐 Generating proof for modelId=${modelId}, secret hidden...`);
  
  // Step 1: Create input file
  const input = generateInput(modelId, secret);
  const inputPath = path.join(BUILD_DIR, 'input.json');
  fs.writeFileSync(inputPath, JSON.stringify(input, null, 2));
  console.log(`📝 Input written to: ${inputPath}`);
  
  // Step 2: Calculate witness
  const wasmPath = path.join(BUILD_DIR, 'circuit_js', 'circuit.wasm');
  const wtnsPath = path.join(BUILD_DIR, 'witness.wtns');
  
  if (fs.existsSync(wasmPath)) {
    console.log('🧮 Calculating witness...');
    execSync(`npx snarkjs wtns calculate "${wasmPath}" "${inputPath}" "${wtnsPath}"`, {
      cwd: BUILD_DIR,
      stdio: 'inherit'
    });
    console.log('✅ Witness calculated');
  } else {
    console.log('⚠️  WASM not found. Compile circuit first with: ./compile.sh');
    return null;
  }
  
  // Step 3: Generate proof
  const zkeyPath = path.join(BUILD_DIR, 'circuit_final.zkey');
  const provePath = path.join(BUILD_DIR, 'proof.json');
  const publicPath = path.join(BUILD_DIR, 'public.json');
  
  if (fs.existsSync(zkeyPath)) {
    console.log('🔐 Generating proof...');
    execSync(`npx snarkjs groth16 prove "${zkeyPath}" "${wtnsPath}" "${provePath}" "${publicPath}"`, {
      cwd: BUILD_DIR,
      stdio: 'inherit'
    });
    console.log('✅ Proof generated!');
    
    // Step 4: Verify proof
    const vkPath = path.join(BUILD_DIR, 'verification_key.json');
    console.log('✅ Verifying proof...');
    const result = execSync(`npx snarkjs groth16 verify "${vkPath}" "${publicPath}" "${provePath}"`, {
      cwd: BUILD_DIR,
      encoding: 'utf8'
    });
    
    if (result.includes('OK!')) {
      console.log('✅ Proof is valid!');
    } else {
      console.log('❌ Proof verification failed');
    }
    
    return { proof: provePath, public: publicPath };
  } else {
    console.log('⚠️  Final zkey not found. Complete trusted setup first.');
    return null;
  }
}

/**
 * Verify an existing proof
 */
function verifyProof(proofPath, publicPath) {
  const vkPath = path.join(BUILD_DIR, 'verification_key.json');
  
  console.log(`\n🔍 Verifying proof...`);
  console.log(`Proof: ${proofPath}`);
  console.log(`Public: ${publicPath}`);
  
  try {
    const result = execSync(
      `npx snarkjs groth16 verify "${vkPath}" "${publicPath}" "${proofPath}"`,
      { cwd: BUILD_DIR, encoding: 'utf8' }
    );
    
    if (result.includes('OK!')) {
      console.log('✅ Proof is valid!\n');
      return true;
    } else {
      console.log('❌ Proof verification failed\n');
      return false;
    }
  } catch (e) {
    console.log('❌ Verification error:', e.message);
    return false;
  }
}

/**
 * Export Solidity verifier
 */
function exportSolidityVerifier() {
  const zkeyPath = path.join(BUILD_DIR, 'circuit_final.zkey');
  const outputPath = path.join(__dirname, '..', 'contracts', 'ZKVerifier.sol');
  
  if (!fs.existsSync(zkeyPath)) {
    console.log('⚠️  Final zkey not found. Complete trusted setup first.');
    return;
  }
  
  console.log(`\n📝 Exporting Solidity verifier to: ${outputPath}`);
  execSync(`npx snarkjs zkey export solidityverifier "${zkeyPath}" "${outputPath}"`, {
    cwd: BUILD_DIR,
    stdio: 'inherit'
  });
  console.log('✅ Solidity verifier exported!');
}

// ─── CLI Interface ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const command = args[0] || 'help';

switch (command) {
  case 'generate':
    // node utils.js generate <modelId> <secret>
    const modelId = parseInt(args[1] || '1');
    const secret = args[2] || crypto.randomBytes(16).toString('hex');
    const input = generateInput(modelId, secret);
    console.log('\n📄 Generated Input:');
    console.log(JSON.stringify(input, (k, v) => typeof v === 'bigint' ? v.toString() : v, 2));
    console.log(`\n🔒 Secret: ${secret} (SAVE THIS - needed for proof generation)`);
    break;
    
  case 'prove':
    // node utils.js prove <modelId> <secret>
    const mid = parseInt(args[1] || '1');
    const sec = args[2];
    if (!sec) {
      console.log('❌ Secret required: node utils.js prove <modelId> <secret>');
      process.exit(1);
    }
    generateProof(mid, sec).then(result => {
      if (result) {
        console.log('\n📄 Proof files:');
        console.log(`  Proof: ${result.proof}`);
        console.log(`  Public: ${result.public}`);
      }
    });
    break;
    
  case 'verify':
    // node utils.js verify <proof.json> <public.json>
    const proofPath = args[1] || path.join(BUILD_DIR, 'proof.json');
    const publicPath = args[2] || path.join(BUILD_DIR, 'public.json');
    verifyProof(proofPath, publicPath);
    break;
    
  case 'export':
    exportSolidityVerifier();
    break;
    
  case 'help':
  default:
    console.log(`
🔐 ZK Circuit Utilities

Usage:
  node utils.js <command> [args]

Commands:
  generate <modelId> [secret]
    Generate circuit input JSON
  
  prove <modelId> <secret>
    Generate a proof for the given model
  
  verify [proof.json] [public.json]
    Verify an existing proof
  
  export
    Export Solidity verifier contract
  
  help
    Show this help message

Examples:
  node utils.js generate 123
  node utils.js prove 123 mysecret123
  node utils.js verify
  node utils.js export
`);
    break;
}
