// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "@openzeppelin/contracts/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IStrategy.sol";
import "hardhat/console.sol";

// 1. Borrower calls approve() on _nftTokenContract
// 2. Borrower signs off-chain message
// 3. Lender calls approve() on erc20
// 4. Lender signs off-chain message
// 5. Borrower calls beginLoan()

contract NFTProject {
  
  using ECDSA for bytes32;
  using SafeMath for uint256;

  uint256 public investId = 0;

  mapping(uint256 => Investment) public investIdToInvestment;

  struct Investment {
    uint256 investId;
    address nftTokenContract; 
    uint256 nftTokenId; 
    address borrower; 
    address lender; 
    address strategy; 
    address yToken;
    uint256 lendPrincipalAmount; 
    address lendERC20Contract; 
    uint256 lendDuration;
    uint closingTime;
    uint256 yTokensReceived;
  }

  // isValidBorrowerSignature(0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9, 0, 0x70997970C51812dc3A010C7d01b50e0d17dc79C8, 0x70997970C51812dc3A010C7d01b50e0d17dc79C8, 0x1d1dc9b90576bd8fe0074d56682213ad35519f95b343606ab5633bf26edb179f24900f35191e7e119b4753f2f15fca4d8c7a125675b6252804daed1953aac9f01b)
  function isValidBorrowerSignature(
    address _nftTokenContract, 
    uint256 _nftTokenId, 
    address _borrower, 
    address _strategy, 
    address _yVault, 
    bytes memory _signature
  ) public pure returns (bool) {
    bytes32 message = keccak256(abi.encodePacked(_nftTokenContract, _nftTokenId, _borrower, _strategy, _yVault));
    bytes32 messageWithEthSignPrefix = message.toEthSignedMessageHash();
    address signer = messageWithEthSignPrefix.recover(_signature);
    return (signer == _borrower);
  }

  // isValidLenderSignature(1000, 0xdac17f958d2ee523a2206206994597c13d831ec7, 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9, 0, 86400, 0x70997970C51812dc3A010C7d01b50e0d17dc79C8, 0x1d1dc9b90576bd8fe0074d56682213ad35519f95b343606ab5633bf26edb179f24900f35191e7e119b4753f2f15fca4d8c7a125675b6252804daed1953aac9f01b)
  function isValidLenderSignature(
    uint256 _lendPrincipalAmount, 
    address _lendERC20Contract, 
    address _nftTokenContract, 
    uint256 _nftTokenId, 
    uint256 _lendDuration, 
    address _lender, 
    bytes memory _signature
  ) public pure returns (bool) {
    bytes32 message = keccak256(abi.encodePacked(_lendPrincipalAmount, _lendERC20Contract, _nftTokenContract, _nftTokenId, _lendDuration, _lender));
    bytes32 messageWithEthSignPrefix = message.toEthSignedMessageHash();
    address signer = messageWithEthSignPrefix.recover(_signature);
    return (signer == _lender);
  }

  function beginInvestment(
    address _nftTokenContract, 
    uint256 _nftTokenId, 
    address _borrower, 
    address _lender, 
    address _strategy, 
    address _yToken, 
    uint256 _lendPrincipalAmount, 
    address _lendERC20Contract, 
    uint256 _lendDuration, 
    bytes memory _borrowerSignature,
    bytes memory _lenderSignature
  ) public returns (uint256, uint256) {

    require(isValidBorrowerSignature(_nftTokenContract, _nftTokenId, _borrower, _strategy, _yToken, _borrowerSignature), "Invalid Borrower Signature");
    require(isValidLenderSignature(_lendPrincipalAmount, _lendERC20Contract, _nftTokenContract, _nftTokenId, _lendDuration, _lender, _lenderSignature), "Invalid Lender Signature");

    IERC721(_nftTokenContract).transferFrom(msg.sender, _strategy, _nftTokenId);
    IERC20(_lendERC20Contract).transferFrom(_lender, _strategy, _lendPrincipalAmount);

    Investment memory investment = Investment({
      investId: investId,
      nftTokenContract: _nftTokenContract,
      nftTokenId: _nftTokenId,
      borrower: _borrower,
      lender: _lender,
      strategy: _strategy,
      yToken: _yToken,
      lendPrincipalAmount: _lendPrincipalAmount,
      lendERC20Contract: _lendERC20Contract,
      lendDuration: _lendDuration,
      closingTime: block.timestamp + _lendDuration,
      yTokensReceived: _deposit(_strategy, _lendERC20Contract, _yToken, _lendPrincipalAmount)
    });


    investIdToInvestment[investId] = investment;

    investId = investId.add(1);

    return (investment.investId, investment.yTokensReceived);
  }

  function endInvestment(uint256 _investId) public returns (uint256, uint256) {
    Investment memory investment = investIdToInvestment[_investId];
    uint256 yield = _withdraw(investment.borrower, investment.lender, investment.lendERC20Contract, investment.nftTokenContract, investment.strategy, investment.yToken, investment.nftTokenId, investment.lendPrincipalAmount, investment.yTokensReceived, investment.closingTime);
    return (investment.investId, yield);
  }

  function _deposit(address strategy, address lendERC20Contract, address yToken, uint256 lendPrincipalAmount) internal returns (uint256) {
    return IStrategy(strategy).invest(yToken, lendERC20Contract, lendPrincipalAmount);
  }

  function _withdraw(address borrower, address lender,  address lendERC20Contract, address nftTokenContract, address strategy, address yToken, uint256 nftTokenId, uint256 lendPrincipalAmount, uint256 yTokensReceived, uint closingTime) internal returns (uint256) {
    return IStrategy(strategy).divest(borrower, lender, lendERC20Contract, nftTokenContract, yToken, nftTokenId, lendPrincipalAmount, yTokensReceived, closingTime);
  }

}