// Quick blockchain connectivity test
const https = require('https');

const SEPOLIA_RPC = process.env.SEPOLIA_RPC || process.env.SEPOLIA_URL || 'https://rpc.sepolia.org';
const PK = process.env.PRIVATE_KEY || '';

console.log('🔍 Blockchain Connectivity Test\n');

// Test 1: Sepolia RPC
function testRPC(url, name) {
  return new Promise((resolve) => {
    const start = Date.now();
    const data = JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_blockNumber',
      params: [],
      id: 1
    });

    const options = {
      hostname: new URL(url).hostname,
      port: 443,
      path: new URL(url).pathname + new URL(url).search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const ms = Date.now() - start;
        try {
          const json = JSON.parse(body);
          if (json.result) {
            const block = parseInt(json.result, 16);
            console.log(`✓ ${name}: Connected, block #${block} (${ms}ms)`);
            resolve(true);
          } else {
            console.log(`✗ ${name}: Empty response`);
            resolve(false);
          }
        } catch (e) {
          console.log(`✗ ${name}: Parse error - ${body.slice(0, 100)}`);
          resolve(false);
        }
      });
    });

    req.on('error', (e) => {
      console.log(`✗ ${name}: ${e.message}`);
      resolve(false);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      console.log(`✗ ${name}: Timeout`);
      resolve(false);
    });

    req.write(data);
    req.end();
  });
}

// Test 2: Contract addresses exist
const ADDR_FILE = require('path').join(__dirname, '..', 'address_v2_multi.json');

async function main() {
  console.log('Testing RPC endpoints...\n');
  
  await testRPC(SEPOLIA_RPC, 'Sepolia');
  
  console.log('\nChecking contract addresses...');
  try {
    const addrs = JSON.parse(require('fs').readFileSync(ADDR_FILE, 'utf8'));
    console.log('✓ Address file loaded');
    console.log('  Sepolia:', Object.keys(addrs.sepolia?.contracts || {}).length, 'contracts');
    console.log('  BSC Testnet:', Object.keys(addrs.tbnb?.contracts || {}).length, 'contracts');
  } catch (e) {
    console.log('✗ Address file error:', e.message);
  }
  
  console.log('\n✅ Blockchain tests complete');
}

main().catch(console.error);
