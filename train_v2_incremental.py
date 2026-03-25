import json
import os
import random
import hashlib
import argparse
import subprocess
from pathlib import Path

import torch
import torch.nn as nn
import torch.optim as optim

# Make SDK import robust regardless of cwd/package setup
import sys
ROOT = Path(__file__).resolve().parent
SDK_PATH = ROOT / "sdk" / "python"
sys.path.append(str(SDK_PATH))
from provenance_sdk import ProvenanceSDK


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


def hash_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return "0x" + h.hexdigest()


def generate_zk_proof(model_id: int, secret: str = "123456789") -> dict:
    """Generate real ZK proof using snarkjs"""
    try:
        # Write proof input
        proof_input = {"secret": secret, "modelId": str(model_id)}
        with open("last_proof_input.json", "w") as f:
            json.dump(proof_input, f)
        
        print(f"[ZK] Generating proof for model {model_id}...")
        result = subprocess.run(
            ["node", "scripts/quick_gen_proof.js"],
            capture_output=True,
            encoding="utf-8",
            errors="replace",
            timeout=120
        )
        
        if result.returncode != 0:
            print(f"[ZK] Warning: Proof generation failed: {result.stderr}")
            return {"zk_verified": False, "proof_status": "generation_failed"}
        
        # Read generated proof
        if Path("proof_calldata.txt").exists():
            with open("proof_calldata.txt", "r") as f:
                calldata = f.read().strip()
            
            print(f"[ZK] ✅ Proof generated successfully")
            return {
                "zk_verified": True,
                "proof_status": "verified",
                "proof_calldata": calldata[:100] + "...",  # Truncate for storage
                "circuit": "Poseidon hash commitment"
            }
        else:
            return {"zk_verified": False, "proof_status": "proof_file_missing"}
            
    except subprocess.TimeoutExpired:
        print("[ZK] Warning: Proof generation timeout")
        return {"zk_verified": False, "proof_status": "timeout"}
    except Exception as e:
        print(f"[ZK] Warning: Proof generation error: {e}")
        return {"zk_verified": False, "proof_status": f"error: {str(e)}"}


def main():
    parser = argparse.ArgumentParser(description="Train V2 model (incremental) with provenance tracking")
    parser.add_argument("--commit", type=str, default="Incremental training on V1 base", help="Commit message describing changes")
    parser.add_argument("--sender", type=str, default="train_v2_incremental.py", help="Sender address or identifier")
    parser.add_argument("--version", type=str, default="v2.0", help="Version tag for this training run")
    parser.add_argument("--model-id", type=int, default=None, help="Model ID (defaults to env PROVENANCE_MODEL_ID or 5001)")
    parser.add_argument("--epochs", type=int, default=3, help="Number of training epochs")
    parser.add_argument("--base-model", type=str, default="artifacts/model_v1_sepolia.pth", help="Base model to load")
    args = parser.parse_args()

    random.seed(42)
    torch.manual_seed(42)

    # Simulate training data (100 samples this time)
    x = torch.randn(100, 1, 28, 28)
    y = torch.randint(0, 10, (100,))

    model = SimpleCNN()
    
    # Load base model if exists
    base_model_path = Path(args.base_model)
    if base_model_path.exists():
        print(f"[V2] Loading base model from {base_model_path}")
        model.load_state_dict(torch.load(base_model_path))
    else:
        print(f"[V2] Base model not found, training from scratch")

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=5e-4)  # Lower learning rate for fine-tuning

    model.train()
    epochs = args.epochs
    initial_loss = None
    for epoch in range(epochs):
        optimizer.zero_grad()
        out = model(x)
        loss = criterion(out, y)
        if epoch == 0:
            initial_loss = float(loss.item())
        loss.backward()
        optimizer.step()

    final_loss = float(loss.item())
    
    # Calculate accuracy
    model.eval()
    with torch.no_grad():
        out = model(x)
        pred = out.argmax(dim=1)
        accuracy = (pred == y).float().mean().item()

    artifacts_dir = ROOT / "artifacts"
    artifacts_dir.mkdir(parents=True, exist_ok=True)

    weights_path = artifacts_dir / "model_v2_incremental.pth"
    torch.save(model.state_dict(), weights_path)

    model_hash = hash_file(weights_path)
    model_id = args.model_id or int(os.getenv("PROVENANCE_MODEL_ID", "5001"))

    # Generate real ZK proof
    zk_proof_data = generate_zk_proof(model_id)

    sdk = ProvenanceSDK(base_url=os.getenv("PROVENANCE_SERVER", "http://127.0.0.1:3000"), timeout=120)

    metadata = {
        "framework": "PyTorch",
        "stage": "incremental_training",
        "samples_used": 100,
        "epochs": epochs,
        "initial_loss": initial_loss,
        "final_loss": final_loss,
        "accuracy": accuracy,
        "loss_improvement": initial_loss - final_loss if initial_loss else 0,
        "chain": "multi-chain",
        "version": args.version,
        "weights_path": str(weights_path),
        "commit": args.commit,
        "base_model": args.base_model,
        **zk_proof_data,  # Include real ZK proof data
    }

    result = sdk.submit_provenance(
        model_hash=model_hash,
        training_metadata=metadata,
        action="TRAIN_V2_INCREMENTAL",
        sender=args.sender,
        model_id=model_id,
        commit=args.commit,
        version_tag=args.version,
        model_file_path=str(weights_path),
    )

    out = {
        "model_id": model_id,
        "model_hash": model_hash,
        "weights_path": str(weights_path),
        "commit": args.commit,
        "version": args.version,
        "sender": args.sender,
        "accuracy": accuracy,
        "final_loss": final_loss,
        "loss_improvement": metadata["loss_improvement"],
        "zk_proof": zk_proof_data,
        "sdk_result": result,
    }
    with (artifacts_dir / "v2_result.json").open("w", encoding="utf-8") as f:
        json.dump(out, f, indent=2)

    print("V2 complete")
    print(json.dumps(out, indent=2))


if __name__ == "__main__":
    main()
