"""
Test Suite 3: SDK and Backend Integration.

This suite validates the Python SDK imports, backend health/status routes,
the current model and audit APIs, and basic local file layout assumptions.
"""

import json
import os
import secrets
import sys
import time
from datetime import UTC, datetime
from pathlib import Path

import requests

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover - optional dependency fallback
    load_dotenv = None

sys.path.insert(0, str(Path(__file__).parent.parent))

RESULTS = {
    'suite': 'SDK and Backend Integration Tests',
    'timestamp': datetime.now(UTC).isoformat().replace('+00:00', 'Z'),
    'tests': []
}

if load_dotenv:
    load_dotenv(Path(__file__).parent.parent / '.env', override=False)


def log(name, status, detail, data=None):
    result = {'name': name, 'status': status, 'detail': detail, 'data': data}
    RESULTS['tests'].append(result)
    icon = '[PASS]' if status == 'PASS' else '[FAIL]' if status == 'FAIL' else '[WARN]'
    print(f"{icon} {name}: {detail}")


def test_sdk_imports():
    print('\n=== Test Group 1: SDK Imports ===')

    try:
        from sdk.python.provenance_sdk import ProvenanceSDK  # noqa: F401
        log('SDK Import', 'PASS', 'ProvenanceSDK imported successfully')
    except Exception as error:
        log('SDK Import', 'FAIL', str(error))
        return False

    try:
        from sdk.python.model_secret_manager import ModelSecretManager  # noqa: F401
        log('Secret Manager Import', 'PASS', 'ModelSecretManager imported successfully')
    except Exception as error:
        log('Secret Manager Import', 'FAIL', str(error))
        return False

    return True


def test_backend_api():
    print('\n=== Test Group 2: Backend API ===')
    base_url = 'http://127.0.0.1:3000'

    routes = [
        ('GET /api/health', f'{base_url}/api/health'),
        ('GET /api/v2/status', f'{base_url}/api/v2/status'),
        ('GET /api/v2/models', f'{base_url}/api/v2/models'),
        ('GET /api/v2/audit/recent', f'{base_url}/api/v2/audit/recent')
    ]

    for name, url in routes:
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    log(name, 'PASS', 'Endpoint returned success=true')
                else:
                    log(name, 'FAIL', 'Endpoint returned success=false')
            else:
                log(name, 'FAIL', f'Status code: {response.status_code}')
        except requests.exceptions.ConnectionError:
            log(name, 'FAIL', 'Backend not running (connection refused)')
        except Exception as error:
            log(name, 'FAIL', str(error))


def build_write_headers():
    api_key = os.getenv('WRITE_API_KEY')
    if not api_key:
        raise RuntimeError('WRITE_API_KEY is not configured for authenticated backend tests')
    return {
        'x-api-key': api_key,
        'x-auth-timestamp': str(int(time.time() * 1000)),
        'x-auth-nonce': secrets.token_hex(16),
    }


def test_backend_write_auth():
    print('\n=== Test Group 2B: Backend Write Authentication ===')
    base_url = 'http://127.0.0.1:3000'

    try:
        unauthorized = requests.post(f'{base_url}/api/register', json={}, timeout=5)
        if unauthorized.status_code == 401:
            log('POST /api/register without auth', 'PASS', 'Unauthenticated write rejected with 401')
        else:
            log('POST /api/register without auth', 'FAIL', f'Expected 401, got {unauthorized.status_code}')
    except Exception as error:
        log('POST /api/register without auth', 'FAIL', str(error))

    try:
        authorized = requests.post(
            f'{base_url}/api/register',
            json={},
            headers=build_write_headers(),
            timeout=5,
        )
        if authorized.status_code == 400:
            log('POST /api/register with auth', 'PASS', 'Authenticated write passed auth and failed at validation')
        else:
            log('POST /api/register with auth', 'FAIL', f'Expected 400, got {authorized.status_code}')
    except Exception as error:
        log('POST /api/register with auth', 'FAIL', str(error))


