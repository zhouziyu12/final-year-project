// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title IVerifier
/// @notice Interface matching the snarkjs-generated Verifier.sol
interface IVerifier {
    function verifyProof(
        uint[2]    calldata _pA,
        uint[2][2] calldata _pB,
        uint[2]    calldata _pC,
        uint[2]    calldata _pubSignals
    ) external view returns (bool);
}

/// @title RealZKBridge
/// @notice Trustless cross-chain bridge with mandatory on-chain ZK proof verification.
///         Fulfills Section 3.3 of the FYP Interim Report: the bridge trusts mathematics,
///         not human operators or multi-sig committees.
contract RealZKBridge {

    // ─── State ────────────────────────────────────────────────────────────────

    uint256 public nonce;

    /// @notice Address of the deployed snarkjs Verifier contract (immutable after deploy)
    address public immutable verifier;

    // ─── Events ───────────────────────────────────────────────────────────────

    /// @notice Emitted ONLY after a valid ZK proof has been verified on-chain
    event CrossChainMessage(
        uint256 indexed nonce,
        uint256 indexed modelId,
        uint16          dstChainId,
        address         sender,
        uint256         timestamp,
        bytes           payload
    );

    /// @notice Audit trail event for every successful proof verification
    event ProofVerified(
        uint256 indexed modelId,
        address indexed prover,
        uint256         timestamp
    );

    // ─── Custom Errors ────────────────────────────────────────────────────────

    error ZKProofInvalid();
    error ModelIdMismatch();

    // ─── Constructor ──────────────────────────────────────────────────────────

    /// @param _verifier Address of the deployed Verifier.sol contract
    constructor(address _verifier) {
        require(_verifier != address(0), "Verifier address required");
        verifier = _verifier;
    }

    // ─── Core Function ────────────────────────────────────────────────────────

    /// @notice Bridge model provenance data to a destination chain.
    ///         Caller MUST supply a valid Groth16 ZK proof. The proof is
    ///         verified on-chain before any cross-chain message is emitted.
    ///
    /// @dev    Circuit public signals layout (2 signals):
    ///           pubSignals[0] = hash commitment (Poseidon output)
    ///           pubSignals[1] = modelId (binds this proof to one specific model)
    ///         Checking pubSignals[1] == modelId prevents cross-model proof replay attacks.
    ///
    /// @param modelId     The model identifier — must match pubSignals[1]
    /// @param dstChainId  Destination chain ID (50312=Somnia, 97=tBNB, 11155111=Sepolia)
    /// @param payload     ABI-encoded provenance payload (ipfsCid, eventType, etc.)
    /// @param _pA         Groth16 proof point A
    /// @param _pB         Groth16 proof point B
    /// @param _pC         Groth16 proof point C
    /// @param _pubSignals The 2 public output signals from snarkjs
    function bridgeData(
        uint256             modelId,
        uint16              dstChainId,
        bytes     calldata  payload,
        uint[2]   calldata  _pA,
        uint[2][2] calldata _pB,
        uint[2]   calldata  _pC,
        uint[2]   calldata  _pubSignals
    ) external {

        // ── Step 1: On-chain ZK proof verification ────────────────────────────
        bool valid = IVerifier(verifier).verifyProof(_pA, _pB, _pC, _pubSignals);
        if (!valid) revert ZKProofInvalid();

        // ── Step 2: Bind proof to this exact modelId (anti-replay) ───────────
        if (_pubSignals[1] != modelId) revert ModelIdMismatch();

        // ── Step 3: Emit proof audit event ────────────────────────────────────
        emit ProofVerified(modelId, msg.sender, block.timestamp);

        // ── Step 4: Emit cross-chain message for off-chain relayer ────────────
        emit CrossChainMessage(
            nonce++,
            modelId,
            dstChainId,
            msg.sender,
            block.timestamp,
            payload
        );
    }

    // ─── View Helpers ─────────────────────────────────────────────────────────

    /// @notice Returns the verifier contract address (for UI transparency)
    function getVerifier() external view returns (address) {
        return verifier;
    }
}
