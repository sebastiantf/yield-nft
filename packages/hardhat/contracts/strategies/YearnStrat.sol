// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "../interfaces/IYToken.sol";
import "../interfaces/IStrategy.sol";

import "hardhat/console.sol";

contract YearnStrat is IStrategy {
  using SafeMath for uint256;

  function invest(
    address yToken,
    address lendERC20Contract,
    uint256 lendPrincipalAmount
  ) external override returns (uint256) {
    IERC20(lendERC20Contract).approve(yToken, uint256(-1));

    console.log("invest:");

    console.log("yToken: ", yToken);

    uint256 yTokenBalanceBefore = IYToken(yToken).balanceOf(address(this));

    console.log("ERC20BalanceBefore: ", IERC20(lendERC20Contract).balanceOf(address(this)));

    IYToken(yToken).deposit(lendPrincipalAmount);

    console.log("ERC20BalanceAfter: ", IERC20(lendERC20Contract).balanceOf(address(this)));

    uint256 yTokenBalanceAfter = IYToken(yToken).balanceOf(address(this));

    console.log("yTokensReceived: ", yTokenBalanceAfter - yTokenBalanceBefore);

    return yTokenBalanceAfter - yTokenBalanceBefore;
  }

  function divest(
    address borrower,
    address lender,
    address lendERC20Contract,
    address nftTokenContract,
    address yToken,
    uint256 nftTokenId,
    uint256 lendPrincipalAmount,
    uint256 yTokensReceived,
    uint256 closingTime,
    bool viaNFT20
  ) external override returns (uint256) {
    require(block.timestamp > closingTime, "Lend Duration not passed yet");

    console.log("divest:");

    console.log("yToken: ", yToken);

    uint256 ERC20BalanceBefore = IERC20(lendERC20Contract).balanceOf(address(this));

    console.log("ERC20BalanceBefore: ", ERC20BalanceBefore);

    console.log("yearnStratYDaiBalance: ", IYToken(yToken).balanceOf(address(this)));

    IYToken(yToken).withdraw(yTokensReceived);

    console.log("ERC20BalanceAfter: ", IERC20(lendERC20Contract).balanceOf(address(this)));

    require(IERC20(lendERC20Contract).balanceOf(address(this)) > ERC20BalanceBefore);

    console.log("lendPrincipalAmount: ", lendPrincipalAmount);

    uint256 yield = (IERC20(lendERC20Contract).balanceOf(address(this)) - ERC20BalanceBefore) -
      lendPrincipalAmount;

    console.log("yield: ", yield);

    require(yield > 0, "yield is zero");

    if (viaNFT20) {
      IERC20(lendERC20Contract).transfer(
        msg.sender,
        (IERC20(lendERC20Contract).balanceOf(address(this)) - ERC20BalanceBefore)
      );
    } else {
      if (yield > 0) {
        IERC20(lendERC20Contract).transfer(lender, (yield / 2) + lendPrincipalAmount);
        IERC20(lendERC20Contract).transfer(borrower, yield / 2);
      } else {
        IERC20(lendERC20Contract).transfer(lender, lendPrincipalAmount);
      }
      IERC721(nftTokenContract).transferFrom(address(this), borrower, nftTokenId);
    }
    return yield;
  }
}
