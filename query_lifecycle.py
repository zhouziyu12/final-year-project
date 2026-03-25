"""
query_lifecycle.py - 通过 secret 查询模型全生命周期
"""

import argparse
import json
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description="Query model lifecycle by secret")
    parser.add_argument("--secret", required=True, help="Lifecycle secret")
    parser.add_argument("--secrets-file", default="model_secrets/secrets.json")
    args = parser.parse_args()

    secrets_path = Path(args.secrets_file)
    if not secrets_path.exists():
        print(f"❌ Secrets file not found: {secrets_path}")
        return

    with open(secrets_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    found = False
    for series, payload in data.items():
        if str(payload.get("secret")) == str(args.secret):
            found = True
            versions = payload.get("versions", [])
            print("\n" + "=" * 70)
            print("🔎 MODEL LIFECYCLE FOUND")
            print("=" * 70)
            print(f"Model Series: {series}")
            print(f"Secret:       {payload.get('secret')}")
            print(f"Created At:   {payload.get('created_at')}")
            print(f"Versions:     {len(versions)}")
            print("-" * 70)
            for idx, v in enumerate(versions, 1):
                print(f"[{idx}] Version:   {v.get('version')}")
                print(f"    Model ID:  {v.get('model_id')}")
                print(f"    Model Hash:{v.get('model_hash')}")
                print(f"    Time:      {v.get('timestamp')}")
                print("-" * 70)
            break

    if not found:
        print("❌ No lifecycle found for this secret.")


if __name__ == "__main__":
    main()