def test_secret_manager():
    print('\n=== Test Group 3: Secret Manager ===')
    import io

    try:
        from sdk.python.model_secret_manager import ModelSecretManager

        old_stdout = sys.stdout
        sys.stdout = io.TextIOWrapper(io.BytesIO(), encoding='utf-8')

        manager = ModelSecretManager()
        test_series = f'TestSeries_{int(time.time())}'
        secret = manager.get_or_create_secret(test_series)
        manager.record_version(test_series, 'v1.0', 123456789, '0xabcdef1234567890')
        retrieved_secret = manager.get_secret(test_series)

        sys.stdout = old_stdout

        log('Secret Manager Init', 'PASS', 'Initialized successfully')
        if secret and len(str(secret)) >= 32:
            log('Secret Generation', 'PASS', f'Generated high-entropy secret ({len(str(secret))} chars)')
        else:
            log('Secret Generation', 'FAIL', f'Invalid secret format: {secret}')

        if retrieved_secret == secret:
            log('Version Tracking', 'PASS', 'Version recorded and secret verified')
        else:
            log('Version Tracking', 'FAIL', 'Secret mismatch after version recording')

        raw_store = manager.secrets_file.read_text(encoding='utf-8')
        if str(secret) not in raw_store and 'secret_ciphertext' in raw_store:
            log('Secret Storage Encryption', 'PASS', 'Secret file stores ciphertext instead of plaintext')
        else:
            log('Secret Storage Encryption', 'FAIL', 'Secret file still exposes plaintext')
    except Exception as error:
        try:
            sys.stdout = old_stdout
        except Exception:
            pass
        log('Secret Manager Tests', 'FAIL', str(error).encode('ascii', 'ignore').decode('ascii'))


def test_file_structure():
    print('\n=== Test Group 4: File Structure ===')
    project_root = Path(__file__).parent.parent

    required_files = [
        'server/server.js',
        'sdk/python/provenance_sdk.py',
        'sdk/python/model_secret_manager.py',
        'test_zk_standalone.js',
        'address_v2_multi.json',
        'contracts/ModelAccessControl.sol',
        'contracts/ModelRegistry.sol',
        'contracts/ModelAuditLog.sol',
        'contracts/ModelNFT.sol',
        'contracts/ModelStaking.sol',
        'contracts/ProvenanceTracker.sol',
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


def test_sdk_model_resolution():
    print('\n=== Test Group 4B: SDK Model Resolution ===')

    try:
        from sdk.python.provenance_sdk import ProvenanceSDK

        sdk = ProvenanceSDK(base_url='http://127.0.0.1:3000', timeout=5)
        model_name = f'TestSDKModel_{int(time.time())}'

        try:
            created = sdk._ensure_model_registered(model_name, 'sepolia', '0xabc123')
            resolved = sdk._find_model_by_name(model_name, 'sepolia')
        except requests.exceptions.ConnectionError:
            log('SDK model resolution', 'FAIL', 'Backend not running (connection refused)')
            return

        if created and resolved and str(created.get('id') or created.get('numericId')) == str(resolved.get('id') or resolved.get('numericId')):
            log('SDK model resolution', 'PASS', f"Resolved registered model '{model_name}' to on-chain ID")
        else:
            log('SDK model resolution', 'FAIL', 'SDK did not resolve a stable on-chain model ID')
    except Exception as error:
        log('SDK model resolution', 'FAIL', str(error))


def test_ipfs_config():
    print('\n=== Test Group 5: IPFS Configuration ===')
    try:
        pinata_key = os.getenv('PINATA_API_KEY')
        pinata_secret = os.getenv('PINATA_SECRET') or os.getenv('PINATA_SECRET_API_KEY')

        if pinata_key:
            log('Pinata API Key', 'PASS', f'Configured ({pinata_key[:8]}...)')
        else:
            log('Pinata API Key', 'WARN', 'Not configured in .env')

        if pinata_secret:
            log('Pinata Secret', 'PASS', 'Configured')
        else:
            log('Pinata Secret', 'WARN', 'Not configured in .env')
    except Exception as error:
        log('IPFS Config Check', 'FAIL', str(error))


def main():
    print('\n====================================')
    print('  SDK and Backend Integration Tests')
    print(f'  Started: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
    print('====================================')

    test_sdk_imports()
    test_backend_api()
    test_backend_write_auth()
    test_secret_manager()
    test_file_structure()
    test_sdk_model_resolution()
    test_ipfs_config()

    passed = len([test for test in RESULTS['tests'] if test['status'] == 'PASS'])
    failed = len([test for test in RESULTS['tests'] if test['status'] == 'FAIL'])
    warned = len([test for test in RESULTS['tests'] if test['status'] == 'WARN'])
    skipped = len([test for test in RESULTS['tests'] if test['status'] == 'SKIP'])

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
    with open(out_path, 'w', encoding='utf-8') as file:
        json.dump(RESULTS, file, indent=2)

    print(f'Results saved to: {out_path}')

    if failed > 0:
        sys.exit(1)


if __name__ == '__main__':
    main()
