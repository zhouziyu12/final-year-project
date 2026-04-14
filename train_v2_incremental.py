"""
train_v2_incremental.py

Incremental training example aligned with the current SDK interface.

Flow:
- load a base checkpoint when available
- fine-tune locally
- save updated weights
- reuse the same local lifecycle secret for the model series
- submit provenance through the current ProvenanceSDK entry point
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


class SimpleCNN(nn.Module):
    def __init__(self):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(1, 8, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Conv2d(8, 16, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2),
        )
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(16 * 7 * 7, 32),
            nn.ReLU(),
            nn.Linear(32, 10),
        )

    def forward(self, x):
        return self.classifier(self.features(x))


def main():
    parser = argparse.ArgumentParser(description="Incrementally fine-tune a CNN model and submit provenance")
    parser.add_argument("--commit", default="Incremental training on V1 base")
    parser.add_argument("--sender", default="train_v2_incremental.py")
    parser.add_argument("--version", default="v2.0")
    parser.add_argument("--model-series", default="SimpleCNN", help="Stable model series name for local secret tracking")
    parser.add_argument("--model-name", default=None, help="Optional on-chain model name override")
    parser.add_argument("--base-model", default="artifacts/model_v1_sepolia.pth", help="Path to the base checkpoint")
    parser.add_argument("--epochs", type=int, default=3, help="Fine-tuning epochs")
    args = parser.parse_args()

    secret_manager = ModelSecretManager(secrets_dir=str(ROOT / "model_secrets"))
    secret = secret_manager.get_or_create_secret(args.model_series)

    torch.manual_seed(42)
    x = torch.randn(100, 1, 28, 28)
    y = torch.randint(0, 10, (100,))

    model = SimpleCNN()

    base_model_path = ROOT / args.base_model
    if base_model_path.exists():
        print(f"Loading base model from: {base_model_path}")
        model.load_state_dict(torch.load(base_model_path))
    else:
        print(f"Base model not found at {base_model_path}, continuing from random init")

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=5e-4)

    model.train()
    with torch.no_grad():
        initial_logits = model(x)
        initial_loss = criterion(initial_logits, y).item()
        initial_acc = (initial_logits.argmax(dim=1) == y).float().mean().item()

    for epoch in range(args.epochs):
        optimizer.zero_grad()
        logits = model(x)
        loss = criterion(logits, y)
        loss.backward()
        optimizer.step()
        print(f"Epoch {epoch + 1}/{args.epochs}: loss={loss.item():.4f}")

    model.eval()
    with torch.no_grad():
        final_logits = model(x)
        final_loss = criterion(final_logits, y).item()
        final_acc = (final_logits.argmax(dim=1) == y).float().mean().item()

    out_dir = ROOT / "artifacts"
    out_dir.mkdir(parents=True, exist_ok=True)
    model_path = out_dir / "model_v2_incremental.pth"
    torch.save(model.state_dict(), model_path)

    sdk = ProvenanceSDK(project_root=str(ROOT))
    result = sdk.submit_provenance(
        str(model_path),
        args.commit,
        args.sender,
        args.version,
        secret,
        model_name=args.model_name or args.model_series,
    )

    secret_manager.record_version(
        args.model_series,
        args.version,
        result["modelId"],
        result["modelHash"],
        model_name=args.model_name or args.model_series,
        chain=result.get("chain"),
        ipfs_cid=result["ipfs"].get("ipfsCid"),
        tx_hash=result["relayer"].get("tx"),
    )

    print("\n" + "=" * 60)
    print("INCREMENTAL TRAINING COMPLETE")
    print("=" * 60)
    print(f"Model series:   {args.model_series}")
    print(f"Model name:     {args.model_name or args.model_series}")
    print(f"Base model:     {base_model_path}")
    print(f"New checkpoint: {model_path}")
    print(f"Model ID:       {result['modelId']}")
    print(f"Model hash:     {result['modelHash']}")
    print(f"Initial loss:   {initial_loss:.4f}")
    print(f"Final loss:     {final_loss:.4f}")
    print(f"Initial acc:    {initial_acc:.4f}")
    print(f"Final acc:      {final_acc:.4f}")
    print(f"Loss delta:     {initial_loss - final_loss:.4f}")
    print(f"Acc delta:      {final_acc - initial_acc:.4f}")
    print("=" * 60)
    print(result)


if __name__ == "__main__":
    main()
