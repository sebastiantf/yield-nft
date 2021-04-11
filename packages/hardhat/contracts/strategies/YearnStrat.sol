// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "../interfaces/IYToken.sol";
import "../interfaces/IStrategy.sol";


contract YearnStrat is IStrategy {

  function invest(address yToken, address lendERC20Contract, uint256 lendPrincipalAmount) external override returns (uint256) {
    IERC20(lendERC20Contract).approve(yToken, uint(-1));

    uint256 yTokenBalanceBefore = IYToken(yToken).balanceOf(address(this));

    IYToken(yToken).deposit(lendPrincipalAmount);

    uint256 yTokenBalanceAfter = IYToken(yToken).balanceOf(address(this));

    return yTokenBalanceAfter-yTokenBalanceBefore;
  }

  function divest(address borrower, address lender,  address lendERC20Contract, address nftTokenContract, address yToken, uint256 nftTokenId, uint256 lendPrincipalAmount, uint256 yTokensReceived, uint closingTime) external override returns (uint256) {
    require(block.timestamp > closingTime, "Lend Duration not passed yet");

    uint256 ERC20BalanceBefore = IERC20(lendERC20Contract).balanceOf(address(this));

    IYToken(yToken).withdraw(yTokensReceived);


    require(IERC20(lendERC20Contract).balanceOf(address(this)) > ERC20BalanceBefore);

    uint256 yield = (IERC20(lendERC20Contract).balanceOf(address(this)) - ERC20BalanceBefore) - lendPrincipalAmount;

    if (yield > 0) {
      IERC20(lendERC20Contract).transfer(lender, (yield/2) + lendPrincipalAmount);
      IERC20(lendERC20Contract).transfer(borrower, yield/2);
    } else {
      IERC20(lendERC20Contract).transfer(lender, lendPrincipalAmount);
    }

    IERC721(nftTokenContract).transferFrom(address(this), borrower, nftTokenId);

    return yield;
  }

}
