// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./ModelAccessControl.sol";

/// @title ModelAuditLog
/// @notice Immutable audit trail for all sensitive operations in the provenance system
contract ModelAuditLog {

    // ─── Action Types ────────────────────────────────────────────────────────

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

    // ─── Struct ─────────────────────────────────────────────────────────────

    struct AuditEntry {
        uint256 id;
        ActionType action;
        address actor;
        uint256 targetId;       // modelId / tokenId / address
        uint256 timestamp;
        bytes32 previousHash;   // 链式哈希（防篡改）
        string metadata;         // 额外数据（JSON字符串存IPFS CID等）
        bytes32 contentHash;    // 操作内容的哈希
    }

    // ─── Storage ─────────────────────────────────────────────────────────────

    ModelAccessControl public accessControl;
    uint256 private _entryCounter;

    mapping(uint256 => AuditEntry) public entries;
    uint256 public totalEntries;

    // 链首哈希（最新条目哈希）
    bytes32 public chainHead;

    // 快速索引: modelId → entryIds
    mapping(uint256 => uint256[]) public modelAuditIndex;

    // ─── Events ─────────────────────────────────────────────────────────────

    event AuditEntryAdded(
        uint256 indexed entryId,
        ActionType indexed action,
        address indexed actor,
        uint256 targetId
    );

    // ─── Errors ─────────────────────────────────────────────────────────────

    error OnlyAuditor();
    error EmptyMetadata();

    // ─── Constructor ─────────────────────────────────────────────────────────

    constructor(address _accessControl) {
        require(_accessControl != address(0), "AuditLog: access control required");
        accessControl = ModelAccessControl(_accessControl);

        // 创建创世条目（entryId=1），并将 _entryCounter 设为 1
        _appendGenesis();
        _entryCounter = 1; // 防止后续 _append 从 1 开始覆盖创世块
    }

    // ─── External Functions ───────────────────────────────────────────────────

    /// @notice 记录任意操作（AUDITOR 或 ADMIN 可调用）
    function logAction(
        ActionType _action,
        uint256 _targetId,
        string calldata _metadata,
        bytes32 _contentHash
    ) external onlyAuditorOrAdmin returns (uint256) {
        return _append(_action, msg.sender, _targetId, _metadata, _contentHash);
    }

    /// @notice 记录模型注册（自动调用接口，供其他合约调用）
    function logModelRegistered(
        uint256 _modelId,
        address _owner,
        string calldata _metadata
    ) external onlyAuditorOrAdmin returns (uint256) {
        return _append(ActionType.MODEL_REGISTERED, _owner, _modelId, _metadata, keccak256(abi.encode(_modelId, _owner)));
    }

    /// @notice 记录状态变更
    function logStatusChange(
        uint256 _modelId,
        uint8 _oldStatus,
        uint8 _newStatus,
        address _operator
    ) external onlyAuditorOrAdmin returns (uint256) {
        bytes32 ch = keccak256(abi.encode(_modelId, _oldStatus, _newStatus, _operator));
        return _append(ActionType.MODEL_REVOKED, _operator, _modelId, "", ch);
    }

    /// @notice 记录版本新增
    function logVersionAdded(
        uint256 _modelId,
        uint256 _versionId,
        address _operator,
        string calldata _metadata
    ) external onlyAuditorOrAdmin returns (uint256) {
        bytes32 ch = keccak256(abi.encode(_modelId, _versionId, _operator));
        return _append(ActionType.VERSION_ADDED, _operator, _modelId, _metadata, ch);
    }

    /// @notice 记录转让
    function logOwnershipTransfer(
        uint256 _modelId,
        address _from,
        address _to,
        bool _accepted
    ) external onlyAuditorOrAdmin returns (uint256) {
        ActionType action = _accepted
            ? ActionType.OWNERSHIP_TRANSFER_ACCEPTED
            : ActionType.OWNERSHIP_TRANSFER_REQUESTED;

        bytes32 ch = keccak256(abi.encode(_modelId, _from, _to, _accepted));
        return _append(action, msg.sender, _modelId, "", ch);
    }

    /// @notice 记录质押
    function logStakeChange(
        uint256 _modelId,
        address _actor,
        uint256 _amount,
        bool _slashed
    ) external onlyAuditorOrAdmin returns (uint256) {
        ActionType action = _slashed ? ActionType.STAKE_SLASHED : ActionType.STAKE_DEPOSITED;
        bytes32 ch = keccak256(abi.encode(_modelId, _actor, _amount, _slashed));
        return _append(action, _actor, _modelId, "", ch);
    }

    /// @notice 记录角色变更
    function logRoleChange(
        address _account,
        bytes32 _role,
        bool _granted
    ) external onlyAuditorOrAdmin returns (uint256) {
        ActionType action = _granted ? ActionType.ROLE_GRANTED : ActionType.ROLE_REVOKED;
        bytes32 ch = keccak256(abi.encode(_account, _role, _granted));
        return _append(action, msg.sender, 0, "", ch);
    }

    /// @notice 验证链完整性（从任意条目往回验证哈希链）
    function verifyChain(uint256 _entryId) external view returns (bool) {
        if (_entryId == 0 || _entryId > totalEntries) return false;
        if (_entryId == 1) return true; // 创世块

        AuditEntry memory entry = entries[_entryId];
        AuditEntry memory prev = entries[_entryId - 1];

        bytes32 expectedHash = keccak256(abi.encode(
            prev.id, prev.action, prev.actor, prev.targetId,
            prev.timestamp, prev.previousHash, prev.contentHash
        ));

        return entry.previousHash == expectedHash;
    }

    /// @notice 获取某模型的所有审计条目
    function getModelAuditTrail(uint256 _modelId) external view returns (AuditEntry[] memory) {
        uint256[] storage ids = modelAuditIndex[_modelId];
        AuditEntry[] memory result = new AuditEntry[](ids.length);
        for (uint i = 0; i < ids.length; i++) {
            result[i] = entries[ids[i]];
        }
        return result;
    }

    /// @notice 获取某时间范围内的审计条目（通过事件查询更高效）
    function getEntriesByRange(uint256 _start, uint256 _end) external view returns (AuditEntry[] memory) {
        require(_start <= _end && _end <= totalEntries, "AuditLog: invalid range");
        uint256 count = _end - _start + 1;
        AuditEntry[] memory result = new AuditEntry[](count);
        for (uint i = _start; i <= _end; i++) {
            result[i - _start] = entries[i];
        }
        return result;
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

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
        chainHead = keccak256(abi.encode(
            entry.id, entry.action, entry.actor, entry.targetId,
            entry.timestamp, entry.previousHash, entry.contentHash
        ));

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

        chainHead = keccak256(abi.encode(
            1, ActionType.MODEL_REGISTERED, address(0), uint256(0),
            block.timestamp, bytes32(0), genesisHash
        ));

        totalEntries = 1;
    }

    modifier onlyAuditorOrAdmin() {
        bool isAuditor = accessControl.hasRole(accessControl.AUDITOR(), msg.sender);
        bool isAdmin = accessControl.hasRole(accessControl.ADMIN(), msg.sender);
        if (!isAuditor && !isAdmin) revert OnlyAuditor();
        _;
    }
}

