"""
Model Secret Manager - 管理模型系列的唯一密钥
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
        """加载已有的 secrets"""
        if self.secrets_file.exists():
            with open(self.secrets_file, 'r', encoding='utf-8') as f:
                self.secrets = json.load(f)
        else:
            self.secrets = {}
    
    def _save_secrets(self):
        """保存 secrets 到文件"""
        with open(self.secrets_file, 'w', encoding='utf-8') as f:
            json.dump(self.secrets, f, indent=2, ensure_ascii=False)
    
    def generate_secret(self) -> str:
        """生成一个新的随机 secret（6位数字）"""
        return str(secrets.randbelow(900000) + 100000)  # 100000-999999
    
    def get_or_create_secret(self, model_series: str) -> str:
        """
        获取或创建模型系列的 secret
        
        Args:
            model_series: 模型系列名称（如 "DummyNet", "ResNet50"）
        
        Returns:
            该模型系列的 secret
        """
        if model_series not in self.secrets:
            new_secret = self.generate_secret()
            self.secrets[model_series] = {
                "secret": new_secret,
                "created_at": __import__("datetime").datetime.utcnow().isoformat() + "Z",
                "versions": []
            }
            self._save_secrets()
            print(f"🔑 Generated new secret for '{model_series}': {new_secret}")
            print(f"   Saved to: {self.secrets_file}")
        else:
            print(f"🔑 Using existing secret for '{model_series}': {self.secrets[model_series]['secret']}")
        
        return self.secrets[model_series]["secret"]
    
    def record_version(self, model_series: str, version: str, model_id: int, model_hash: str):
        """记录模型版本信息"""
        if model_series in self.secrets:
            self.secrets[model_series]["versions"].append({
                "version": version,
                "model_id": model_id,
                "model_hash": model_hash,
                "timestamp": __import__("datetime").datetime.utcnow().isoformat() + "Z"
            })
            self._save_secrets()
    
    def get_secret(self, model_series: str) -> Optional[str]:
        """获取已有的 secret（不创建新的）"""
        return self.secrets.get(model_series, {}).get("secret")
    
    def list_series(self):
        """列出所有模型系列"""
        print("\n📋 Model Series Secrets:")
        print("="*60)
        for series, data in self.secrets.items():
            print(f"\n🔹 {series}")
            print(f"   Secret: {data['secret']}")
            print(f"   Created: {data['created_at']}")
            print(f"   Versions: {len(data.get('versions', []))}")
            if data.get('versions'):
                for v in data['versions']:
                    print(f"      - {v['version']}: Model ID {v['model_id']}")
        print("="*60)


if __name__ == "__main__":
    # 测试
    manager = ModelSecretManager()
    
    # 模拟 train1
    secret1 = manager.get_or_create_secret("DummyNet")
    manager.record_version("DummyNet", "v1.0", 887889005, "0x242ca0a3...")
    
    # 模拟 train2
    secret2 = manager.get_or_create_secret("DummyNet")
    manager.record_version("DummyNet", "v2.0", 690062533, "0x123abc...")
    
    # 列出所有
    manager.list_series()
    
    print(f"\n✅ Secret 一致性验证: {secret1 == secret2}")
