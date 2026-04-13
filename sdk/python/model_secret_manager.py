"""
Model Secret Manager.

Keeps a stable secret for each model series and records version history.
"""

import json
import secrets
from pathlib import Path
from typing import Optional


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
                self.secrets = json.load(file)
        else:
            self.secrets = {}

    def _save_secrets(self):
        """Persist secrets to disk."""
        with open(self.secrets_file, 'w', encoding='utf-8') as file:
            json.dump(self.secrets, file, indent=2, ensure_ascii=False)

    def generate_secret(self) -> str:
        """Generate a new six-digit secret."""
        return str(secrets.randbelow(900000) + 100000)

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
                "secret": new_secret,
                "created_at": __import__("datetime").datetime.utcnow().isoformat() + "Z",
                "versions": []
            }
            self._save_secrets()
            print(f"Generated new secret for '{model_series}': {new_secret}")
            print(f"Saved to: {self.secrets_file}")
        else:
            print(f"Using existing secret for '{model_series}': {self.secrets[model_series]['secret']}")

        return self.secrets[model_series]["secret"]

    def record_version(self, model_series: str, version: str, model_id: int, model_hash: str):
        """Record version metadata for a model series."""
        if model_series in self.secrets:
            self.secrets[model_series]["versions"].append({
                "version": version,
                "model_id": model_id,
                "model_hash": model_hash,
                "timestamp": __import__("datetime").datetime.utcnow().isoformat() + "Z"
            })
            self._save_secrets()

    def get_secret(self, model_series: str) -> Optional[str]:
        """Return the stored secret without creating a new one."""
        return self.secrets.get(model_series, {}).get("secret")

    def list_series(self):
        """Print all model series and their stored metadata."""
        print("\nModel Series Secrets:")
        print("=" * 60)
        for series, data in self.secrets.items():
            print(f"\nSeries: {series}")
            print(f"  Secret: {data['secret']}")
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
