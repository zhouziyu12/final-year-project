// Full API test script with env loading.
const http = require('http');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length > 0 && !key.startsWith('#')) {
      process.env[key.trim()] = vals.join('=').trim();
    }
  });
  console.log('.env loaded');
}

const BASE_URL = 'http://localhost:3000';
let server = null;

function httpGet(urlPath) {
  return new Promise((resolve, reject) => {
    http
      .get(`${BASE_URL}${urlPath}`, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, data });
          }
        });
      })
      .on('error', reject);
  });
}

async function runTests() {
  console.log('\nFull Stack API Test\n');
  console.log('-'.repeat(50));

  const tests = [
    { name: 'Health Check', path: '/api/health', expect: 200 },
    { name: 'Status', path: '/api/v2/status', expect: 200 },
    { name: 'Models', path: '/api/v2/models', expect: 200 },
    { name: 'Audit Events', path: '/api/v2/audit/recent?chain=tbnb', expect: 200 },
    { name: '404 Route', path: '/api/nonexistent', expect: 404 }
  ];

  for (const test of tests) {
    process.stdout.write(`\nRequest ${test.name}... `);
    try {
      const res = await httpGet(test.path);
      const expected = Array.isArray(test.expect) ? test.expect : [test.expect];
      const passed = expected.includes(res.status);

      if (passed) {
        console.log(`OK ${res.status}`);
      } else {
        console.log(`FAIL expected ${expected.join('/')} got ${res.status}`);
      }
    } catch (error) {
      console.log(`FAIL ${error.message}`);
    }
  }

  process.stdout.write('\nRequest Error Handling... ');
  try {
    const res = await httpGet('/api/v2/models/invalid');
    if (res.status === 400) {
      console.log('OK invalid ID returns 400');
    } else {
      console.log(`WARN returned ${res.status} instead of 400`);
    }
  } catch (error) {
    console.log(`FAIL ${error.message}`);
  }

  console.log('\n' + '-'.repeat(50));
  console.log('API tests complete\n');
}

async function main() {
  console.log('Starting server...');

  const serverPath = path.join(__dirname, 'server.js');
  server = spawn('node', [serverPath], {
    cwd: __dirname,
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, PORT: '3000' }
  });

  server.stdout.on('data', (data) => process.stdout.write(data));
  server.stderr.on('data', (data) => process.stderr.write(data));

  await new Promise((resolve) => setTimeout(resolve, 3000));

  try {
    await runTests();
  } finally {
    server.kill();
    console.log('Server stopped');
  }
}

main().catch(console.error);
