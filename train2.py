"""
train2.py - Incremental training (V2 update based on V1)
职责：加载 V1 模型 -> 增量训练 -> 保存 V2 -> 一行调用 SDK
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
    parser = argparse.ArgumentParser(description="Incremental training V2")
    parser.add_argument("--commit", default="Incremental training V2")
    parser.add_argument("--sender", default="train2.py")
    parser.add_argument("--version", default="v2.0")
    parser.add_argument("--model-series", default="DummyNet", help="Model series name")
    parser.add_argument("--base-model", default="artifacts/model_v1.pth", help="Path to V1 model")
    parser.add_argument("--epochs", type=int, default=5, help="Additional training epochs")
    args = parser.parse_args()

    # 1) Use same lifecycle secret for this model series
    secret_manager = ModelSecretManager(secrets_dir=str(ROOT / "model_secrets"))
    secret = secret_manager.get_or_create_secret(args.model_series)

    # 2) Load V1 model
    base_model_path = ROOT / args.base_model
    if not base_model_path.exists():
        print(f"❌ Base model not found: {base_model_path}")
        print("   Run train1.py first to create V1 model")
        sys.exit(1)

    print(f"📦 Loading base model from: {base_model_path}")
    model = DummyNet()
    model.load_state_dict(torch.load(base_model_path))
    print("✅ Base model loaded")

    # 3) Prepare larger training dataset (simulating more data)
    torch.manual_seed(42)
    x = torch.randn(100, 16)  # 100 samples (vs 64 in V1)
    y = torch.randint(0, 8, (100,))

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=5e-4)  # Lower LR for fine-tuning

    # 4) Incremental training
    print(f"\n🔄 Starting incremental training ({args.epochs} epochs)...")
    model.train()

    with torch.no_grad():
        initial_logits = model(x)
        initial_loss = criterion(initial_logits, y).item()
        initial_acc = (initial_logits.argmax(dim=1) == y).float().mean().item()

    print(f"   Initial: loss={initial_loss:.4f}, acc={initial_acc:.4f}")

    for epoch in range(args.epochs):
        optimizer.zero_grad()
        logits = model(x)
        loss = criterion(logits, y)
        loss.backward()
        optimizer.step()

        if (epoch + 1) % 2 == 0:
            acc = (logits.argmax(dim=1) == y).float().mean().item()
            print(f"   Epoch {epoch+1}/{args.epochs}: loss={loss.item():.4f}, acc={acc:.4f}")

    model.eval()
    with torch.no_grad():
        final_logits = model(x)
        final_loss = criterion(final_logits, y).item()
        final_acc = (final_logits.argmax(dim=1) == y).float().mean().item()

    print(f"   Final: loss={final_loss:.4f}, acc={final_acc:.4f}")
    print(f"   Improvement: Δloss={initial_loss - final_loss:.4f}, Δacc={final_acc - initial_acc:.4f}")

    # 5) Save V2 model
    out_dir = ROOT / "artifacts"
    out_dir.mkdir(parents=True, exist_ok=True)
    model_path = out_dir / "model_v2.pth"
    torch.save(model.state_dict(), model_path)
    print(f"\n💾 V2 model saved: {model_path}")

    # 6) Submit provenance via SDK
    print("\n📡 Submitting provenance to blockchain...")
    sdk = ProvenanceSDK(project_root=str(ROOT))

    result = sdk.submit_provenance(
        str(model_path),
        args.commit,
        args.sender,
        args.version,
        secret
    )

    # 7) Record lifecycle version by shared secret/model-series
    secret_manager.record_version(
        args.model_series,
        args.version,
        result['modelId'],
        result['modelHash']
    )

    print("\n" + "="*60)
    print("✅ INCREMENTAL TRAINING COMPLETE")
    print("="*60)
    print(f"Model Series:   {args.model_series}")
    print(f"Lifecycle Secret: {secret} (same as train1, saved locally)")
    print(f"Base Model:     {args.base_model}")
    print(f"New Model:      {model_path}")
    print(f"Model ID:       {result['modelId']}")
    print(f"IPFS CID:       {result['relayer'].get('modelCid', 'N/A')}")
    print(f"Sepolia Tx:     {result['relayer'].get('sepoliaTxHash', 'N/A')}")
    print(f"Somnia Tx:      {result['relayer'].get('somniaTxHash', 'N/A')}")
    print(f"tBNB Tx:        {result['relayer'].get('tbnbTxHash', 'N/A')}")
    print(f"Training Δ:     loss {initial_loss:.4f}→{final_loss:.4f}, acc {initial_acc:.4f}→{final_acc:.4f}")
    print("="*60)


if __name__ == "__main__":
    main()
