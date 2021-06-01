// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@uniswap/v2-periphery/contracts/libraries/UniswapV2Library.sol";

import "./interfaces/IStrategy.sol";
import "./interfaces/INFT20Factory.sol";
import "./interfaces/INFT20Pair.sol";
import "./interfaces/IUniswapV2Factory.sol";
import "./interfaces/IUniswapV2Router02.sol";

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

  address private constant ETHAddress = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
  address private constant WETHAddress = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
  address private constant UniswapV2FactoryAddress = 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f;
  INFT20Factory private constant NFT20Factory =
    INFT20Factory(0x0f4676178b5c53Ae0a655f1B19A96387E4b8B5f2); // proxy for NFT20FactoryV4: 0x1813C4485a36642347c244a00617377BAFdBE401
  IUniswapV2Factory private constant UniswapV2Factory = IUniswapV2Factory(UniswapV2FactoryAddress);
  IUniswapV2Router02 private constant UniswapV2Router02 =
    IUniswapV2Router02(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);

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
    uint256 closingTime;
    uint256 yTokensReceived;
    bytes borrowerSignature;
    bytes lenderSignature;
    bool viaNFT20;
  }

  function isValidBorrowerSignature(
    address _nftTokenContract,
    uint256 _nftTokenId,
    address _borrower,
    address _strategy,
    address _yVault,
    bool _viaNFT20,
    bytes memory _signature
  ) public pure returns (bool) {
    bytes32 message = keccak256(
      abi.encodePacked(_nftTokenContract, _nftTokenId, _borrower, _strategy, _yVault, _viaNFT20)
    );
    bytes32 messageWithEthSignPrefix = message.toEthSignedMessageHash();
    address signer = messageWithEthSignPrefix.recover(_signature);
    return (signer == _borrower);
  }

  function isValidLenderSignature(
    uint256 _lendPrincipalAmount,
    address _lendERC20Contract,
    address _nftTokenContract,
    uint256 _nftTokenId,
    uint256 _closingTime,
    address _lender,
    bytes memory _signature
  ) public pure returns (bool) {
    bytes32 message = keccak256(
      abi.encodePacked(
        _lendPrincipalAmount,
        _lendERC20Contract,
        _nftTokenContract,
        _nftTokenId,
        _closingTime,
        _lender
      )
    );
    bytes32 messageWithEthSignPrefix = message.toEthSignedMessageHash();
    address signer = messageWithEthSignPrefix.recover(_signature);
    return (signer == _lender);
  }

  function beginInvestment(Investment memory _investment) public returns (uint256, uint256) {
    uint256 erc20Balance;
    require(
      isValidBorrowerSignature(
        _investment.nftTokenContract,
        _investment.nftTokenId,
        _investment.borrower,
        _investment.strategy,
        _investment.yToken,
        _investment.viaNFT20,
        _investment.borrowerSignature
      ),
      "Invalid Borrower Signature"
    );
    if (!_investment.viaNFT20)
      require(
        isValidLenderSignature(
          _investment.lendPrincipalAmount,
          _investment.lendERC20Contract,
          _investment.nftTokenContract,
          _investment.nftTokenId,
          _investment.closingTime,
          _investment.lender,
          _investment.lenderSignature
        ),
        "Invalid Lender Signature"
      );

    if (_investment.viaNFT20) {
      _depositToNFT20(
        _investment.borrower,
        _investment.nftTokenContract,
        _investment.nftTokenId,
        _investment.lendERC20Contract
      );
      erc20Balance = IERC20(_investment.lendERC20Contract).balanceOf(address(this));

      console.log("erc20Balance: ", erc20Balance);

      IERC20(_investment.lendERC20Contract).transfer(_investment.strategy, erc20Balance);
    } else {
      IERC721(_investment.nftTokenContract).transferFrom(
        msg.sender,
        _investment.strategy,
        _investment.nftTokenId
      );
      IERC20(_investment.lendERC20Contract).transferFrom(
        _investment.lender,
        _investment.strategy,
        _investment.lendPrincipalAmount
      );
    }
    _investment.investId = investId;
    _investment.yTokensReceived = _deposit(
      _investment.strategy,
      _investment.lendERC20Contract,
      _investment.yToken,
      _investment.viaNFT20 ? erc20Balance : _investment.lendPrincipalAmount
    );
    investIdToInvestment[investId] = _investment;
    investId = investId.add(1);
    return (_investment.investId, _investment.yTokensReceived);
  }

  function endInvestment(uint256 _investId) public returns (uint256, uint256) {
    Investment memory investment = investIdToInvestment[_investId];
    uint256 yield = _withdraw(investment);
    console.log("viaNFT20: ", investment.viaNFT20);

    // 1. uniswap swap erc20 to 100 NFT20Pair
    // 2. withdraw NFT from NFT20
    // 3. xfer remaining erc20 and nft to borrower

    if (investment.viaNFT20) {
      INFT20Pair NFT20Pair = INFT20Pair(NFT20Factory.nftToToken(investment.nftTokenContract));
      _swap(investment.lendERC20Contract, address(NFT20Pair), 100000000000000000000, true);
      console.log(
        "nft20pair balance after swap: ",
        IERC20(NFT20Factory.nftToToken(investment.nftTokenContract)).balanceOf(address(this))
      );
      uint256[] memory tokenIds = new uint256[](1);
      tokenIds[0] = investment.nftTokenId;
      uint256[] memory amounts = new uint256[](1);
      amounts[0] = 1;
      NFT20Pair.withdraw(tokenIds, amounts, investment.borrower);
      IERC20(investment.lendERC20Contract).transfer(
        investment.borrower,
        IERC20(investment.lendERC20Contract).balanceOf(address(this))
      );
    }
    return (investment.investId, yield);
  }

  function _deposit(
    address strategy,
    address lendERC20Contract,
    address yToken,
    uint256 lendPrincipalAmount
  ) internal returns (uint256) {
    return IStrategy(strategy).invest(yToken, lendERC20Contract, lendPrincipalAmount);
  }

  function _withdraw(Investment memory investment) internal returns (uint256) {
    console.log("strategy: ", investment.strategy);
    return
      IStrategy(investment.strategy).divest(
        investment.borrower,
        investment.lender,
        investment.lendERC20Contract,
        investment.nftTokenContract,
        investment.yToken,
        investment.nftTokenId,
        investment.lendPrincipalAmount,
        investment.yTokensReceived,
        investment.closingTime,
        investment.viaNFT20
      );
  }

  // 1. find pair address from factory
  // 2. NFT.safeTransferFrom borrower to NFT20 pair
  // 3. require balanceOf NFT20 pair token
  // 4. Uniswap swap to required token

  function _depositToNFT20(
    address _borrower,
    address _nftTokenContract,
    uint256 _nftTokenId,
    address _requiredERC20Token
  ) internal {
    INFT20Pair NFT20Pair = INFT20Pair(NFT20Factory.nftToToken(_nftTokenContract));
    IERC721(_nftTokenContract).safeTransferFrom(_borrower, address(NFT20Pair), _nftTokenId);
    require(NFT20Pair.balanceOf(address(this)) > 0);
    _swap(address(NFT20Pair), _requiredERC20Token, NFT20Pair.balanceOf(address(this)), false);
  }

  function _swap(
    address _fromToken,
    address _toToken,
    uint256 amount,
    bool _forExact
  ) internal returns (uint256 tokensSwapped) {
    if (_fromToken == _toToken) return amount;
    uint256[] memory amounts;
    uint256 erc20Balance = IERC20(_fromToken).balanceOf(address(this));
    IERC20(_fromToken).approve(address(UniswapV2Router02), 0);
    IERC20(_fromToken).approve(address(UniswapV2Router02), erc20Balance);
    console.log("_fromToken: ", _fromToken);
    console.log("_toToken: ", _toToken);
    console.log("amount: ", amount);
    console.log("_forExact: ", _forExact);
    console.log("erc20Balance: ", erc20Balance);
    address[] memory path = new address[](3);
    path[0] = _fromToken;
    path[1] = WETHAddress;
    path[2] = _toToken;
    uint256 deadline = 0xf000000000000000000000000000000000000000000000000000000000000000;
    amounts = UniswapV2Library.getAmountsIn(UniswapV2FactoryAddress, amount, path);
    console.log("amounts[0]: ", amounts[0]);
    console.log("amounts[1]: ", amounts[1]);
    console.log("amounts[2]: ", amounts[2]);
    require(erc20Balance > amounts[0], "Not enough balance to swap");
    if (_forExact) {
      tokensSwapped = UniswapV2Router02.swapTokensForExactTokens(
        amount,
        amounts[0],
        path,
        address(this),
        deadline
      )[path.length - 1];
    } else {
      tokensSwapped = UniswapV2Router02.swapExactTokensForTokens(
        amount,
        1,
        path,
        address(this),
        deadline
      )[path.length - 1];
    }
    require(tokensSwapped > 0, "Error Swapping Tokens 2");
  }
}
