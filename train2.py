"""
train2.py

Incremental training example aligned with the current ProvenanceSDK interface.

Flow:
- load the baseline checkpoint
- fine-tune locally
- save a new checkpoint
- reuse the same lifecycle secret for the model series
- submit provenance through the current backend relay path
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
    parser = argparse.ArgumentParser(description="Incrementally train a dummy model and submit provenance")
    parser.add_argument("--commit", default="Incremental training run")
    parser.add_argument("--sender", default="train2.py")
    parser.add_argument("--version", default="v2.0")
    parser.add_argument("--model-series", default="DummyNet", help="Stable local lifecycle series name")
    parser.add_argument("--model-name", default=None, help="Optional on-chain model name override")
    parser.add_argument("--base-model", default="artifacts/model_v1.pth", help="Path to the baseline checkpoint")
    parser.add_argument("--epochs", type=int, default=5, help="Additional training epochs")
    args = parser.parse_args()

    effective_model_name = args.model_name or args.model_series

    secret_manager = ModelSecretManager(secrets_dir=str(ROOT / "model_secrets"))
    secret = secret_manager.get_or_create_secret(args.model_series)

    base_model_path = ROOT / args.base_model
    if not base_model_path.exists():
        print(f"Base model not found: {base_model_path}")
        print("Run train1.py first to create the baseline checkpoint.")
        sys.exit(1)

    model = DummyNet()
    model.load_state_dict(torch.load(base_model_path, map_location="cpu"))
    print(f"Loaded base model: {base_model_path}")

    torch.manual_seed(42)
    x = torch.randn(100, 16)
    y = torch.randint(0, 8, (100,))

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=5e-4)

    model.train()
    with torch.no_grad():
        initial_logits = model(x)
        initial_loss = criterion(initial_logits, y).item()
        initial_acc = (initial_logits.argmax(dim=1) == y).float().mean().item()

    print(f"Initial metrics: loss={initial_loss:.4f}, acc={initial_acc:.4f}")

    for epoch in range(args.epochs):
        optimizer.zero_grad()
        logits = model(x)
        loss = criterion(logits, y)
        loss.backward()
        optimizer.step()
        acc = (logits.argmax(dim=1) == y).float().mean().item()
        print(f"Epoch {epoch + 1}/{args.epochs}: loss={loss.item():.4f}, acc={acc:.4f}")

    model.eval()
    with torch.no_grad():
        final_logits = model(x)
        final_loss = criterion(final_logits, y).item()
        final_acc = (final_logits.argmax(dim=1) == y).float().mean().item()

    out_dir = ROOT / "artifacts"
    out_dir.mkdir(parents=True, exist_ok=True)
    model_path = out_dir / "model_v2.pth"
    torch.save(model.state_dict(), model_path)

    sdk = ProvenanceSDK(project_root=str(ROOT))
    result = sdk.submit_provenance(
        str(model_path),
        args.commit,
        args.sender,
        args.version,
        secret,
        model_name=effective_model_name,
    )

    secret_manager.record_version(
        args.model_series,
        args.version,
        result["modelId"],
        result["modelHash"],
        model_name=effective_model_name,
        chain=result.get("chain"),
        ipfs_cid=result["ipfs"].get("ipfsCid"),
        tx_hash=result["relayer"].get("tx"),
    )

    print("\n" + "=" * 60)
    print("INCREMENTAL TRAINING COMPLETE")
    print("=" * 60)
    print(f"Model series:   {args.model_series}")
    print(f"Model name:     {effective_model_name}")
    print(f"Base model:     {base_model_path}")
    print(f"Checkpoint:     {model_path}")
    print(f"Model ID:       {result['modelId']}")
    print(f"Model hash:     {result['modelHash']}")
    print(f"IPFS CID:       {result['ipfs'].get('ipfsCid')}")
    print(f"Relay tx:       {result['relayer'].get('tx')}")
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
