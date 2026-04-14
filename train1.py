"""
train1.py

Baseline training example aligned with the current ProvenanceSDK interface.

Flow:
- train a small dummy model locally
- save the checkpoint
- keep one stable lifecycle secret per model series
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
    parser = argparse.ArgumentParser(description="Train a dummy model and submit provenance")
    parser.add_argument("--commit", default="Initial dummy training run")
    parser.add_argument("--sender", default="train1.py")
    parser.add_argument("--version", default="v1.0")
    parser.add_argument("--model-series", default="DummyNet", help="Stable local lifecycle series name")
    parser.add_argument("--model-name", default=None, help="Optional on-chain model name override")
    args = parser.parse_args()

    effective_model_name = args.model_name or args.model_series

    secret_manager = ModelSecretManager(secrets_dir=str(ROOT / "model_secrets"))
    secret = secret_manager.get_or_create_secret(args.model_series)

    torch.manual_seed(42)
    x = torch.randn(64, 16)
    y = torch.randint(0, 8, (64,))

    model = DummyNet()
    optimizer = optim.Adam(model.parameters(), lr=1e-3)
    criterion = nn.CrossEntropyLoss()

    model.train()
    for epoch in range(3):
        optimizer.zero_grad()
        logits = model(x)
        loss = criterion(logits, y)
        loss.backward()
        optimizer.step()
        print(f"Epoch {epoch + 1}/3: loss={loss.item():.4f}")

    out_dir = ROOT / "artifacts"
    out_dir.mkdir(parents=True, exist_ok=True)
    model_path = out_dir / "model_v1.pth"
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
    print("TRAINING COMPLETE")
    print("=" * 60)
    print(f"Model series:   {args.model_series}")
    print(f"Model name:     {effective_model_name}")
    print(f"Checkpoint:     {model_path}")
    print(f"Model ID:       {result['modelId']}")
    print(f"Model hash:     {result['modelHash']}")
    print(f"IPFS CID:       {result['ipfs'].get('ipfsCid')}")
    print(f"Relay tx:       {result['relayer'].get('tx')}")
    print("=" * 60)
    print(result)


if __name__ == "__main__":
    main()
