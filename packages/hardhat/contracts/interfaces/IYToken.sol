//SPDX-License-Identifier: Unlicense
pragma solidity ^0.6.0;

interface IYToken {
  function balanceOf(address user) external view returns (uint256);

  function pricePerShare() external view returns (uint256);

  //function deposit(uint amount, address recipient) external returns (uint);  // not used
  function deposit(uint256 amount) external;

  function deposit() external;

  //function withdraw(uint shares, address recipient) external returns (uint); // not used
  function withdraw(uint256 shares) external;

  function withdraw() external;

  function token() external returns (address);

  function totalAssets() external view returns (uint256);

  function totalSupply() external view returns (uint256);

  function availableDepositLimit() external view returns (uint256);

  function decimals() external view returns (uint8);
}
