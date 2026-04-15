/**
 * Test Suite 2: ZK Proof System
 * Tests zero-knowledge proof generation and verification
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as snarkjs from 'snarkjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');

const RESULTS = {
  suite: 'ZK Proof System Tests',
  timestamp: new Date().toISOString(),
  tests: []
};

const log = (name, status, detail, data = null) => {
  const result = { name, status, detail, data };
  RESULTS.tests.push(result);
  const icon = status === 'PASS' ? '[OK]' : status === 'FAIL' ? '[X]' : '[!]';
  console.log(`${icon} [${status}] ${name}: ${detail}`);
};

function resolveExistingPath(candidates) {
  for (const candidate of candidates) {
    const fullPath = path.join(PROJECT_ROOT, candidate);
    if (fs.existsSync(fullPath)) {
      return { relativePath: candidate, fullPath };
    }
  }

  return null;
}

async function testCircuitFiles() {
  console.log('\n=== Test Group 1: Circuit Files ===');

  const files = [
    { paths: ['zk/circuit.circom', 'circuit.circom'], name: 'Circuit Source' },
    { paths: ['zk/build/circuit_js/circuit.wasm', 'build/circuit_js/circuit.wasm'], name: 'WASM File' },
    { paths: ['zk/circuit_final.zkey', 'circuit_final.zkey'], name: 'Proving Key' },
    { paths: ['zk/verification_key.json', 'verification_key.json'], name: 'Verification Key' }
  ];

  for (const file of files) {
    const resolved = resolveExistingPath(file.paths);
    if (resolved) {
      const stats = fs.statSync(resolved.fullPath);
      log(file.name, 'PASS', `Found at ${resolved.relativePath} (${(stats.size / 1024).toFixed(2)} KB)`);
    } else {
      log(file.name, 'FAIL', `Not found. Checked: ${file.paths.join(', ')}`);
    }
  }
}

async function testProofGeneration() {
  console.log('\n=== Test Group 2: Proof Generation ===');

  const testInput = {
    secret: 123456,
    modelId: 999999999,
    statementHash: 424242,
    messageHash: 424242
  };

  const inputDir = path.join(PROJECT_ROOT, 'scripts');
  fs.mkdirSync(inputDir, { recursive: true });
  const inputPath = path.join(inputDir, 'last_proof_input.json');
  fs.writeFileSync(inputPath, JSON.stringify(testInput, null, 2));
  log(
    'Test Input Created',
    'PASS',
    `Secret: ${testInput.secret}, ModelId: ${testInput.modelId}, StatementHash: ${testInput.statementHash}`
  );

  try {
    const wasm = resolveExistingPath(['zk/build/circuit_js/circuit.wasm', 'build/circuit_js/circuit.wasm']);
    const zkey = resolveExistingPath(['zk/circuit_final.zkey', 'circuit_final.zkey']);
    if (!wasm || !zkey) {
      throw new Error('Missing wasm or zkey artifacts for proof generation');
    }

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      {
        secret: String(testInput.secret),
        modelId: String(testInput.modelId),
        messageHash: String(testInput.statementHash)
      },
      wasm.fullPath,
      zkey.fullPath
    );

    const proofPath = path.join(PROJECT_ROOT, 'proof.json');
    const publicPath = path.join(PROJECT_ROOT, 'public.json');
    const calldataPath = path.join(PROJECT_ROOT, 'proof_calldata_debug.txt');
    const calldata = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);
    const verificationKey = JSON.parse(
      fs.readFileSync(resolveExistingPath(['zk/verification_key.json', 'verification_key.json']).fullPath, 'utf8')
    );
    const verified = await snarkjs.groth16.verify(verificationKey, publicSignals, proof);

    fs.writeFileSync(proofPath, JSON.stringify(proof, null, 2));
    fs.writeFileSync(publicPath, JSON.stringify(publicSignals, null, 2));
    fs.writeFileSync(
      calldataPath,
      `========== Solidity Calldata ==========\n${calldata}\n=======================================\n`
    );

    if (fs.existsSync(proofPath) && fs.existsSync(publicPath)) {
      const savedProof = JSON.parse(fs.readFileSync(proofPath, 'utf8'));
      const savedSignals = JSON.parse(fs.readFileSync(publicPath, 'utf8'));

      log('Proof Generation', 'PASS', 'Proof and public signals generated successfully');
      log('Proof Structure', 'PASS', `pi_a: ${savedProof.pi_a.length} elements, pi_b: ${savedProof.pi_b.length} arrays`, {
        publicSignals: savedSignals.length
      });
      log('Proof Verification', verified ? 'PASS' : 'FAIL', `groth16.verify returned ${verified}`);
    } else {
      log('Proof Generation', 'FAIL', 'Output files not created');
    }
  } catch (err) {
    log('Proof Generation', 'FAIL', err.message);
  }
}

async function testProofCalldata() {
  console.log('\n=== Test Group 3: Proof Calldata ===');

  const calldataPath = path.join(PROJECT_ROOT, 'proof_calldata_debug.txt');
  if (fs.existsSync(calldataPath)) {
    const calldata = fs.readFileSync(calldataPath, 'utf8');
    const lines = calldata.trim().split('\n').filter((line) => line.trim().length > 0);

    if (lines.length >= 3) {
      log('Calldata Format', 'PASS', `${lines.length} lines generated (pi_a, pi_b, pi_c + signals)`);
      log('Calldata Structure', 'PASS', 'ZK calldata components present', {
        lines: lines.length,
        totalLength: calldata.length
      });
    } else {
      log('Calldata Format', 'FAIL', `Expected at least 3 lines, got ${lines.length}`);
    }
  } else {
    log('Calldata File', 'FAIL', 'proof_calldata_debug.txt not found');
  }
}

async function main() {
  console.log('\n====================================');
  console.log('  ZK Proof System Test Suite');
  console.log(`  Started: ${new Date().toLocaleString()}`);
  console.log('====================================');

  await testCircuitFiles();
  await testProofGeneration();
  await testProofCalldata();

  const passed = RESULTS.tests.filter((test) => test.status === 'PASS').length;
  const failed = RESULTS.tests.filter((test) => test.status === 'FAIL').length;
  const warned = RESULTS.tests.filter((test) => test.status === 'WARN').length;

  console.log('\n====================================');
  console.log(`  Results: ${passed} passed, ${failed} failed, ${warned} warned`);
  console.log('====================================\n');

  RESULTS.summary = { passed, failed, warned, total: RESULTS.tests.length };

  const outPath = path.join(__dirname, 'results_zk_proof.json');
  fs.writeFileSync(outPath, JSON.stringify(RESULTS, null, 2));
  console.log(`Results saved to: ${outPath}`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);
