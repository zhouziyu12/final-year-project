// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./ModelAccessControl.sol";

/// @title ModelStaking
/// @notice Stake-based model registration with slashing support.
contract ModelStaking {
    // Storage

    ModelAccessControl public accessControl;
    mapping(uint256 => StakeInfo) public stakes;

    // Staking parameters
    uint256 public minStake = 0.01 ether;
    uint256 public slashRatio = 50;
    uint256 public lockPeriod = 7 days;

    address public treasury;

    uint256 public totalStaked;
    uint256 public totalSlashed;

    // Structs

    struct StakeInfo {
        uint256 modelId;
        address staker;
        uint256 amount;
        uint256 timestamp;
        uint256 unlockTime;
        bool withdrawn;
        bool slashed;
    }

    // Events

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

    // Errors

    error AlreadySlashed();
    error AlreadyWithdrawn();
    error BlacklistedAddress();
    error InvalidModelId();
    error NotAdmin();
    error StakeLocked();
    error StakerMismatch();
    error ZeroAmount();

    // Constructor

    constructor(address _accessControl, address _treasury) {
        require(_accessControl != address(0), "Staking: access control required");
        require(_treasury != address(0), "Staking: treasury required");

        accessControl = ModelAccessControl(_accessControl);
        treasury = _treasury;
    }

    // External functions

    /// @notice Deposit stake for a model.
    function stake(uint256 _modelId) external payable notBlacklisted {
        if (msg.value == 0) revert ZeroAmount();
        if (_modelId == 0) revert InvalidModelId();
        require(msg.value >= minStake, "Staking: below minimum stake");

        StakeInfo storage info = stakes[_modelId];

        if (info.amount == 0) {
            info.modelId = _modelId;
            info.staker = msg.sender;
            info.timestamp = block.timestamp;
            info.unlockTime = block.timestamp + lockPeriod;
            info.withdrawn = false;
            info.slashed = false;
        } else {
            if (info.staker != msg.sender) revert StakerMismatch();
            if (info.withdrawn) revert AlreadyWithdrawn();
            if (info.slashed) revert AlreadySlashed();
        }

        info.amount += msg.value;
        totalStaked += msg.value;

        emit StakeDeposited(_modelId, msg.sender, msg.value);
    }

    /// @notice Withdraw stake after the lock period expires.
    function withdraw(uint256 _modelId) external {
        StakeInfo storage info = stakes[_modelId];
        if (info.staker != msg.sender) revert StakerMismatch();
        if (info.withdrawn) revert AlreadyWithdrawn();
        if (info.slashed) revert AlreadySlashed();
        if (block.timestamp < info.unlockTime) revert StakeLocked();

        uint256 amount = info.amount;
        info.withdrawn = true;
        totalStaked -= amount;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Staking: transfer failed");

        emit StakeWithdrawn(_modelId, msg.sender, amount);
    }

    /// @notice Slash stake for a model.
    function slash(
        uint256 _modelId,
        string calldata _reason
    ) external onlyAdmin returns (uint256 slashedAmount) {
        return _slash(_modelId, _reason);
    }

    /// @notice Slash stake for multiple models.
    function batchSlash(
        uint256[] calldata _modelIds,
        string calldata _reason
    ) external onlyAdmin {
        for (uint256 i = 0; i < _modelIds.length; i++) {
            _slash(_modelIds[i], _reason);
        }
    }

    // Admin configuration

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

    // View functions

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

    // Internal functions

    function _slash(uint256 _modelId, string memory _reason) internal returns (uint256 slashedAmount) {
        if (_modelId == 0) revert InvalidModelId();

        StakeInfo storage info = stakes[_modelId];
        require(info.amount > 0, "Staking: no stake");
        if (info.slashed) revert AlreadySlashed();
        if (info.withdrawn) revert AlreadyWithdrawn();

        uint256 originalAmount = info.amount;
        slashedAmount = (originalAmount * slashRatio) / 100;
        uint256 toStaker = originalAmount - slashedAmount;

        info.amount = 0;
        info.slashed = true;
        info.withdrawn = true;
        totalStaked -= originalAmount;
        totalSlashed += slashedAmount;

        if (toStaker > 0) {
            (bool stakerRefundOk, ) = info.staker.call{value: toStaker}("");
            require(stakerRefundOk, "Staking: staker refund failed");
        }

        if (slashedAmount > 0) {
            (bool treasuryTransferOk, ) = treasury.call{value: slashedAmount}("");
            require(treasuryTransferOk, "Staking: treasury transfer failed");
        }

        emit StakeSlashed(_modelId, info.staker, slashedAmount, slashedAmount, _reason);
        return slashedAmount;
    }

    // Modifiers

    modifier onlyAdmin() {
        if (!accessControl.hasRole(accessControl.ADMIN(), msg.sender)) {
            revert NotAdmin();
        }
        _;
    }

    modifier notBlacklisted() {
        if (accessControl.isBlacklisted(msg.sender)) {
            revert BlacklistedAddress();
        }
        _;
    }
}
