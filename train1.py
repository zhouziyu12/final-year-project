"""
train1.py (ultra-minimal business layer)
职责：参数解析 -> Dummy 训练 -> 保存 .pth -> 一行调用 SDK
"""

import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
os.environ["OMP_NUM_THREADS"] = "1"

import argparse
from pathlib import Path

import torch
import torch.nn as nn
import torch.optim as optim

import sys
ROOT = Path(__file__).resolve().parent
sys.path.append(str(ROOT / "sdk" / "python"))
from provenance_sdk import ProvenanceSDK
from model_secret_manager import ModelSecretManager


class DummyNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(16, 32),
            nn.ReLU(),
            nn.Linear(32, 8),
        )

    def forward(self, x):
        return self.net(x)


def main():
    parser = argparse.ArgumentParser(description="Train dummy model and submit provenance")
    parser.add_argument("--commit", default="dummy training")
    parser.add_argument("--sender", default="train1.py")
    parser.add_argument("--version", default="v1.0")
    parser.add_argument("--model-series", default="DummyNet", help="Model series name")
    args = parser.parse_args()

    # 1) Get or create secret for this model series
    secret_manager = ModelSecretManager(secrets_dir=str(ROOT / "model_secrets"))
    secret = secret_manager.get_or_create_secret(args.model_series)

    # 2) Dummy training only
    torch.manual_seed(42)
    x = torch.randn(64, 16)
    y = torch.randint(0, 8, (64,))

    model = DummyNet()
    optimizer = optim.Adam(model.parameters(), lr=1e-3)
    criterion = nn.CrossEntropyLoss()

    model.train()
    for _ in range(3):
        optimizer.zero_grad()
        logits = model(x)
        loss = criterion(logits, y)
        loss.backward()
        optimizer.step()

    # 3) Save weights
    out_dir = ROOT / "artifacts"
    out_dir.mkdir(parents=True, exist_ok=True)
    model_path = out_dir / "model_v1.pth"
    torch.save(model.state_dict(), model_path)

    # 4) Init SDK
    sdk = ProvenanceSDK(project_root=str(ROOT))

    # 5) One-line provenance submit (all ZK/IPFS/network logic inside SDK)
    result = sdk.submit_provenance(str(model_path), args.commit, args.sender, args.version, secret)

    # 6) Record version in secret manager
    secret_manager.record_version(
        args.model_series,
        args.version,
        result['modelId'],
        result['modelHash']
    )

    print("\n" + "="*60)
    print("✅ TRAINING COMPLETE")
    print("="*60)
    print(f"Model Series:   {args.model_series}")
    print(f"Secret:         {secret} (saved to model_secrets/secrets.json)")
    print(f"Model ID:       {result['modelId']}")
    print(f"Model Hash:     {result['modelHash']}")
    print("="*60)
    print("\n💡 Use this secret to query all versions of this model series!")
    print(result)


if __name__ == "__main__":
    main()
