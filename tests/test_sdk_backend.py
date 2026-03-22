"""
Test Suite 3: SDK and Backend Integration
Tests Python SDK, backend API, and IPFS integration
"""

import sys
import os
import json
import time
import requests
from datetime import datetime
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

RESULTS = {
    'suite': 'SDK and Backend Integration Tests',
    'timestamp': datetime.utcnow().isoformat() + 'Z',
    'tests': []
}

def log(name, status, detail, data=None):
    result = {'name': name, 'status': status, 'detail': detail, 'data': data}
    RESULTS['tests'].append(result)
    icon = '[PASS]' if status == 'PASS' else '[FAIL]' if status == 'FAIL' else '[WARN]'
    print(f"{icon} {name}: {detail}")

def test_sdk_imports():
    print('\n=== Test Group 1: SDK Imports ===')
    
    try:
        from sdk.python.provenance_sdk import ProvenanceSDK
        log('SDK Import', 'PASS', 'ProvenanceSDK imported successfully')
    except Exception as e:
        log('SDK Import', 'FAIL', str(e))
        return False
    
    try:
        from sdk.python.model_secret_manager import ModelSecretManager
        log('Secret Manager Import', 'PASS', 'ModelSecretManager imported successfully')
    except Exception as e:
        log('Secret Manager Import', 'FAIL', str(e))
        return False
    
    return True

def test_backend_api():
    print('\n=== Test Group 2: Backend API ===')
    
    base_url = 'http://127.0.0.1:3000'
    
    # Test /api/series
    try:
        response = requests.get(f'{base_url}/api/series', timeout=5)
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                series_count = len(data.get('series', []))
                log('GET /api/series', 'PASS', f'Retrieved {series_count} model series')
            else:
                log('GET /api/series', 'FAIL', 'Response success=false')
        else:
            log('GET /api/series', 'FAIL', f'Status code: {response.status_code}')
    except requests.exceptions.ConnectionError:
        log('GET /api/series', 'FAIL', 'Backend not running (connection refused)')
    except Exception as e:
        log('GET /api/series', 'FAIL', str(e))
    
    # Test /api/history
    try:
        response = requests.get(f'{base_url}/api/history', timeout=5)
        if response.status_code == 200:
            data = response.json()
            record_count = len(data)
            log('GET /api/history', 'PASS', f'Retrieved {record_count} records')
        else:
            log('GET /api/history', 'FAIL', f'Status code: {response.status_code}')
    except requests.exceptions.ConnectionError:
        log('GET /api/history', 'SKIP', 'Backend not running')
    except Exception as e:
        log('GET /api/history', 'FAIL', str(e))

def test_secret_manager():
    print('\n=== Test Group 3: Secret Manager ===')
    
    import io
    import sys
    
    try:
        from sdk.python.model_secret_manager import ModelSecretManager
        
        # Redirect stdout to suppress emoji output from SDK
        old_stdout = sys.stdout
        sys.stdout = io.TextIOWrapper(io.BytesIO(), encoding='utf-8')
        
        # Test initialization
        manager = ModelSecretManager()
        
        # Test secret generation
        test_series = f'TestSeries_{int(time.time())}'
        secret = manager.get_or_create_secret(test_series)
        
        # Test version tracking
        test_model_id = 123456789
        test_hash = '0xabcdef1234567890'
        manager.record_version(test_series, 'v1.0', test_model_id, test_hash)
        
        # Verify secret still exists
        retrieved_secret = manager.get_secret(test_series)
        
        # Restore stdout
        sys.stdout = old_stdout
        
        log('Secret Manager Init', 'PASS', 'Initialized successfully')
        
        if secret and len(str(secret)) == 6:
            log('Secret Generation', 'PASS', f'Generated 6-digit secret: {secret}')
        else:
            log('Secret Generation', 'FAIL', f'Invalid secret format: {secret}')
        
        if retrieved_secret == secret:
            log('Version Tracking', 'PASS', f'Version recorded and secret verified: {retrieved_secret}')
        else:
            log('Version Tracking', 'FAIL', 'Secret mismatch after version recording')
        
    except Exception as e:
        try:
            sys.stdout = old_stdout
        except:
            pass
        error_msg = str(e).encode('ascii', 'ignore').decode('ascii')
        log('Secret Manager Tests', 'FAIL', error_msg)

def test_file_structure():
    print('\n=== Test Group 4: File Structure ===')
    
    project_root = Path(__file__).parent.parent
    
    required_files = [
        'server.js',
        'sdk/python/provenance_sdk.py',
        'sdk/python/model_secret_manager.py',
        'test_zk_standalone.js',
        'address_v2_multi.json',
        'server/database.json',
        'contracts/ModelAccessControl.sol',
        'contracts/ModelRegistry.sol',
        'contracts/ModelAuditLog.sol',
        'contracts/ModelNFT.sol',
        'contracts/ModelStaking.sol',
        'scripts/test_contracts.cjs',
        'scripts/deploy_multi_chain.cjs'
    ]
    
    for file_path in required_files:
        full_path = project_root / file_path
        if full_path.exists():
            size_kb = full_path.stat().st_size / 1024
            log(f'File: {file_path}', 'PASS', f'Exists ({size_kb:.2f} KB)')
        else:
            log(f'File: {file_path}', 'FAIL', 'Not found')

def test_ipfs_config():
    print('\n=== Test Group 5: IPFS Configuration ===')
    
    try:
        from dotenv import load_dotenv
        load_dotenv()
        
        pinata_key = os.getenv('PINATA_API_KEY')
        pinata_secret = os.getenv('PINATA_SECRET_KEY')
        
        if pinata_key:
            log('Pinata API Key', 'PASS', f'Configured ({pinata_key[:8]}...)')
        else:
            log('Pinata API Key', 'WARN', 'Not configured in .env')
        
        if pinata_secret:
            log('Pinata Secret Key', 'PASS', 'Configured')
        else:
            log('Pinata Secret Key', 'WARN', 'Not configured in .env')
        
    except Exception as e:
        log('IPFS Config Check', 'FAIL', str(e))

def main():
    print('\n====================================')
    print('  SDK and Backend Integration Tests')
    print(f'  Started: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
    print('====================================')
    
    test_sdk_imports()
    test_backend_api()
    test_secret_manager()
    test_file_structure()
    test_ipfs_config()
    
    passed = len([t for t in RESULTS['tests'] if t['status'] == 'PASS'])
    failed = len([t for t in RESULTS['tests'] if t['status'] == 'FAIL'])
    warned = len([t for t in RESULTS['tests'] if t['status'] == 'WARN'])
    skipped = len([t for t in RESULTS['tests'] if t['status'] == 'SKIP'])
    
    print('\n====================================')
    print(f'  Results: {passed} passed, {failed} failed, {warned} warned, {skipped} skipped')
    print('====================================\n')
    
    RESULTS['summary'] = {
        'passed': passed,
        'failed': failed,
        'warned': warned,
        'skipped': skipped,
        'total': len(RESULTS['tests'])
    }
    
    out_path = Path(__file__).parent / 'results_sdk_backend.json'
    with open(out_path, 'w') as f:
        json.dump(RESULTS, f, indent=2)
    
    print(f'Results saved to: {out_path}')

if __name__ == '__main__':
    main()
