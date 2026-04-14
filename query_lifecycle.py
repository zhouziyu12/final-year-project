"""
query_lifecycle.py

Query model lifecycle records by secret.

Supports both:
- legacy plaintext secret storage
- current `format: encrypted-v1` / `series` layout
"""

import argparse
import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent
sys.path.append(str(ROOT / "sdk" / "python"))
from model_secret_manager import ModelSecretManager


def resolve_secret(payload, manager, series):
    if payload.get("secret") is not None:
        return str(payload.get("secret"))
    if payload.get("secret_ciphertext"):
        try:
            return str(manager.get_secret(series))
        except Exception:
            return None
    return None


def main():
    parser = argparse.ArgumentParser(description="Query model lifecycle by secret")
    parser.add_argument("--secret", required=True, help="Lifecycle secret")
    parser.add_argument("--secrets-file", default="model_secrets/secrets.json")
    args = parser.parse_args()

    secrets_path = Path(args.secrets_file)
    if not secrets_path.exists():
        print(f"Secrets file not found: {secrets_path}")
        return

    with open(secrets_path, "r", encoding="utf-8") as f:
        raw = json.load(f)

    data = raw.get("series", raw)
    manager = ModelSecretManager(secrets_dir=str(secrets_path.parent))

    found = False
    for series, payload in data.items():
        resolved_secret = resolve_secret(payload, manager, series)
        if resolved_secret is None:
            continue
        if str(resolved_secret) == str(args.secret):
            found = True
            versions = payload.get("versions", [])
            storage_mode = "encrypted" if payload.get("secret_ciphertext") else "plaintext-legacy"
            print("\n" + "=" * 70)
            print("MODEL LIFECYCLE FOUND")
            print("=" * 70)
            print(f"Model Series: {series}")
            print(f"Secret:       {resolved_secret}")
            print(f"Storage:      {storage_mode}")
            print(f"Created At:   {payload.get('created_at')}")
            print(f"Versions:     {len(versions)}")
            print("-" * 70)
            for idx, version in enumerate(versions, 1):
                print(f"[{idx}] Version:   {version.get('version')}")
                print(f"    Model ID:  {version.get('model_id')}")
                print(f"    Model Hash:{version.get('model_hash')}")
                print(f"    Time:      {version.get('timestamp')}")
                print("-" * 70)
            break

    if not found:
        print("No lifecycle found for this secret.")


if __name__ == "__main__":
    main()
