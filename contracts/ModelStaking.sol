// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./ModelAccessControl.sol";

/// @title ModelStaking
/// @notice Stake-based model registration with slashing mechanism for quality assurance
contract ModelStaking {
    // ─── Storage ─────────────────────────────────────────────────────────────

    ModelAccessControl public accessControl;

    // modelId → stake info
    mapping(uint256 => StakeInfo) public stakes;

    // 质押参数（可由 ADMIN 调整）
    uint256 public minStake = 0.01 ether;
    uint256 public slashRatio = 50;  // 罚没比例 50%
    uint256 public lockPeriod = 7 days;

    // 罚没资金接收地址（国库/DAO）
    address public treasury;

    uint256 public totalStaked;
    uint256 public totalSlashed;

    // ─── Struct ─────────────────────────────────────────────────────────────

    struct StakeInfo {
        uint256 modelId;
        address staker;
        uint256 amount;
        uint256 timestamp;
        uint256 unlockTime;
        bool withdrawn;
        bool slashed;
    }

    // ─── Events ─────────────────────────────────────────────────────────────

    event StakeDeposited(uint256 indexed modelId, address indexed staker, uint256 amount);
    event StakeWithdrawn(uint256 indexed modelId, address indexed staker, uint256 amount);
    event StakeSlashed(
        uint256 indexed modelId,
        address indexed staker,
        uint256 slashedAmount,
        uint256 toTreasury,
        string reason
    );
    event SlashRatioUpdated(uint256 oldRatio, uint256 newRatio);
    event MinStakeUpdated(uint256 oldMin, uint256 newMin);
    event LockPeriodUpdated(uint256 oldPeriod, uint256 newPeriod);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);

    // ─── Errors ─────────────────────────────────────────────────────────────

    error InsufficientStake();
    error StakeLocked();
    error AlreadyWithdrawn();
    error AlreadySlashed();
    error ZeroAmount();
    error InvalidModelId();
    error StakerMismatch();

    // ─── Constructor ─────────────────────────────────────────────────────────

    constructor(address _accessControl, address _treasury) {
        require(_accessControl != address(0), "Staking: access control required");
        require(_treasury != address(0), "Staking: treasury required");

        accessControl = ModelAccessControl(_accessControl);
        treasury = _treasury;
    }

    // ─── External Functions ───────────────────────────────────────────────────

    /// @notice 质押（注册模型时调用，或后续追加质押）
    function stake(uint256 _modelId) external payable notBlacklisted {
        require(msg.value >= minStake, "Staking: below minimum stake");
        require(_modelId > 0, "Staking: invalid model id");

        StakeInfo storage info = stakes[_modelId];

        // 首次质押
        if (info.amount == 0) {
            info.modelId = _modelId;
            info.staker = msg.sender;
            info.timestamp = block.timestamp;
            info.unlockTime = block.timestamp + lockPeriod;
            info.withdrawn = false;
            info.slashed = false;
        } else {
            // 追加质押
            require(info.staker == msg.sender, "Staking: not the original staker");
            require(!info.withdrawn, "Staking: already withdrawn");
            require(!info.slashed, "Staking: already slashed");
        }

        info.amount += msg.value;
        totalStaked += msg.value;

        emit StakeDeposited(_modelId, msg.sender, msg.value);
    }

    /// @notice 提取质押（仅 staker，锁定期结束后）
    function withdraw(uint256 _modelId) external {
        StakeInfo storage info = stakes[_modelId];
        require(info.staker == msg.sender, "Staking: not staker");
        require(!info.withdrawn, "Staking: already withdrawn");
        require(!info.slashed, "Staking: already slashed");
        require(block.timestamp >= info.unlockTime, "Staking: still locked");

        uint256 amount = info.amount;
        info.withdrawn = true;
        totalStaked -= amount;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Staking: transfer failed");

        emit StakeWithdrawn(_modelId, msg.sender, amount);
    }

    /// @notice 罚没质押（仅 ADMIN）
    function slash(
        uint256 _modelId,
        string calldata _reason
    ) external onlyAdmin returns (uint256 slashedAmount) {
        StakeInfo storage info = stakes[_modelId];
        require(info.amount > 0, "Staking: no stake");
        require(!info.slashed, "Staking: already slashed");

        slashedAmount = (info.amount * slashRatio) / 100;
        uint256 toStaker = info.amount - slashedAmount;

        info.slashed = true;
        info.withdrawn = false;
        totalStaked -= info.amount;
        totalSlashed += slashedAmount;

        // 部分返还给 staker（惩罚性）
        if (toStaker > 0) {
            (bool s1, ) = info.staker.call{value: toStaker}("");
            require(s1, "Staking: staker refund failed");
        }

        // 部分发往国库
        if (slashedAmount > 0) {
            (bool s2, ) = treasury.call{value: slashedAmount}("");
            require(s2, "Staking: treasury transfer failed");
        }

        emit StakeSlashed(_modelId, info.staker, slashedAmount, slashedAmount, _reason);
        return slashedAmount;
    }

    /// @notice 批量罚没（ADMIN）
    function batchSlash(
        uint256[] calldata _modelIds,
        string calldata _reason
    ) external onlyAdmin {
        for (uint i = 0; i < _modelIds.length; i++) {
            try this.slash(_modelIds[i], _reason) {
                // 罚没成功，跳过
            } catch {
                // 单个失败不影响其他
            }
        }
    }

    // ─── Admin Config Functions ───────────────────────────────────────────────

    function updateSlashRatio(uint256 _ratio) external onlyAdmin {
        require(_ratio > 0 && _ratio <= 100, "Staking: ratio must be 1-100");
        uint256 old = slashRatio;
        slashRatio = _ratio;
        emit SlashRatioUpdated(old, _ratio);
    }

    function updateMinStake(uint256 _min) external onlyAdmin {
        uint256 old = minStake;
        minStake = _min;
        emit MinStakeUpdated(old, _min);
    }

    function updateLockPeriod(uint256 _period) external onlyAdmin {
        uint256 old = lockPeriod;
        lockPeriod = _period;
        emit LockPeriodUpdated(old, _period);
    }

    function updateTreasury(address _treasury) external onlyAdmin {
        require(_treasury != address(0), "Staking: treasury is zero");
        address old = treasury;
        treasury = _treasury;
        emit TreasuryUpdated(old, _treasury);
    }

    // ─── View Functions ────────────────────────────────────────────────────

    function getStakeInfo(uint256 _modelId) external view returns (StakeInfo memory) {
        return stakes[_modelId];
    }

    function getStakeAmount(uint256 _modelId) external view returns (uint256) {
        return stakes[_modelId].amount;
    }

    function getLockRemaining(uint256 _modelId) external view returns (uint256) {
        StakeInfo memory info = stakes[_modelId];
        if (block.timestamp >= info.unlockTime) return 0;
        return info.unlockTime - block.timestamp;
    }

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyAdmin() {
        if (!accessControl.hasRole(accessControl.ADMIN(), msg.sender)) {
            revert ZeroAmount();
        }
        _;
    }

    modifier notBlacklisted() {
        if (accessControl.isBlacklisted(msg.sender)) {
            revert ZeroAmount();
        }
        _;
    }
}
