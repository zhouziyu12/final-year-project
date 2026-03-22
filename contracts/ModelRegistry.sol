// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./ModelAccessControl.sol";

/// @title ModelRegistry
/// @notice AI model registry with state machine, version control, and ownership transfer
contract ModelRegistry {

    // ─── Enums ────────────────────────────────────────────────────────────────

    enum ModelStatus {
        DRAFT,      // 草稿，可编辑
        ACTIVE,     // 正式注册，可操作
        DEPRECATED, // 已废弃（不再推荐使用）
        REVOKED     // 已吊销（不可逆）
    }

    enum VersionType {
        MAJOR,  // 重大版本更新
        MINOR,  // 次要版本更新
        PATCH   // 补丁修复
    }

    // ─── Structs ─────────────────────────────────────────────────────────────

    struct Model {
        uint256 id;
        string name;
        string description;
        string ipfsCid;
        string checksum;
        string framework;
        string license;
        address owner;
        ModelStatus status;
        uint256 timestamp;
        uint256 stakeAmount;
        bool staked;
    }

    struct ModelVersion {
        uint256 versionId;
        uint256 modelId;
        uint8 versionMajor;
        uint8 versionMinor;
        uint8 versionPatch;
        VersionType versionType;
        string ipfsMetadata;
        string parentHash;
        uint256 timestamp;
        address operator;
    }

    struct Transfer {
        uint256 modelId;
        address from;
        address to;
        uint256 timestamp;
        bool accepted;
    }

    // ─── Storage ─────────────────────────────────────────────────────────────

    ModelAccessControl public accessControl;
    uint256 private _modelCounter;
    uint256 private _versionCounter;

    mapping(uint256 => Model) public models;
    mapping(uint256 => mapping(uint256 => ModelVersion)) public versions;
    mapping(uint256 => uint256) public latestVersionId;
    mapping(uint256 => uint256) public versionCount;
    mapping(uint256 => Transfer) public pendingTransfers;
    mapping(uint256 => Transfer[]) public transferHistory;

    // ─── Events ─────────────────────────────────────────────────────────────

    event ModelRegistered(
        uint256 indexed id,
        address indexed owner
    );

    event ModelStatusChanged(
        uint256 indexed id,
        ModelStatus oldStatus,
        ModelStatus newStatus,
        address indexed operator
    );

    event VersionAdded(
        uint256 indexed modelId,
        uint256 indexed versionId,
        uint8 major,
        uint8 minor,
        uint8 patch,
        VersionType versionType
    );

    event OwnershipTransferRequested(
        uint256 indexed modelId,
        address indexed from,
        address indexed to
    );

    event OwnershipTransferAccepted(
        uint256 indexed modelId,
        address indexed from,
        address indexed to
    );

    event OwnershipTransferCancelled(
        uint256 indexed modelId,
        address indexed cancelledBy
    );

    // ─── Errors ───────────────────────────────────────────────────────────────

    error InvalidStatus(ModelStatus expected, ModelStatus actual);
    error NotOwner(address expected, address actual);
    error TransferNotPending();
    error TransferAlreadyPending();
    error BlacklistedAddress();
    error StakedModel();
    error ZeroStake();
    error InsufficientStake();

    // ─── Constructor ─────────────────────────────────────────────────────────

    constructor(address _accessControl) {
        require(_accessControl != address(0), "AccessControl address required");
        accessControl = ModelAccessControl(_accessControl);
    }

    // ─── External Functions ───────────────────────────────────────────────────

    /// @notice 注册新模型（需要 REGISTRAR 角色且不在黑名单）
    function registerModel(
        string calldata _name,
        string calldata _description,
        string calldata _ipfsCid,
        string calldata _checksum,
        string calldata _framework,
        string calldata _license
    ) external notBlacklisted returns (uint256) {
        require(
            accessControl.hasRole(accessControl.REGISTRAR(), msg.sender),
            "ModelRegistry: requires REGISTRAR role"
        );

        uint256 id = ++_modelCounter;

        // 逐字段赋值，减少栈压力
        Model storage m = models[id];
        m.id = id;
        m.name = _name;
        m.description = _description;
        m.ipfsCid = _ipfsCid;
        m.checksum = _checksum;
        m.framework = _framework;
        m.license = _license;
        m.owner = msg.sender;
        m.status = ModelStatus.DRAFT;
        m.timestamp = block.timestamp;
        m.stakeAmount = 0;
        m.staked = false;

        // 自动创建 v0.0.1 版本
        _addVersion(id, 1, 0, 0, 1, VersionType.PATCH, "", "");

        emit ModelRegistered(id, msg.sender);
        return id;
    }

    /// @notice 激活模型（DRAFT → ACTIVE）
    function activateModel(uint256 _id) external {
        Model storage model = models[_id];
        _requireOwner(model);
        if (model.status != ModelStatus.DRAFT) {
            revert InvalidStatus(ModelStatus.DRAFT, model.status);
        }
        _setStatus(model, _id, ModelStatus.ACTIVE);
    }

    /// @notice 弃用模型（ACTIVE → DEPRECATED）
    function deprecateModel(uint256 _id) external {
        Model storage model = models[_id];
        _requireOwner(model);
        if (model.status != ModelStatus.ACTIVE) {
            revert InvalidStatus(ModelStatus.ACTIVE, model.status);
        }
        _setStatus(model, _id, ModelStatus.DEPRECATED);
    }

    /// @notice 吊销模型（ACTIVE/DEPRECATED → REVOKED）
    function revokeModel(uint256 _id) external {
        Model storage model = models[_id];
        bool isOwner = model.owner == msg.sender;
        bool isAdmin = accessControl.hasRole(accessControl.ADMIN(), msg.sender);

        if (!isOwner && !isAdmin) {
            revert NotOwner(model.owner, msg.sender);
        }
        if (model.status == ModelStatus.REVOKED) {
            revert InvalidStatus(ModelStatus.REVOKED, model.status);
        }

        ModelStatus oldStatus = model.status;
        model.status = ModelStatus.REVOKED;
        emit ModelStatusChanged(_id, oldStatus, ModelStatus.REVOKED, msg.sender);
    }

    /// @notice 更新模型元数据（仅 ACTIVE 状态）
    function updateMetadata(
        uint256 _id,
        string calldata _description,
        string calldata _ipfsCid,
        string calldata _checksum
    ) external {
        Model storage model = models[_id];
        _requireOwner(model);
        require(model.status == ModelStatus.ACTIVE, "ModelRegistry: must be ACTIVE");

        model.description = _description;
        model.ipfsCid = _ipfsCid;
        model.checksum = _checksum;
    }

    /// @notice 添加新版本
    function addVersion(
        uint256 _modelId,
        uint8 _major,
        uint8 _minor,
        uint8 _patch,
        VersionType _type,
        string calldata _ipfsMetadata,
        string calldata _parentHash
    ) external notBlacklisted returns (uint256) {
        Model storage model = models[_modelId];
        _requireOwner(model);

        uint256 latest = latestVersionId[_modelId];
        if (latest > 0) {
            ModelVersion memory lv = versions[_modelId][latest];
            bool validVersion = (_major > lv.versionMajor) ||
                (_major == lv.versionMajor && _minor > lv.versionMinor) ||
                (_major == lv.versionMajor && _minor == lv.versionMinor && _patch > lv.versionPatch);
            require(validVersion, "ModelRegistry: version must be greater than current");
        }

        uint256 versionId = ++_versionCounter;

        _addVersion(_modelId, versionId, _major, _minor, _patch, _type, _ipfsMetadata, _parentHash);

        return versionId;
    }

    /// @notice 请求转让
    function requestTransfer(uint256 _modelId, address _newOwner) external notBlacklisted {
        Model storage model = models[_modelId];
        _requireOwner(model);
        require(model.status == ModelStatus.ACTIVE, "ModelRegistry: must be ACTIVE");
        require(!model.staked, "ModelRegistry: staked model cannot transfer");
        require(_newOwner != address(0), "ModelRegistry: new owner is zero");
        require(!accessControl.isBlacklisted(_newOwner), "ModelRegistry: new owner is blacklisted");
        require(pendingTransfers[_modelId].from == address(0), "ModelRegistry: transfer already pending");

        pendingTransfers[_modelId] = Transfer({
            modelId: _modelId,
            from: msg.sender,
            to: _newOwner,
            timestamp: block.timestamp,
            accepted: false
        });

        emit OwnershipTransferRequested(_modelId, msg.sender, _newOwner);
    }

    /// @notice 接受转让
    function acceptTransfer(uint256 _modelId) external notBlacklisted {
        Transfer storage transfer = pendingTransfers[_modelId];
        if (transfer.from == address(0)) revert TransferNotPending();
        require(transfer.to == msg.sender, "ModelRegistry: not the transfer recipient");
        require(!accessControl.isBlacklisted(msg.sender), "BlacklistedAddress");

        Model storage model = models[_modelId];
        address oldOwner = model.owner;
        model.owner = msg.sender;

        transfer.accepted = true;
        transferHistory[_modelId].push(transfer);
        delete pendingTransfers[_modelId];

        emit OwnershipTransferAccepted(_modelId, oldOwner, msg.sender);
    }

    /// @notice 取消转让
    function cancelTransfer(uint256 _modelId) external {
        Transfer storage transfer = pendingTransfers[_modelId];
        if (transfer.from == address(0)) revert TransferNotPending();
        require(transfer.from == msg.sender, "ModelRegistry: not the transfer initiator");
        delete pendingTransfers[_modelId];
        emit OwnershipTransferCancelled(_modelId, msg.sender);
    }

    /// @notice 获取版本历史
    function getVersionHistory(uint256 _modelId) external view returns (ModelVersion[] memory) {
        uint256 count = versionCount[_modelId];
        ModelVersion[] memory history = new ModelVersion[](count);
        for (uint256 i = 1; i <= count; i++) {
            history[i - 1] = versions[_modelId][i];
        }
        return history;
    }

    /// @notice 查询模型状态
    function getModelStatus(uint256 _id) external view returns (ModelStatus) {
        return models[_id].status;
    }

    /// @notice 查询模型所有者
    function getModelOwner(uint256 _id) external view returns (address) {
        return models[_id].owner;
    }

    /// @notice 查询是否已质押
    function isModelStaked(uint256 _id) external view returns (bool) {
        return models[_id].staked;
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    function _addVersion(
        uint256 _modelId,
        uint256 _versionId,
        uint8 _major,
        uint8 _minor,
        uint8 _patch,
        VersionType _type,
        string memory _ipfsMetadata,
        string memory _parentHash
    ) internal {
        // 直接字段赋值，避免 viaIR + struct 字面量的潜在编译器问题
        ModelVersion storage v = versions[_modelId][_versionId];
        v.versionId = _versionId;
        v.modelId = _modelId;
        v.versionMajor = _major;
        v.versionMinor = _minor;
        v.versionPatch = _patch;
        v.versionType = _type;
        v.ipfsMetadata = _ipfsMetadata;
        v.parentHash = _parentHash;
        v.timestamp = block.timestamp;
        v.operator = msg.sender;

        latestVersionId[_modelId] = _versionId;
        versionCount[_modelId]++;

        emit VersionAdded(_modelId, _versionId, _major, _minor, _patch, _type);
    }

    function _setStatus(Model storage _model, uint256 _id, ModelStatus _newStatus) internal {
        ModelStatus oldStatus = _model.status;
        _model.status = _newStatus;
        emit ModelStatusChanged(_id, oldStatus, _newStatus, msg.sender);
    }

    function _requireOwner(Model storage _model) internal view {
        if (_model.owner != msg.sender) {
            revert NotOwner(_model.owner, msg.sender);
        }
    }

    modifier notBlacklisted() {
        if (accessControl.isBlacklisted(msg.sender)) {
            revert BlacklistedAddress();
        }
        _;
    }
}


