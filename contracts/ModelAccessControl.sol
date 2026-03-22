// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title ModelAccessControl
/// @notice RBAC role-based access control for the provenance system
/// @dev Four roles: ADMIN, REGISTRAR, AUDITOR, MINTER
contract ModelAccessControl {
    // ─── Roles ────────────────────────────────────────────────────────────────

    bytes32 public constant ADMIN     = keccak256("ADMIN");
    bytes32 public constant REGISTRAR = keccak256("REGISTRAR");
    bytes32 public constant AUDITOR   = keccak256("AUDITOR");
    bytes32 public constant MINTER    = keccak256("MINTER");

    // ─── Storage ─────────────────────────────────────────────────────────────

    mapping(bytes32 => mapping(address => bool)) private _roles;
    mapping(address => bool) private _blacklist;

    address public governance;  // 多签/DAO 治理地址（可升级角色）

    // ─── Events ───────────────────────────────────────────────────────────────

    event RoleGranted(bytes32 indexed role, address indexed account, address indexed grantedBy);
    event RoleRevoked(bytes32 indexed role, address indexed account, address indexed revokedBy);
    event Blacklisted(address indexed account, address indexed by);
    event Unblacklisted(address indexed account, address indexed by);
    event GovernanceChanged(address indexed oldGov, address indexed newGov);

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyAdmin() {
        require(hasRole(ADMIN, msg.sender), "AccessControl: caller is not admin");
        _;
    }

    modifier notBlacklisted() {
        require(!isBlacklisted(msg.sender), "AccessControl: caller is blacklisted");
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────────────

    constructor(address _governance) {
        require(_governance != address(0), "AccessControl: governance address required");
        governance = _governance;

        // 部署者自动成为 ADMIN
        _grantRole(ADMIN, msg.sender);
    }

    // ─── External Functions ───────────────────────────────────────────────────

    /// @notice 授予角色（仅 ADMIN）
    function grantRole(bytes32 role, address account) external onlyAdmin {
        _grantRole(role, account);
    }

    /// @notice 撤销角色（仅 ADMIN）
    function revokeRole(bytes32 role, address account) external onlyAdmin {
        _revokeRole(role, account);
    }

    /// @notice 将地址加入黑名单（仅 ADMIN）
    function addBlacklist(address account) external onlyAdmin {
        require(account != address(0), "AccessControl: cannot blacklist zero");
        require(!_blacklist[account], "AccessControl: already blacklisted");
        _blacklist[account] = true;
        emit Blacklisted(account, msg.sender);
    }

    /// @notice 将地址从黑名单移除（仅 ADMIN）
    function removeBlacklist(address account) external onlyAdmin {
        require(_blacklist[account], "AccessControl: not blacklisted");
        _blacklist[account] = false;
        emit Unblacklisted(account, msg.sender);
    }

    /// @notice 转移 ADMIN 角色（仅当前 ADMIN）
    function transferAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "AccessControl: new admin is zero");
        _revokeRole(ADMIN, msg.sender);
        _grantRole(ADMIN, newAdmin);
    }

    /// @notice 更新治理地址（仅 ADMIN）
    function updateGovernance(address newGov) external onlyAdmin {
        require(newGov != address(0), "AccessControl: governance is zero");
        address oldGov = governance;
        governance = newGov;
        emit GovernanceChanged(oldGov, newGov);
    }

    /// @notice 批量授予角色（仅 ADMIN）
    function grantRoles(bytes32 role, address[] calldata accounts) external onlyAdmin {
        for (uint i = 0; i < accounts.length; i++) {
            _grantRole(role, accounts[i]);
        }
    }

    // ─── View Functions ───────────────────────────────────────────────────────

    function hasRole(bytes32 role, address account) public view returns (bool) {
        return _roles[role][account];
    }

    function isBlacklisted(address account) public view returns (bool) {
        return _blacklist[account];
    }

    /// @notice 获取某角色下的所有成员数量（需要外部维护列表，这里提供查询接口）
    /// @dev 实际成员列表建议在应用层或用 Events 索引
    function getGovernance() external view returns (address) {
        return governance;
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    function _grantRole(bytes32 role, address account) internal {
        require(account != address(0), "AccessControl: account is zero");
        _roles[role][account] = true;
        emit RoleGranted(role, account, msg.sender);
    }

    function _revokeRole(bytes32 role, address account) internal {
        _roles[role][account] = false;
        emit RoleRevoked(role, account, msg.sender);
    }
}
