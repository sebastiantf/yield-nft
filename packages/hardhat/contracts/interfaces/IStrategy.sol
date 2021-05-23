//SPDX-License-Identifier: Unlicense
pragma solidity ^0.6.0;

interface IStrategy {
    function invest(
        address yToken,
        address lendERC20Contract,
        uint256 lendPrincipalAmount
    ) external returns (uint256);

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
    ) external returns (uint256);
}
