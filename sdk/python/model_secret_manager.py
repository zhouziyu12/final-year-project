"""
Model Secret Manager.

Keeps a stable secret for each model series and records version history.
"""

import base64
import json
import os
import secrets
import subprocess
from pathlib import Path
from typing import Optional
from datetime import datetime, UTC


class ModelSecretManager:
    def __init__(self, secrets_dir: str = "model_secrets"):
        self.secrets_dir = Path(secrets_dir)
        self.secrets_dir.mkdir(exist_ok=True)
        self.secrets_file = self.secrets_dir / "secrets.json"
        self._load_secrets()

    def _load_secrets(self):
        """Load existing secrets from disk."""
        if self.secrets_file.exists():
            with open(self.secrets_file, 'r', encoding='utf-8') as file:
                raw = json.load(file)
                self.secrets = raw.get("series", raw)
        else:
            self.secrets = {}

    def _save_secrets(self):
        """Persist secrets to disk."""
        payload = {"format": "encrypted-v1", "series": self.secrets}
        with open(self.secrets_file, 'w', encoding='utf-8') as file:
            json.dump(payload, file, indent=2, ensure_ascii=False)

    def generate_secret(self) -> str:
        """Generate a 256-bit hex secret."""
        return secrets.token_hex(32)

    def _protect_secret(self, plaintext: str) -> str:
        """Encrypt secret material with Windows DPAPI via PowerShell."""
        if os.name != "nt":
            raise RuntimeError("Encrypted secret storage currently requires Windows DPAPI")

        env = os.environ.copy()
        env["MODEL_SECRET_PLAINTEXT_B64"] = base64.b64encode(plaintext.encode("utf-8")).decode("ascii")
        cmd = [
            "powershell",
            "-NoProfile",
            "-Command",
            (
                "$plain = [System.Text.Encoding]::UTF8.GetString("
                "[System.Convert]::FromBase64String($env:MODEL_SECRET_PLAINTEXT_B64));"
                "$secure = ConvertTo-SecureString $plain -AsPlainText -Force;"
                "$secure | ConvertFrom-SecureString"
            ),
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, env=env, check=True)
        return result.stdout.strip()

    def _unprotect_secret(self, ciphertext: str) -> str:
        """Decrypt secret material with Windows DPAPI via PowerShell."""
        if os.name != "nt":
            raise RuntimeError("Encrypted secret storage currently requires Windows DPAPI")

        env = os.environ.copy()
        env["MODEL_SECRET_CIPHERTEXT_B64"] = base64.b64encode(ciphertext.encode("utf-8")).decode("ascii")
        cmd = [
            "powershell",
            "-NoProfile",
            "-Command",
            (
                "$cipher = [System.Text.Encoding]::UTF8.GetString("
                "[System.Convert]::FromBase64String($env:MODEL_SECRET_CIPHERTEXT_B64));"
                "$secure = ConvertTo-SecureString $cipher;"
                "$bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure);"
                "try { [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr) } "
                "finally { [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }"
            ),
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, env=env, check=True)
        return result.stdout.strip()

    def _get_secret_value(self, model_series: str) -> Optional[str]:
        entry = self.secrets.get(model_series)
        if not entry:
            return None
        if entry.get("secret_ciphertext"):
            return self._unprotect_secret(entry["secret_ciphertext"])
        return entry.get("secret")

    @staticmethod
    def _mask_secret(secret: str) -> str:
        if len(secret) <= 12:
            return "*" * len(secret)
        return f"{secret[:6]}...{secret[-4:]}"

    def get_or_create_secret(self, model_series: str) -> str:
        """
        Return the secret for a model series, creating one if needed.

        Args:
            model_series: A stable model family name such as "DummyNet" or "ResNet50".

        Returns:
            The secret assigned to that model series.
        """
        if model_series not in self.secrets:
            new_secret = self.generate_secret()
            self.secrets[model_series] = {
                "secret_ciphertext": self._protect_secret(new_secret),
                "created_at": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
                "versions": []
            }
            self._save_secrets()
        elif self.secrets[model_series].get("secret") and not self.secrets[model_series].get("secret_ciphertext"):
            # Migrate legacy plaintext storage in-place on first access.
            legacy_secret = self.secrets[model_series]["secret"]
            self.secrets[model_series]["secret_ciphertext"] = self._protect_secret(legacy_secret)
            del self.secrets[model_series]["secret"]
            self._save_secrets()

        return self._get_secret_value(model_series)

    def record_version(self, model_series: str, version: str, model_id: int, model_hash: str):
        """Record version metadata for a model series."""
        if model_series in self.secrets:
            self.secrets[model_series]["versions"].append({
                "version": version,
                "model_id": model_id,
                "model_hash": model_hash,
                "timestamp": datetime.now(UTC).isoformat().replace("+00:00", "Z")
            })
            self._save_secrets()

    def get_secret(self, model_series: str) -> Optional[str]:
        """Return the stored secret without creating a new one."""
        return self._get_secret_value(model_series)

    def list_series(self):
        """Print all model series and their stored metadata."""
        print("\nModel Series Secrets:")
        print("=" * 60)
        for series, data in self.secrets.items():
            secret = self._get_secret_value(series)
            print(f"\nSeries: {series}")
            print(f"  Secret: {self._mask_secret(secret) if secret else '(unavailable)'}")
            print(f"  Created: {data['created_at']}")
            print(f"  Versions: {len(data.get('versions', []))}")
            if data.get('versions'):
                for version in data['versions']:
                    print(f"    - {version['version']}: Model ID {version['model_id']}")
        print("=" * 60)


if __name__ == "__main__":
    manager = ModelSecretManager()

    first_secret = manager.get_or_create_secret("DummyNet")
    manager.record_version("DummyNet", "v1.0", 887889005, "0x242ca0a3...")

    second_secret = manager.get_or_create_secret("DummyNet")
    manager.record_version("DummyNet", "v2.0", 690062533, "0x123abc...")

    manager.list_series()
    print(f"\nSecret consistency check: {first_secret == second_secret}")
