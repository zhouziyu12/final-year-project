// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./ModelAccessControl.sol";

interface IModelRegistryForNFT {
    function getModelOwner(uint256 _id) external view returns (address);
}

/// @title ModelNFT
/// @notice ERC-721 token representing registered AI models.
contract ModelNFT {
    // ERC-721 state

    string public name = "AI Model Provenance Token";
    string public symbol = "AIMPT";

    mapping(uint256 => address) public tokenOwner;
    mapping(address => uint256) public balanceOf;
    mapping(uint256 => address) public tokenApprovals;
    mapping(address => mapping(address => bool)) public operatorApprovals;

    uint256 private _tokenIds;
    uint256 private _burnedCounter;

    // Extended state

    ModelAccessControl public accessControl;
    IModelRegistryForNFT public registry;

    mapping(uint256 => uint256) public tokenToModel;
    mapping(uint256 => uint256) public modelToToken;
    mapping(uint256 => bool) public modelHasNft;
    mapping(uint256 => string) public tokenMetadata;
    mapping(uint256 => uint256) public lastTransferTime;

    uint256 public transferCooldown = 1 days;

    // Events

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

    // Errors

    error BlacklistedAddress();
    error ModelAlreadyHasNFT();
    error ModelNotRegistered();
    error NotAdmin();
    error TransferCooldownActive();
    error ZeroAddress();

    // Constructor

    constructor(address _accessControl, address _registry) {
        require(_accessControl != address(0), "ModelNFT: access control required");
        require(_registry != address(0), "ModelNFT: registry required");
        accessControl = ModelAccessControl(_accessControl);
        registry = IModelRegistryForNFT(_registry);
    }

    // NFT core

    function mint(
        uint256 _modelId,
        string calldata _metadataCid
    ) external notBlacklisted returns (uint256) {
        require(
            accessControl.hasRole(accessControl.MINTER(), msg.sender),
            "ModelNFT: requires MINTER role"
        );

        if (_modelId == 0) revert ModelNotRegistered();
        if (modelHasNft[_modelId]) revert ModelAlreadyHasNFT();

        address modelOwner = registry.getModelOwner(_modelId);
        if (modelOwner == address(0)) revert ModelNotRegistered();
        require(
            msg.sender == modelOwner || accessControl.hasRole(accessControl.ADMIN(), msg.sender),
            "ModelNFT: only owner or admin can mint"
        );

        uint256 tokenId = ++_tokenIds;

        _mint(modelOwner, tokenId);
        tokenToModel[tokenId] = _modelId;
        modelToToken[_modelId] = tokenId;
        modelHasNft[_modelId] = true;
        tokenMetadata[tokenId] = _metadataCid;

        emit ModelNFTMinted(tokenId, _modelId, modelOwner);
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

    /// @notice Transfer a token with cooldown protection.
    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _tokenId
    ) public {
        if (_to == address(0)) revert ZeroAddress();
        if (accessControl.isBlacklisted(_to)) revert BlacklistedAddress();

        address owner = ownerOf(_tokenId);
        require(_from == owner, "ModelNFT: invalid transfer source");
        require(
            owner == msg.sender ||
            tokenApprovals[_tokenId] == msg.sender ||
            operatorApprovals[owner][msg.sender],
            "ModelNFT: not authorized"
        );

        uint256 lastTransfer = lastTransferTime[_tokenId];
        if (lastTransfer > 0 && block.timestamp < lastTransfer + transferCooldown) {
            revert TransferCooldownActive();
        }

        lastTransferTime[_tokenId] = block.timestamp;
        _transfer(_from, _to, _tokenId);

        emit ModelNFTTransferred(_tokenId, tokenToModel[_tokenId], _from, _to, block.timestamp);
    }

    function transferFrom(address _from, address _to, uint256 _tokenId) external {
        safeTransferFrom(_from, _to, _tokenId);
    }

    function approve(address _to, uint256 _tokenId) external {
        address owner = ownerOf(_tokenId);
        require(msg.sender == owner, "ModelNFT: not owner");
        tokenApprovals[_tokenId] = _to;
        emit Approval(owner, _to, _tokenId);
    }

    function getApproved(uint256 _tokenId) external view returns (address) {
        ownerOf(_tokenId);
        return tokenApprovals[_tokenId];
    }

    function setApprovalForAll(address _operator, bool _approved) external {
        operatorApprovals[msg.sender][_operator] = _approved;
        emit ApprovalForAll(msg.sender, _operator, _approved);
    }

    function isApprovedForAll(address _owner, address _operator) external view returns (bool) {
        return operatorApprovals[_owner][_operator];
    }

    // Query functions

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

    /// @notice Return all token IDs owned by an account.
    function getOwnerTokens(address _owner) external view returns (uint256[] memory) {
        uint256 count = balanceOf[_owner];
        uint256[] memory tokens = new uint256[](count);
        uint256 index = 0;

        for (uint256 i = 1; i <= _tokenIds; i++) {
            if (tokenOwner[i] == _owner) {
                tokens[index++] = i;
            }
        }
        return tokens;
    }

    /// @notice Update the transfer cooldown in seconds.
    function setTransferCooldown(uint256 _seconds) external onlyAdmin {
        transferCooldown = _seconds;
    }

    // Internal functions

    function _mint(address _to, uint256 _tokenId) internal {
        tokenOwner[_tokenId] = _to;
        balanceOf[_to]++;
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
