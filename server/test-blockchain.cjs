// Quick blockchain connectivity test.
const https = require('https');
const path = require('path');
const fs = require('fs');

const SEPOLIA_RPC = process.env.SEPOLIA_RPC || process.env.SEPOLIA_URL || 'https://rpc.sepolia.org';
const ADDR_FILE = path.join(__dirname, '..', 'address_v2_multi.json');

console.log('Blockchain Connectivity Test\n');

function testRPC(url, name) {
  return new Promise((resolve) => {
    const start = Date.now();
    const data = JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_blockNumber',
      params: [],
      id: 1
    });

    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        const ms = Date.now() - start;
        try {
          const json = JSON.parse(body);
          if (json.result) {
            const block = parseInt(json.result, 16);
            console.log(`OK ${name}: Connected, block #${block} (${ms}ms)`);
            resolve(true);
          } else {
            console.log(`FAIL ${name}: Empty response`);
            resolve(false);
          }
        } catch (error) {
          console.log(`FAIL ${name}: Parse error - ${body.slice(0, 100)}`);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.log(`FAIL ${name}: ${error.message}`);
      resolve(false);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      console.log(`FAIL ${name}: Timeout`);
      resolve(false);
    });

    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('Testing RPC endpoints...\n');
  await testRPC(SEPOLIA_RPC, 'Sepolia');

  console.log('\nChecking contract addresses...');
  try {
    const addrs = JSON.parse(fs.readFileSync(ADDR_FILE, 'utf8'));
    console.log('OK address file loaded');
    console.log('  Sepolia:', Object.keys(addrs.sepolia?.contracts || {}).length, 'contracts');
    console.log('  BSC Testnet:', Object.keys(addrs.tbnb?.contracts || {}).length, 'contracts');
  } catch (error) {
    console.log('FAIL address file error:', error.message);
  }

  console.log('\nBlockchain tests complete');
}

main().catch(console.error);
