pragma solidity ^0.6.0;

interface INFT20Factory {
  function nft20Pair(
    string calldata name,
    string calldata _symbol,
    address _nftOrigin,
    uint256 _nftType
  ) external;

  function getPairByNftAddress(uint256 index)
    external
    view
    returns (
      address _nft20pair,
      address _originalNft,
      uint256 _type,
      string memory _name,
      string memory _symbol,
      uint256 _supply
    );

  // this is to sset value in case we decided to change tokens given to a tokenizing project.
  function setValue(
    address _pair,
    uint256 _nftType,
    string calldata _name,
    string calldata _symbol,
    uint256 _value
  ) external;

  function setFactorySettings(uint256 _fee, bool _allowFlashLoans) external;

  function recoverERC20(address tokenAddress, uint256 tokenAmount) external;

  function changeLogic(address _newLogic) external;

  function nftToToken(address _originalNft) external view returns (address);
}
