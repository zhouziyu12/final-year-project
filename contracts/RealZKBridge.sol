// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title IVerifier
/// @notice Interface matching the snarkjs-generated Verifier.sol.
interface IVerifier {
    function verifyProof(
        uint[2] calldata _pA,
        uint[2][2] calldata _pB,
        uint[2] calldata _pC,
        uint[2] calldata _pubSignals
    ) external view returns (bool);
}

/// @title RealZKBridge
/// @notice Trustless cross-chain bridge with mandatory on-chain ZK proof verification.
/// @dev The bridge relies on cryptographic verification rather than human approval.
contract RealZKBridge {
    // State

    uint256 public nonce;

    /// @notice Address of the deployed verifier contract.
    address public immutable verifier;

    // Events

    /// @notice Emitted only after a valid ZK proof is verified on-chain.
    event CrossChainMessage(
        uint256 indexed nonce,
        uint256 indexed modelId,
        uint16 dstChainId,
        address sender,
        uint256 timestamp,
        bytes payload
    );

    /// @notice Audit event emitted for every successful proof verification.
    event ProofVerified(
        uint256 indexed modelId,
        address indexed prover,
        uint256 timestamp
    );

    // Custom errors

    error ZKProofInvalid();
    error ModelIdMismatch();

    // Constructor

    /// @param _verifier Address of the deployed verifier contract.
    constructor(address _verifier) {
        require(_verifier != address(0), "Verifier address required");
        verifier = _verifier;
    }

    // Core function

    /// @notice Bridge model provenance data to a destination chain.
    /// @dev Circuit public signals layout:
    ///      pubSignals[0] = hash commitment
    ///      pubSignals[1] = modelId
    ///      Checking pubSignals[1] == modelId prevents cross-model replay.
    function bridgeData(
        uint256 modelId,
        uint16 dstChainId,
        bytes calldata payload,
        uint[2] calldata _pA,
        uint[2][2] calldata _pB,
        uint[2] calldata _pC,
        uint[2] calldata _pubSignals
    ) external {
        // Step 1: verify the ZK proof on-chain.
        bool valid = IVerifier(verifier).verifyProof(_pA, _pB, _pC, _pubSignals);
        if (!valid) revert ZKProofInvalid();

        // Step 2: bind the proof to the requested model ID.
        if (_pubSignals[1] != modelId) revert ModelIdMismatch();

        // Step 3: emit the proof verification audit event.
        emit ProofVerified(modelId, msg.sender, block.timestamp);

        // Step 4: emit the cross-chain message for the relayer.
        emit CrossChainMessage(
            nonce++,
            modelId,
            dstChainId,
            msg.sender,
            block.timestamp,
            payload
        );
    }

    // View helpers

    /// @notice Return the verifier contract address.
    function getVerifier() external view returns (address) {
        return verifier;
    }
}
