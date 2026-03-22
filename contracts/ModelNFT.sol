// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./ModelAccessControl.sol";

/// @title ModelNFT
/// @notice ERC-721 token representing registered AI models. Each NFT = one model identity.
contract ModelNFT {
    // ─── ERC-721 State ──────────────────────────────────────────────────────

    string public name = "AI Model Provenance Token";
    string public symbol = "AIMPT";

    mapping(uint256 => address) public tokenOwner;
    mapping(address => uint256) public balanceOf;
    mapping(uint256 => address) public tokenApprovals;
    mapping(address => mapping(address => bool)) public operatorApprovals;

    uint256 private _tokenIds;
    uint256 private _burnedCounter;

    // ─── Extended State ─────────────────────────────────────────────────────

    ModelAccessControl public accessControl;

    // tokenId → modelId（在 ModelRegistry 中的 ID）
    mapping(uint256 => uint256) public tokenToModel;
    // modelId → tokenId（1:1 映射）
    mapping(uint256 => uint256) public modelToToken;
    // modelId → 是否已铸造 NFT
    mapping(uint256 => bool) public modelHasNft;

    // tokenId → IPFS metadata CID
    mapping(uint256 => string) public tokenMetadata;

    // tokenId → 上一次转移时间戳（用于冷却期）
    mapping(uint256 => uint256) public lastTransferTime;
    uint256 public transferCooldown = 1 days;

    // ─── Events ─────────────────────────────────────────────────────────────

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    event ModelNFTMinted(uint256 indexed tokenId, uint256 indexed modelId, address owner);
    event ModelNFTBurned(uint256 indexed tokenId, uint256 indexed modelId);
    event ModelNFTTransferred(
        uint256 indexed tokenId,
        uint256 indexed modelId,
        address indexed from,
        address to,
        uint256 timestamp
    );

    // ─── Errors ─────────────────────────────────────────────────────────────

    error TransferCooldownActive();
    error ModelAlreadyHasNFT();
    error ModelNotRegistered();
    error NotTokenOwner();
    error ZeroAddress();

    // ─── Constructor ─────────────────────────────────────────────────────────

    constructor(address _accessControl) {
        require(_accessControl != address(0), "ModelNFT: access control required");
        accessControl = ModelAccessControl(_accessControl);
    }

    // ─── NFT Core ────────────────────────────────────────────────────────────

    function mint(
        uint256 _modelId,
        string calldata _metadataCid
    ) external notBlacklisted returns (uint256) {
        require(
            accessControl.hasRole(accessControl.MINTER(), msg.sender),
            "ModelNFT: requires MINTER role"
        );

        require(!modelHasNft[_modelId], "ModelNFT: model already has NFT");

        uint256 tokenId = ++_tokenIds;

        _mint(msg.sender, tokenId);
        tokenToModel[tokenId] = _modelId;
        modelToToken[_modelId] = tokenId;
        modelHasNft[_modelId] = true;
        tokenMetadata[tokenId] = _metadataCid;

        emit ModelNFTMinted(tokenId, _modelId, msg.sender);
        return tokenId;
    }

    function burn(uint256 _tokenId) external {
        require(ownerOf(_tokenId) == msg.sender, "ModelNFT: not owner");

        uint256 modelId = tokenToModel[_tokenId];
        delete tokenToModel[_tokenId];
        delete modelToToken[modelId];
        delete modelHasNft[modelId];
        delete tokenMetadata[_tokenId];
        delete lastTransferTime[_tokenId];

        _burn(msg.sender, _tokenId);

        emit ModelNFTBurned(_tokenId, modelId);
    }

    /// @notice 转移（带 cooldown 检测）
    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _tokenId
    ) external {
        require(_to != address(0), "ModelNFT: transfer to zero");
        require(!accessControl.isBlacklisted(_to), "ModelNFT: recipient is blacklisted");

        address owner = ownerOf(_tokenId);
        require(
            owner == msg.sender ||
            tokenApprovals[_tokenId] == msg.sender ||
            operatorApprovals[owner][msg.sender],
            "ModelNFT: not authorized"
        );

        // Cooldown 检查（首次转移无 cooldown）
        if (lastTransferTime[_tokenId] > 0) {
            require(
                block.timestamp >= lastTransferTime[_tokenId] + transferCooldown,
                "ModelNFT: transfer cooldown active"
            );
        }

        lastTransferTime[_tokenId] = block.timestamp;

        _transfer(_from, _to, _tokenId);

        emit ModelNFTTransferred(_tokenId, tokenToModel[_tokenId], _from, _to, block.timestamp);
    }

    function approve(address _to, uint256 _tokenId) external {
        address owner = ownerOf(_tokenId);
        require(msg.sender == owner, "ModelNFT: not owner");
        tokenApprovals[_tokenId] = _to;
        emit Approval(owner, _to, _tokenId);
    }

    function setApprovalForAll(address _operator, bool _approved) external {
        operatorApprovals[msg.sender][_operator] = _approved;
        emit ApprovalForAll(msg.sender, _operator, _approved);
    }

    // ─── Query Functions ────────────────────────────────────────────────────

    function ownerOf(uint256 _tokenId) public view returns (address) {
        address owner = tokenOwner[_tokenId];
        require(owner != address(0), "ModelNFT: token does not exist");
        return owner;
    }

    function tokenURI(uint256 _tokenId) external view returns (string memory) {
        require(tokenOwner[_tokenId] != address(0), "ModelNFT: token does not exist");
        return tokenMetadata[_tokenId];
    }

    function totalSupply() external view returns (uint256) {
        return _tokenIds - _burnedCounter;
    }

    function getTokenByModel(uint256 _modelId) external view returns (uint256) {
        return modelToToken[_modelId];
    }

    /// @notice 批量获取某用户的 NFT 列表
    function getOwnerTokens(address _owner) external view returns (uint256[] memory) {
        uint256 count = balanceOf[_owner];
        uint256[] memory tokens = new uint256[](count);
        uint256 index = 0;

        for (uint i = 1; i <= _tokenIds; i++) {
            if (tokenOwner[i] == _owner) {
                tokens[index++] = i;
            }
        }
        return tokens;
    }

    /// @notice 设置转移冷却时间（仅 ADMIN）
    function setTransferCooldown(uint256 _seconds) external onlyAdmin {
        transferCooldown = _seconds;
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    function _mint(address _to, uint256 _tokenId) internal {
        tokenOwner[_tokenId] = _to;
        balanceOf[_to]++;
        lastTransferTime[_tokenId] = block.timestamp;
        emit Transfer(address(0), _to, _tokenId);
    }

    function _burn(address _from, uint256 _tokenId) internal {
        balanceOf[_from]--;
        delete tokenOwner[_tokenId];
        delete tokenApprovals[_tokenId];
        _burnedCounter++;
        emit Transfer(_from, address(0), _tokenId);
    }

    function _transfer(address _from, address _to, uint256 _tokenId) internal {
        require(tokenOwner[_tokenId] == _from, "ModelNFT: not owner");

        delete tokenApprovals[_tokenId];
        tokenOwner[_tokenId] = _to;
        balanceOf[_from]--;
        balanceOf[_to]++;

        emit Transfer(_from, _to, _tokenId);
    }

    function _tokenIdFromOwner(address _owner) internal view returns (uint256) {
        // 简化：返回该owner的第一个token（实际应用需维护owner→tokenIds列表）
        for (uint i = 1; i <= _tokenIds; i++) {
            if (tokenOwner[i] == _owner) return i;
        }
        return 0;
    }

    function ownerOf_nolookup(uint256 _tokenId) internal view returns (address) {
        return tokenOwner[_tokenId];
    }

    modifier onlyAdmin() {
        if (!accessControl.hasRole(accessControl.ADMIN(), msg.sender)) {
            revert NotTokenOwner();
        }
        _;
    }

    modifier notBlacklisted() {
        if (accessControl.isBlacklisted(msg.sender)) {
            revert ZeroAddress();
        }
        _;
    }
}

