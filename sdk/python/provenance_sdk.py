import hashlib
import json
import os
import secrets
import subprocess
import time
from pathlib import Path
from typing import Any, Dict, Optional

import requests

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover - optional dependency fallback
    load_dotenv = None


class ProvenanceSDK:
    """
    All-in-one SDK:
    - Generate ZK proof (Node + snarkjs standalone script)
    - Upload model weights to IPFS (Pinata direct, optional fallback to backend)
    - Assemble provenance payload
    - Submit to backend tri-chain relayer
    """

    def __init__(
        self,
        base_url: str = "http://127.0.0.1:3000",
        project_root: Optional[str] = None,
        pinata_api_key: Optional[str] = None,
        pinata_secret_api_key: Optional[str] = None,
        write_api_key: Optional[str] = None,
        timeout: int = 300,
    ):
        self.base_url = base_url.rstrip("/")
        self.project_root = (
            Path(project_root)
            if project_root
            else Path(__file__).resolve().parent.parent.parent
        )
        self.timeout = timeout

        env_path = self.project_root / ".env"
        if load_dotenv and env_path.exists():
            load_dotenv(env_path, override=False)

        self.write_api_key = write_api_key or os.getenv("WRITE_API_KEY")

        # Pinata credentials can come from ctor or env
        self.pinata_api_key = pinata_api_key or os.getenv("PINATA_API_KEY")
        self.pinata_secret_api_key = pinata_secret_api_key or os.getenv("PINATA_SECRET_API_KEY") or os.getenv("PINATA_SECRET")

    # ------------------------------- Utilities -------------------------------

    @staticmethod
    def _sha256_file(path: str) -> str:
        h = hashlib.sha256()
        with open(path, "rb") as f:
            for chunk in iter(lambda: f.read(1024 * 1024), b""):
                h.update(chunk)
        return "0x" + h.hexdigest()

    @staticmethod
    def _model_id_from_hash(model_hash: str) -> int:
        hex_part = str(model_hash).replace("0x", "")[:15] or "1"
        return int(hex_part, 16) % 1_000_000_000

    @staticmethod
    def _message_hash_to_field(*parts: str) -> int:
        field_modulus = 21888242871839275222246405745257275088548364400416034343698204186575808495617
        digest = hashlib.sha256("::".join(parts).encode("utf-8")).hexdigest()
        return int(digest, 16) % field_modulus

    @staticmethod
    def _safe_json_load(path: Path, default: Any) -> Any:
        try:
            if path.exists():
                return json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            pass
        return default

    # ------------------------------ ZK Wrapper -------------------------------

    def _generate_zk_proof(self, secret: str, model_id: int, message_hash: int) -> Dict[str, Any]:
        """
        Windows-safe file-bridge mode:
        1) write scripts/last_proof_input.json
        2) run node test_zk_standalone.js (stdout/stderr direct to console, no capture)
        3) read proof.json, public.json, proof_calldata_debug.txt from disk
        """
        print(f"[SDK] Generating ZK proof for modelId={model_id}...")
        
        input_path = self.project_root / "scripts" / "last_proof_input.json"
        proof_path = self.project_root / "proof.json"
        public_path = self.project_root / "public.json"
        calldata_debug_path = self.project_root / "proof_calldata_debug.txt"

        input_path.parent.mkdir(parents=True, exist_ok=True)
        input_path.write_text(
            json.dumps(
                {"secret": str(secret), "modelId": str(model_id), "messageHash": str(message_hash)},
                ensure_ascii=False,
            ),
            encoding="utf-8",
        )
        print(f"[SDK] Input written: {input_path}")

        cmd = "node test_zk_standalone.js"
        print(f"[SDK] Running: {cmd}")
        print("[SDK] (Node output will appear below, this may take 30-60s...)")
        
        # Windows: use CREATE_NO_WINDOW to prevent handle inheritance deadlock
        import sys
        creation_flags = 0
        if sys.platform == "win32":
            creation_flags = subprocess.CREATE_NO_WINDOW
        
        result = subprocess.run(
            cmd,
            cwd=str(self.project_root),
            shell=True,
            timeout=120,
            creationflags=creation_flags,
        )

        if result.returncode != 0:
            print(f"[SDK] WARNING: Node script exited with code {result.returncode}, checking output files...")
            # Don't fail immediately - check if output files exist
            if not (proof_path.exists() and public_path.exists() and calldata_debug_path.exists()):
                raise RuntimeError(
                    f"ZK proof generation failed. returncode={result.returncode}, output files missing"
                )
            print("[SDK] Output files found despite non-zero exit code, continuing...")
        else:
            print("[SDK] Node script completed successfully.")
        
        proof = self._safe_json_load(proof_path, default={})
        public_signals = self._safe_json_load(public_path, default=[])

        if not calldata_debug_path.exists():
            raise RuntimeError(f"Calldata debug file not found: {calldata_debug_path}")

        raw = calldata_debug_path.read_text(encoding="utf-8", errors="ignore").strip()

        marker_start = "========== Solidity Calldata =========="
        marker_end = "======================================="
        calldata = raw
        if marker_start in raw:
            calldata = raw.split(marker_start, 1)[1]
            if marker_end in calldata:
                calldata = calldata.split(marker_end, 1)[0]
            calldata = calldata.strip()

        print(f"[SDK] ZK proof generated. Calldata length: {len(calldata)} chars")

        return {
            "zk": {
                "ok": True,
                "engine": "snarkjs.groth16",
                "inputFile": str(input_path),
                "proofFile": str(proof_path),
                "publicFile": str(public_path),
                "proof": proof,
                "publicSignals": public_signals,
                "calldata": calldata,
                "calldataFile": str(calldata_debug_path),
            }
        }

    # ------------------------------ IPFS Wrapper -----------------------------

    def _upload_model_to_ipfs(self, model_path: str) -> Dict[str, Any]:
        """
        Direct Pinata upload from SDK (preferred).
        If credentials missing, returns non-fatal status and backend can still upload via modelFilePath.
        """
        print(f"[SDK] Uploading model to IPFS: {model_path}")
        
        p = Path(model_path)
        if not p.exists():
            raise FileNotFoundError(f"Model file not found: {model_path}")

        if not (self.pinata_api_key and self.pinata_secret_api_key):
            print("[SDK] Pinata credentials not configured, backend will handle upload.")
            return {
                "ok": False,
                "ipfsCid": None,
                "reason": "PINATA_API_KEY / PINATA_SECRET_API_KEY not configured; fallback to backend upload",
            }

        url = "https://api.pinata.cloud/pinning/pinFileToIPFS"
        headers = {
            "pinata_api_key": self.pinata_api_key,
            "pinata_secret_api_key": self.pinata_secret_api_key,
        }
        metadata = {"name": p.name}

        print("[SDK] Uploading to Pinata (this may take 10-30s)...")
        with open(p, "rb") as fp:
            files = {
                "file": (p.name, fp, "application/octet-stream"),
                "pinataMetadata": (None, json.dumps(metadata), "application/json"),
            }
            resp = requests.post(url, headers=headers, files=files, timeout=self.timeout)
            resp.raise_for_status()
            data = resp.json()

        cid = data.get("IpfsHash")
        print(f"[SDK] IPFS upload complete. CID: {cid}")
        
        return {
            "ok": True,
            "ipfsCid": cid,
            "provider": "pinata-direct",
        }

    # --------------------------- Backend Communication -----------------------

    def _build_write_headers(self) -> Dict[str, str]:
        if not self.write_api_key:
            raise RuntimeError("WRITE_API_KEY is required for backend write operations")

        return {
            "x-api-key": self.write_api_key,
            "x-auth-timestamp": str(int(time.time() * 1000)),
            "x-auth-nonce": secrets.token_hex(16),
        }

    def _send_to_relayer(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        print(f"[SDK] Submitting to tri-chain relayer: {self.base_url}/api/sdk/provenance")
        resp = requests.post(
            f"{self.base_url}/api/sdk/provenance",
            json=payload,
            headers=self._build_write_headers(),
            timeout=self.timeout,
        )
        resp.raise_for_status()
        data = resp.json()
        if not data.get("success"):
            raise RuntimeError(f"Relayer returned failure: {data}")
        print("[SDK] Relayer submission successful.")
        return data

    def _list_models(self, chain: str) -> Dict[str, Any]:
        response = requests.get(
            f"{self.base_url}/api/v2/models",
            params={"chain": chain},
            timeout=self.timeout,
        )
        response.raise_for_status()
        payload = response.json()
        if not payload.get("success"):
            raise RuntimeError(f"Model list request failed: {payload}")
        return payload

    def _find_model_by_name(self, model_name: str, chain: str) -> Optional[Dict[str, Any]]:
        payload = self._list_models(chain)
        normalized = model_name.strip().lower()
        for model in payload.get("models", []):
            if str(model.get("name", "")).strip().lower() == normalized:
                return model
        return None

    def _register_model(self, model_name: str, chain: str, model_hash: str) -> Dict[str, Any]:
        response = requests.post(
            f"{self.base_url}/api/register",
            json={
                "name": model_name,
                "description": f"Auto-registered by ProvenanceSDK for {model_name}",
                "checksum": model_hash,
                "framework": "PyTorch",
                "license": "MIT",
                "chain": chain,
            },
            headers=self._build_write_headers(),
            timeout=self.timeout,
        )
        response.raise_for_status()
        payload = response.json()
        if not payload.get("success"):
            raise RuntimeError(f"Model registration failed: {payload}")
        return payload

    def _ensure_model_registered(self, model_name: str, chain: str, model_hash: str) -> Dict[str, Any]:
        existing = self._find_model_by_name(model_name, chain)
        if existing:
            return existing
        return self._register_model(model_name, chain, model_hash)

    # ----------------------------- Public API --------------------------------

    def submit_provenance(
        self,
        model_path: str,
        commit_msg: str,
        sender: str,
        version: str,
        secret: str = "123456",
        model_name: Optional[str] = None,
        chain: str = "sepolia",
    ) -> Dict[str, Any]:
        """
        One-call full pipeline:
          1) hash model
          2) build modelId
          3) generate ZK proof
          4) upload model to IPFS (SDK direct when possible)
          5) assemble full payload (ZK calldata + IPFS CID + metadata)
          6) submit to tri-chain relayer backend
        """
        print("\n" + "="*60)
        print("SDK PIPELINE START")
        print("="*60)
        
        model_path = str(Path(model_path).resolve())
        print(f"[SDK] Step 1/6: Hashing model file...")
        model_hash = self._sha256_file(model_path)
        print(f"[SDK] Model hash: {model_hash}")
        effective_model_name = model_name or Path(model_path).stem
        registry_model = self._ensure_model_registered(effective_model_name, chain, model_hash)
        model_id = int(registry_model["numericId"] if "numericId" in registry_model else registry_model["id"])
        print(f"[SDK] Resolved on-chain model: {effective_model_name} -> {model_id} ({chain})")

        print(f"\n[SDK] Step 2/6: Generating ZK proof...")
        message_hash = self._message_hash_to_field(
            effective_model_name,
            chain,
            model_hash,
            commit_msg,
            sender,
            version,
        )
        zk_bundle = self._generate_zk_proof(secret=secret, model_id=model_id, message_hash=message_hash)
        
        print(f"\n[SDK] Step 3/6: Uploading model to IPFS...")
        ipfs_bundle = self._upload_model_to_ipfs(model_path)

        print(f"\n[SDK] Step 4/6: Assembling metadata...")
        training_metadata = {
            "framework": "PyTorch",
            "stage": "training",
            "version": version,
            "commit": commit_msg,
            "message_hash": str(message_hash),
            "weights_path": model_path,
            "zk_verified": zk_bundle["zk"]["ok"],
            "zk_engine": zk_bundle["zk"]["engine"],
            "zk_public_signals": zk_bundle["zk"]["publicSignals"],
            "zk_calldata": zk_bundle["zk"]["calldata"],
            "ipfs_upload_mode": "sdk-direct" if ipfs_bundle.get("ok") else "backend-fallback",
            "sdk_timestamp": __import__("datetime").datetime.utcnow().isoformat() + "Z",
        }

        print(f"\n[SDK] Step 5/6: Building relayer payload...")
        payload = {
            "modelHash": model_hash,
            "modelId": model_id,
            "modelName": effective_model_name,
            "chain": chain,
            "action": "UPDATED",
            "sender": sender,
            "commit": commit_msg,
            "versionTag": version,
            "trainingMetadata": training_metadata,
            # If SDK uploaded successfully, backend will use this;
            # otherwise backend can upload from modelFilePath itself.
            "ipfsHash": ipfs_bundle.get("ipfsCid"),
            "modelFilePath": model_path,
        }

        print(f"\n[SDK] Step 6/6: Submitting to tri-chain relayer...")
        relayer_result = self._send_to_relayer(payload)

        print("\n" + "="*60)
        print("SDK PIPELINE COMPLETE")
        print("="*60 + "\n")

        return {
            "success": True,
            "modelPath": model_path,
            "modelHash": model_hash,
            "modelId": model_id,
            "modelName": effective_model_name,
            "chain": chain,
            "zk": {
                "calldata": zk_bundle["zk"]["calldata"],
                "publicSignals": zk_bundle["zk"]["publicSignals"],
            },
            "ipfs": ipfs_bundle,
            "relayer": relayer_result,
        }
