// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title IVerifier
/// @notice Interface matching the snarkjs-generated Verifier.sol.
interface IVerifier {
    function verifyProof(
        uint[2] calldata _pA,
        uint[2][2] calldata _pB,
        uint[2] calldata _pC,
        uint[3] calldata _pubSignals
    ) external view returns (bool);
}

/// @title RealZKBridge
/// @notice Trustless cross-chain bridge with mandatory on-chain ZK proof verification.
/// @dev The bridge relies on cryptographic verification rather than human approval.
contract RealZKBridge {
    // State

    uint256 public nonce;
    uint256 private constant SNARK_SCALAR_FIELD =
        21888242871839275222246405745257275088548364400416034343698204186575808495617;

    /// @notice Address of the deployed verifier contract.
    address public immutable verifier;
    mapping(address => mapping(uint256 => bool)) public usedBridgeNonces;
    mapping(uint256 => bool) public usedNullifiers;

    // Events

    /// @notice Emitted only after a valid ZK proof is verified on-chain.
    event CrossChainMessage(
        uint256 indexed messageId,
        uint256 indexed modelId,
        uint16 dstChainId,
        address sender,
        uint256 bridgeNonce,
        uint256 timestamp,
        uint256 messageHash,
        uint256 nullifier,
        bytes payload
    );

    /// @notice Audit event emitted for every successful proof verification.
    event ProofVerified(
        uint256 indexed modelId,
        address indexed prover,
        uint256 timestamp,
        uint256 nullifier
    );

    // Custom errors

    error ZKProofInvalid();
    error ModelIdMismatch();
    error MessageHashMismatch();
    error BridgeNonceAlreadyUsed();
    error NullifierAlreadyUsed();
    error InvalidDestinationChain();

    // Constructor

    /// @param _verifier Address of the deployed verifier contract.
    constructor(address _verifier) {
        require(_verifier != address(0), "Verifier address required");
        verifier = _verifier;
    }

    // Core function

    /// @notice Bridge model provenance data to a destination chain.
    /// @dev Circuit public signals layout:
    ///      pubSignals[0] = nullifier = Poseidon(secret, modelId, messageHash)
    ///      pubSignals[1] = modelId
    ///      pubSignals[2] = keccak256(modelId, dstChainId, bridgeNonce, payload, sender, chainId) % field
    function bridgeData(
        uint256 modelId,
        uint16 dstChainId,
        uint256 bridgeNonce,
        bytes calldata payload,
        uint[2] calldata _pA,
        uint[2][2] calldata _pB,
        uint[2] calldata _pC,
        uint[3] calldata _pubSignals
    ) external {
        if (dstChainId == 0) revert InvalidDestinationChain();

        // Step 1: verify the ZK proof on-chain.
        bool valid = IVerifier(verifier).verifyProof(_pA, _pB, _pC, _pubSignals);
        if (!valid) revert ZKProofInvalid();

        uint256 nullifier = _pubSignals[0];

        // Step 2: bind the proof to the requested model ID and payload context.
        if (_pubSignals[1] != modelId) revert ModelIdMismatch();
        uint256 expectedMessageHash = uint256(
            keccak256(abi.encode(modelId, dstChainId, bridgeNonce, payload, msg.sender, block.chainid))
        ) % SNARK_SCALAR_FIELD;
        if (_pubSignals[2] != expectedMessageHash) revert MessageHashMismatch();
        if (usedBridgeNonces[msg.sender][bridgeNonce]) revert BridgeNonceAlreadyUsed();
        if (usedNullifiers[nullifier]) revert NullifierAlreadyUsed();

        usedBridgeNonces[msg.sender][bridgeNonce] = true;
        usedNullifiers[nullifier] = true;

        // Step 3: emit the proof verification audit event.
        emit ProofVerified(modelId, msg.sender, block.timestamp, nullifier);

        // Step 4: emit the cross-chain message for the relayer.
        emit CrossChainMessage(
            nonce++,
            modelId,
            dstChainId,
            msg.sender,
            bridgeNonce,
            block.timestamp,
            expectedMessageHash,
            nullifier,
            payload
        );
    }

    // View helpers

    /// @notice Return the verifier contract address.
    function getVerifier() external view returns (address) {
        return verifier;
    }
}
