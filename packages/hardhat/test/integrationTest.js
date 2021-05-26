const hre = require("hardhat");
const { use, assert, expect } = require("chai");
const { solidity } = require("ethereum-waffle");
const contracts = require('./contracts');

use(solidity);

describe("Integration Test - Mainnet Fork", function () {
  let deployer, borrower, lender;
  let hashMasksContract, daiContract;
  let NFTProject, YearnStrat;
  
  let yearnStratYDaiBalance;

  let hashMaskTokenId = 5499;
  const binance = "0x28c6c06298d514db089934071355e5743bf21d60";
  const DAIToSnatch = 50000;

  let nftTokenContract = contracts.HASHMASKS_ADDRESS;
  let nftTokenId = hashMaskTokenId;
  // let yVault = contracts.yDAI_ADDRESS;
  // let yVaultABI = contracts.ERC20_ABI;
  // let yVault = contracts.yDAIVaultV2_ADDRESS;
  // let yVaultABI = contracts.ERC20_ABI;
  let yVault = contracts.yDAIVaultV3_ADDRESS;
  let yVaultABI = contracts.ERC20_ABI;
  let viaNFT20;
  let borrowerSignature;

  let lendPrincipalAmount = 5000;
  lendPrincipalAmount = (hre.ethers.utils.parseEther(lendPrincipalAmount.toString())).toString()
  let lendERC20Contract = contracts.DAI_ADDRESS;
  let lendDuration = 24;
  let closingTime = Math.floor(Date.now() / 1000) + lendDuration * 24 * 60 * 60;
  let lenderSignature;

  before("Get accounts", async function() {
    [ deployer, borrower, lender ] = await hre.ethers.getSigners();
    let prevBlock = await hre.ethers.provider.getBlockNumber();
    console.log("before:");
    console.log("prevBlock: ", prevBlock);
    let prevBlockTimestamp = (await hre.ethers.provider.getBlock(prevBlock)).timestamp;
    console.log("prevBlockTimestamp: ", prevBlockTimestamp);
  });
  
  before("Snatch HashMask 5499 to borrower account", async function() {
    this.timeout(50000);
    hashMasksContract = new hre.ethers.Contract(contracts.HASHMASKS_ADDRESS, contracts.HASHMASKS_ABI, deployer);
    let accountToImpersonate = await hashMasksContract.ownerOf(hashMaskTokenId);
    await hre.ethers.provider.send("hardhat_impersonateAccount",[accountToImpersonate])
    const impersonatedSigner = await hre.ethers.provider.getSigner(accountToImpersonate)
    hashMasksContract = new hre.ethers.Contract(contracts.HASHMASKS_ADDRESS, contracts.HASHMASKS_ABI, impersonatedSigner);
    await hashMasksContract.transferFrom(accountToImpersonate, borrower.address, hashMaskTokenId);
  });

  before("Snatch DAI to lender account", async function() {
    let accountToImpersonate = binance;
    await hre.ethers.provider.send("hardhat_impersonateAccount",[accountToImpersonate])
    const impersonatedSigner = await hre.ethers.provider.getSigner(accountToImpersonate)
    daiContract = new hre.ethers.Contract(contracts.DAI_ADDRESS, contracts.ERC20_ABI, impersonatedSigner);
    await daiContract.transfer(lender.address, hre.ethers.utils.parseEther(DAIToSnatch.toString()));
  });

  it("Borrower should have HashMasks", async function() {
    assert.equal(await hashMasksContract.ownerOf(hashMaskTokenId), borrower.address, "borrower doesn't have HashMasks");
  });

  it("Lender should have DAI", async function() {
    let lenderDaiBalance = parseInt(hre.ethers.utils.formatUnits(await daiContract.balanceOf(lender.address), await daiContract.decimals()));

    assert.isAtLeast(lenderDaiBalance, DAIToSnatch, "lender doesn't have at least 50000 DAI");
  });

  it("Should deploy NFTProject", async function() {
    const NFTProjectFactory = await hre.ethers.getContractFactory("NFTProject");

    NFTProject = await NFTProjectFactory.deploy();
    await NFTProject.deployed();
    console.log("NFTProject.address: ", NFTProject.address)
  });
  
  it("Should deploy YearnStrat", async function() {
    const YearnStratFactory = await hre.ethers.getContractFactory("YearnStrat");
    
    YearnStrat = await YearnStratFactory.deploy();
    await YearnStrat.deployed();
    console.log("YearnStrat.address: ", YearnStrat.address)
  });

  it("Borrower should approve NFTProject to transfer NFT", async function() {
    await hashMasksContract.connect(borrower).approve(NFTProject.address, nftTokenId)
  })

  it("Lender should approve NFTProject to transfer DAI", async function() {
    await daiContract.connect(lender).approve(NFTProject.address, hre.ethers.utils.parseEther(lendPrincipalAmount.toString()));
  })

  context("viaNFT20", function() {
    viaNFT20 = true;
    it("Should verify Borrower signature", async function() {
      var hash = hre.ethers.utils.solidityKeccak256(
        ["address", "uint256", "address", "address", "address", "bool"],
        [nftTokenContract, nftTokenId, borrower.address, YearnStrat.address, yVault, viaNFT20]
        );
      let bytesDataHash = hre.ethers.utils.arrayify(hash)
      borrowerSignature = await borrower.signMessage(bytesDataHash);

      assert.isTrue(await NFTProject.isValidBorrowerSignature(nftTokenContract, nftTokenId, borrower.address, YearnStrat.address, yVault, viaNFT20, borrowerSignature), "borrower signature cannot be verified");
    });
  })

  context("NOT viaNFT20", function() {
    viaNFT20 = false;
    it("Should verify Borrower signature", async function() {
      var hash = hre.ethers.utils.solidityKeccak256(
        ["address", "uint256", "address", "address", "address", "bool"],
        [nftTokenContract, nftTokenId, borrower.address, YearnStrat.address, yVault, viaNFT20]
        );
      let bytesDataHash = hre.ethers.utils.arrayify(hash)
      borrowerSignature = await borrower.signMessage(bytesDataHash);

      assert.isTrue(await NFTProject.isValidBorrowerSignature(nftTokenContract, nftTokenId, borrower.address, YearnStrat.address, yVault, viaNFT20, borrowerSignature), "borrower signature cannot be verified");
    });

    it("Should verify Lender signature", async function() {
      var hash = hre.ethers.utils.solidityKeccak256(
        ["uint256", "address", "address", "uint256", "uint256", "address"],
        [lendPrincipalAmount, lendERC20Contract, nftTokenContract, nftTokenId, closingTime, lender.address]
        );
      let bytesDataHash = hre.ethers.utils.arrayify(hash)
      lenderSignature = await lender.signMessage(bytesDataHash);
  
      assert.isTrue(await NFTProject.isValidLenderSignature(lendPrincipalAmount, lendERC20Contract, nftTokenContract, nftTokenId, closingTime, lender.address, lenderSignature), "lender signature cannot be verified");
    });

    it("beginInvestment() should begin investment", async function() {
      this.timeout(50000);
      const beginInvestmentStruct = {
        "investId": hre.ethers.BigNumber.from("0"),
        nftTokenContract,
        nftTokenId,
        "borrower": borrower.address,
        "lender": lender.address,
        "strategy": YearnStrat.address,
        "yToken": yVault,
        lendPrincipalAmount,
        lendERC20Contract,
        closingTime,
        "yTokensReceived": hre.ethers.BigNumber.from("0"),
        borrowerSignature,
        lenderSignature,
        viaNFT20
      };

      console.log("DEBUG");
      // const estimateGas = await NFTProject.estimateGas.beginInvestment(beginInvestmentStruct);
      // console.log("estimateGas: ", estimateGas);
      const tx = await NFTProject.connect(borrower).beginInvestment(beginInvestmentStruct);

      await tx.wait();

      assert.notEqual(await hashMasksContract.ownerOf(hashMaskTokenId), borrower.address, "borrower still owns the HashMasks");
      assert.equal(await hashMasksContract.ownerOf(hashMaskTokenId), YearnStrat.address, "HashMask not transferred to YearnStrat contract");

      lenderDaiBalance = parseInt(hre.ethers.utils.formatUnits(await daiContract.balanceOf(lender.address), await daiContract.decimals()).toString());
      lendPrincipalAmountInt = hre.ethers.utils.formatUnits(lendPrincipalAmount, await daiContract.decimals())
      assert.equal(lenderDaiBalance, DAIToSnatch - lendPrincipalAmountInt, "lender balance not equal to 45000");
      assert.isBelow(lenderDaiBalance, DAIToSnatch, "lender balance is not lowered from 50000");

      yDaiContract = new hre.ethers.Contract(yVault, yVaultABI, deployer);
      yearnStratYDaiBalance = parseInt(hre.ethers.utils.formatUnits(await yDaiContract.balanceOf(YearnStrat.address), await yDaiContract.decimals()));
      console.log("yearnStratYDaiBalance: ", yearnStratYDaiBalance);
      assert.isAbove(yearnStratYDaiBalance, 0, "YearnStrat contract still has 0 yDAI");
    });

    it("endInvestment() should revert if executed before closingTime", async function() {
      await expect(NFTProject.connect(borrower).endInvestment(0)).to.be.reverted;
    });
    
    it("should time travel", async function() {
      let prevBlock = await hre.ethers.provider.getBlockNumber();
      console.log("prevBlock: ", prevBlock);
      let prevBlockTimestamp = (await hre.ethers.provider.getBlock(prevBlock)).timestamp;
      console.log("prevBlockTimestamp: ", prevBlockTimestamp);
      
      await hre.network.provider.send("evm_setNextBlockTimestamp", [closingTime])
      console.log("evm_setNextBlockTimestamp")
      await hre.network.provider.send("evm_mine");
      console.log("evm_mine")

      let latestBlock = await hre.ethers.provider.getBlockNumber()
      console.log(latestBlock);
      let latestBlockTimestamp = (await hre.ethers.provider.getBlock(latestBlock)).timestamp;
      console.log(latestBlockTimestamp);
      console.log(latestBlockTimestamp-prevBlockTimestamp);
    });

    it("endInvestment() should end investment after closingTime", async function() {
      await NFTProject.connect(borrower).endInvestment(0);
      yearnStratYDaiBalance = parseInt(hre.ethers.utils.formatUnits(await yDaiContract.balanceOf(YearnStrat.address), await yDaiContract.decimals()));
      assert.equal(yearnStratYDaiBalance, 0, "YearnStrat contract still has yDAI tokens");
      lenderDaiBalance = parseInt(hre.ethers.utils.formatUnits(await daiContract.balanceOf(lender.address), await daiContract.decimals()).toString());
      borrowerDaiBalance = parseInt(hre.ethers.utils.formatUnits(await daiContract.balanceOf(borrower.address), await daiContract.decimals()).toString());
      assert.isAbove(lenderDaiBalance, DAIToSnatch, "lender balance is not increased from 50000");
      assert.isAbove(borrowerDaiBalance, 0, "borrower balance is not increased from 0");
      assert.notEqual(await hashMasksContract.ownerOf(hashMaskTokenId), YearnStrat.address, "YearnStrat still owns the HashMasks");
      assert.equal(await hashMasksContract.ownerOf(hashMaskTokenId), borrower.address, "HashMask not transferred to borrower");
    });
  })

});
