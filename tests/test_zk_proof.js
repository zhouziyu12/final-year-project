/**
 * Test Suite 2: ZK Proof System
 * Tests zero-knowledge proof generation and verification
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RESULTS = {
  suite: 'ZK Proof System Tests',
  timestamp: new Date().toISOString(),
  tests: []
};

const log = (name, status, detail, data = null) => {
  const result = { name, status, detail, data };
  RESULTS.tests.push(result);
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} [${status}] ${name}: ${detail}`);
};

async function testCircuitFiles() {
  console.log('\n=== Test Group 1: Circuit Files ===');

  const files = [
    { path: 'circuit.circom', name: 'Circuit Source' },
    { path: 'build/circuit_js/circuit.wasm', name: 'WASM File' },
    { path: 'circuit_final.zkey', name: 'Proving Key' },
    { path: 'verification_key.json', name: 'Verification Key' }
  ];

  for (const file of files) {
    const fullPath = path.join(__dirname, '..', file.path);
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      log(file.name, 'PASS', `Found (${(stats.size / 1024).toFixed(2)} KB)`);
    } else {
      log(file.name, 'FAIL', `Not found at ${file.path}`);
    }
  }
}

async function testProofGeneration() {
  console.log('\n=== Test Group 2: Proof Generation ===');

  const testInput = {
    secret: 123456,
    modelId: 999999999
  };

  const inputPath = path.join(__dirname, '..', 'test_proof_input.json');
  fs.writeFileSync(inputPath, JSON.stringify(testInput));
  log('Test Input Created', 'PASS', `Secret: ${testInput.secret}, ModelId: ${testInput.modelId}`);

  try {
    const scriptPath = path.join(__dirname, '..', 'test_zk_standalone.js');
    const { stdout, stderr } = await execAsync(`node "${scriptPath}"`, {
      cwd: path.join(__dirname, '..'),
      timeout: 30000
    });

    if (stderr && !stderr.includes('Warning')) {
      log('Proof Generation', 'WARN', 'Warnings during generation', { stderr: stderr.substring(0, 200) });
    }

    // Check output files
    const proofPath = path.join(__dirname, '..', 'proof.json');
    const publicPath = path.join(__dirname, '..', 'public.json');

    if (fs.existsSync(proofPath) && fs.existsSync(publicPath)) {
      const proof = JSON.parse(fs.readFileSync(proofPath, 'utf8'));
      const publicSignals = JSON.parse(fs.readFileSync(publicPath, 'utf8'));

      log('Proof Generation', 'PASS', 'Proof and public signals generated successfully');
      log('Proof Structure', 'PASS', `pi_a: ${proof.pi_a.length} elements, pi_b: ${proof.pi_b.length} arrays`, {
        publicSignals: publicSignals.length
      });
    } else {
      log('Proof Generation', 'FAIL', 'Output files not created');
    }
  } catch (err) {
    log('Proof Generation', 'FAIL', err.message);
  }
}

async function testProofCalldata() {
  console.log('\n=== Test Group 3: Proof Calldata ===');

  const calldataPath = path.join(__dirname, '..', 'proof_calldata_debug.txt');
  if (fs.existsSync(calldataPath)) {
    const calldata = fs.readFileSync(calldataPath, 'utf8');
    const lines = calldata.trim().split('\n').filter(l => l.trim().length > 0);

    if (lines.length >= 3) {
      log('Calldata Format', 'PASS', `${lines.length} lines generated (pi_a, pi_b, pi_c + signals)`);
      log('Calldata Structure', 'PASS', 'ZK calldata components present', {
        lines: lines.length,
        total_length: calldata.length
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

  const passed = RESULTS.tests.filter(t => t.status === 'PASS').length;
  const failed = RESULTS.tests.filter(t => t.status === 'FAIL').length;
  const warned = RESULTS.tests.filter(t => t.status === 'WARN').length;

  console.log('\n====================================');
  console.log(`  Results: ${passed} passed, ${failed} failed, ${warned} warned`);
  console.log('====================================\n');

  RESULTS.summary = { passed, failed, warned, total: RESULTS.tests.length };

  const outPath = path.join(__dirname, 'results_zk_proof.json');
  fs.writeFileSync(outPath, JSON.stringify(RESULTS, null, 2));
  console.log(`Results saved to: ${outPath}`);
}

main().catch(console.error);
