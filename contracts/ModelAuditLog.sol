// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./ModelAccessControl.sol";

/// @title ModelAuditLog
/// @notice Immutable audit trail for sensitive provenance operations.
contract ModelAuditLog {
    // Action types

    enum ActionType {
        MODEL_REGISTERED,
        MODEL_ACTIVATED,
        MODEL_DEPRECATED,
        MODEL_REVOKED,
        MODEL_UPDATED,
        VERSION_ADDED,
        OWNERSHIP_TRANSFER_REQUESTED,
        OWNERSHIP_TRANSFER_ACCEPTED,
        OWNERSHIP_TRANSFER_CANCELLED,
        STAKE_DEPOSITED,
        STAKE_WITHDRAWN,
        STAKE_SLASHED,
        ROLE_GRANTED,
        ROLE_REVOKED,
        BLACKLIST_ADDED,
        BLACKLIST_REMOVED,
        NFT_MINTED,
        NFT_TRANSFERRED,
        NFT_BURNED
    }

    // Structs

    struct AuditEntry {
        uint256 id;
        ActionType action;
        address actor;
        uint256 targetId;
        uint256 timestamp;
        bytes32 previousHash;
        string metadata;
        bytes32 contentHash;
    }

    // Storage

    ModelAccessControl public accessControl;
    uint256 private _entryCounter;
    mapping(uint256 => AuditEntry) public entries;
    uint256 public totalEntries;
    bytes32 public chainHead;
    mapping(uint256 => uint256[]) public modelAuditIndex;

    // Events

    event AuditEntryAdded(
        uint256 indexed entryId,
        ActionType indexed action,
        address indexed actor,
        uint256 targetId
    );

    // Errors

    error OnlyAuditor();

    // Constructor

    constructor(address _accessControl) {
        require(_accessControl != address(0), "AuditLog: access control required");
        accessControl = ModelAccessControl(_accessControl);

        _appendGenesis();
        _entryCounter = 1;
    }

    // External functions

    /// @notice Record a generic audit action.
    function logAction(
        ActionType _action,
        uint256 _targetId,
        string calldata _metadata,
        bytes32 _contentHash
    ) external onlyAuditorOrAdmin returns (uint256) {
        return _append(_action, msg.sender, _targetId, _metadata, _contentHash);
    }

    /// @notice Record model registration.
    function logModelRegistered(
        uint256 _modelId,
        address _owner,
        string calldata _metadata
    ) external onlyAuditorOrAdmin returns (uint256) {
        return _append(
            ActionType.MODEL_REGISTERED,
            _owner,
            _modelId,
            _metadata,
            keccak256(abi.encode(_modelId, _owner))
        );
    }

    /// @notice Record model status changes.
    function logStatusChange(
        uint256 _modelId,
        uint8 _oldStatus,
        uint8 _newStatus,
        address _operator
    ) external onlyAuditorOrAdmin returns (uint256) {
        bytes32 contentHash = keccak256(abi.encode(_modelId, _oldStatus, _newStatus, _operator));
        ActionType action = _statusToAction(_newStatus);
        return _append(action, _operator, _modelId, "", contentHash);
    }

    /// @notice Record a new model version.
    function logVersionAdded(
        uint256 _modelId,
        uint256 _versionId,
        address _operator,
        string calldata _metadata
    ) external onlyAuditorOrAdmin returns (uint256) {
        bytes32 contentHash = keccak256(abi.encode(_modelId, _versionId, _operator));
        return _append(ActionType.VERSION_ADDED, _operator, _modelId, _metadata, contentHash);
    }

    /// @notice Record ownership transfer activity.
    function logOwnershipTransfer(
        uint256 _modelId,
        address _from,
        address _to,
        bool _accepted
    ) external onlyAuditorOrAdmin returns (uint256) {
        ActionType action = _accepted
            ? ActionType.OWNERSHIP_TRANSFER_ACCEPTED
            : ActionType.OWNERSHIP_TRANSFER_REQUESTED;

        bytes32 contentHash = keccak256(abi.encode(_modelId, _from, _to, _accepted));
        return _append(action, msg.sender, _modelId, "", contentHash);
    }

    /// @notice Record stake changes.
    function logStakeChange(
        uint256 _modelId,
        address _actor,
        uint256 _amount,
        bool _slashed
    ) external onlyAuditorOrAdmin returns (uint256) {
        ActionType action = _slashed ? ActionType.STAKE_SLASHED : ActionType.STAKE_DEPOSITED;
        bytes32 contentHash = keccak256(abi.encode(_modelId, _actor, _amount, _slashed));
        return _append(action, _actor, _modelId, "", contentHash);
    }

    /// @notice Record role changes.
    function logRoleChange(
        address _account,
        bytes32 _role,
        bool _granted
    ) external onlyAuditorOrAdmin returns (uint256) {
        ActionType action = _granted ? ActionType.ROLE_GRANTED : ActionType.ROLE_REVOKED;
        bytes32 contentHash = keccak256(abi.encode(_account, _role, _granted));
        return _append(action, msg.sender, 0, "", contentHash);
    }

    /// @notice Verify the audit chain up to a given entry.
    function verifyChain(uint256 _entryId) external view returns (bool) {
        if (_entryId == 0 || _entryId > totalEntries) return false;
        if (_entryId == 1) return true;

        bytes32 expectedPreviousHash = _entryHash(entries[1]);
        for (uint256 i = 2; i <= _entryId; i++) {
            AuditEntry memory entry = entries[i];
            if (entry.previousHash != expectedPreviousHash) {
                return false;
            }
            expectedPreviousHash = _entryHash(entry);
        }

        return true;
    }

    /// @notice Return the full audit trail for a model.
    function getModelAuditTrail(uint256 _modelId) external view returns (AuditEntry[] memory) {
        uint256[] storage ids = modelAuditIndex[_modelId];
        AuditEntry[] memory result = new AuditEntry[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = entries[ids[i]];
        }
        return result;
    }

    /// @notice Return audit entries in an inclusive ID range.
    function getEntriesByRange(uint256 _start, uint256 _end) external view returns (AuditEntry[] memory) {
        require(_start <= _end && _end <= totalEntries, "AuditLog: invalid range");
        uint256 count = _end - _start + 1;
        AuditEntry[] memory result = new AuditEntry[](count);
        for (uint256 i = _start; i <= _end; i++) {
            result[i - _start] = entries[i];
        }
        return result;
    }

    // Internal functions

    function _append(
        ActionType _action,
        address _actor,
        uint256 _targetId,
        string memory _metadata,
        bytes32 _contentHash
    ) internal returns (uint256) {
        uint256 entryId = ++_entryCounter;

        AuditEntry memory entry = AuditEntry({
            id: entryId,
            action: _action,
            actor: _actor,
            targetId: _targetId,
            timestamp: block.timestamp,
            previousHash: chainHead,
            metadata: _metadata,
            contentHash: _contentHash
        });

        entries[entryId] = entry;
        chainHead = _entryHash(entry);
        totalEntries = entryId;

        if (_targetId > 0) {
            modelAuditIndex[_targetId].push(entryId);
        }

        emit AuditEntryAdded(entryId, _action, _actor, _targetId);
        return entryId;
    }

    function _appendGenesis() internal {
        bytes32 genesisHash = keccak256(abi.encode("GENESIS", block.chainid, address(this)));

        entries[1] = AuditEntry({
            id: 1,
            action: ActionType.MODEL_REGISTERED,
            actor: address(0),
            targetId: 0,
            timestamp: block.timestamp,
            previousHash: bytes32(0),
            metadata: "Genesis entry",
            contentHash: genesisHash
        });

        chainHead = _entryHash(entries[1]);
        totalEntries = 1;
    }

    function _entryHash(AuditEntry memory _entry) internal pure returns (bytes32) {
        return keccak256(
            abi.encode(
                _entry.id,
                _entry.action,
                _entry.actor,
                _entry.targetId,
                _entry.timestamp,
                _entry.previousHash,
                _entry.contentHash
            )
        );
    }

    function _statusToAction(uint8 _status) internal pure returns (ActionType) {
        if (_status == 1) return ActionType.MODEL_ACTIVATED;
        if (_status == 2) return ActionType.MODEL_DEPRECATED;
        if (_status == 3) return ActionType.MODEL_REVOKED;
        return ActionType.MODEL_UPDATED;
    }

    modifier onlyAuditorOrAdmin() {
        bool isAuditor = accessControl.hasRole(accessControl.AUDITOR(), msg.sender);
        bool isAdmin = accessControl.hasRole(accessControl.ADMIN(), msg.sender);
        if (!isAuditor && !isAdmin) revert OnlyAuditor();
        _;
    }
}
