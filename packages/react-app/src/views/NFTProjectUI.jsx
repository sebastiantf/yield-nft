/* eslint-disable jsx-a11y/accessible-emoji */

import React, { useState, useEffect } from "react";
import { Button, List, Divider, Input, Tooltip, Card, DatePicker, Slider, Switch, Progress, Spin, Dropdown, Menu, Checkbox } from "antd";
import { DownOutlined } from '@ant-design/icons';
import { Address, Signatures } from "../components";
import { parseEther, formatEther, parseUnits, formatUnits } from "@ethersproject/units";
import { ethers, utils } from "ethers";
import { ChainId, Token, WETH, Fetcher } from '@uniswap/sdk'

import { ERC20_ABI,
        DAI_ADDRESS, 
        USDC_ADDRESS, 
        USDT_ADDRESS, 
        yDAI_ADDRESS, 
        yUSDC_ADDRESS,
        yUSDT_ADDRESS,
        HASHMASKS_ADDRESS, HASHMASKS_ABI
      } from "../constants"

import { useLocalStorage } from "../hooks";

export default function NFTProjectUI({purpose, setPurposeEvents, address, mainnetProvider, userProvider, localProvider, yourLocalBalance, price, tx, readContracts, writeContracts }) {
  const signer = userProvider.getSigner();

  console.log('readContracts', readContracts);
  // const nftProjectContractAddress = readContracts['NFTProject'].address

  const [signatures, setSignatures] = useLocalStorage('signatures', []);
  const isSignatures = signatures.length !== 0;

  const [accounts, setAccounts] = useState({});

  const _setupBorrowerLender = async () => {
    const signerAddress = await signer.getAddress();
    setBorrower(signerAddress);
    setLender(signerAddress);  
  };
  const _setupAccounts = async () => {
    const accounts = await localProvider.listAccounts();
    setAccounts({
      deployer: accounts[0],
      borrower: accounts[1],
      lender: accounts[2]
    });
  }
  
  useEffect(() => {
    _setupAccounts();
  }, []);

  useEffect(() => {
    _setupBorrowerLender();
  });

  async function refreshStates() {
    await refreshLatestBlock();
    await refreshLatestBlockTimestamp();
    await refreshDAIBalance();
    await refreshDAIApproval();
    await refreshHashMaskOwner();
    await refreshHashMaskApproval();
    await refreshYTokenBalance();
  }

  useEffect(() => {
      if(readContracts) refreshStates();
  }, [readContracts]);

  // Borrow
  const [nftTokenContract_Borrow, setNftTokenContractBorrow] = useState("loading...");
  const [nftTokenId_Borrow, setNftTokenIdBorrow] = useState("loading...");
  const [borrower, setBorrower] = useState("loading...");
  const [strategy, setStrategy] = useState("loading...");
  const [yVault, setYVault] = useState("loading...");
  
  const signBorrowerMessage = async () => {
    var hash = ethers.utils.solidityKeccak256(
      ["address", "uint256", "address", "address", "address", "bool"],
      [nftTokenContract_Borrow, nftTokenId_Borrow, borrower, strategy, yVault, viaNFT20]
      );
      let bytesDataHash = ethers.utils.arrayify(hash)
      const signature = await signer.signMessage(bytesDataHash);
      setSignatures([ ...signatures, {
        type: 'borrow',
        nftTokenContract_Borrow,
        nftTokenId_Borrow,
        borrower,
        strategy,
        yVault,
        viaNFT20,
        signature
      }]);
    }

  const verifyBorrowerSignature = async (nftTokenContract, nftTokenId, borrower, strategy, yVault, viaNFT20, signature) => {
    let result = await readContracts['NFTProject'].isValidBorrowerSignature(nftTokenContract, nftTokenId, borrower, strategy, yVault, viaNFT20, signature);
    alert(result);
    return result
  }
    
    // Lend
    const [lendPrincipalAmount, setLendPrincipalAmount] = useState("loading...");
    const [lendERC20Contract, setLendERC20Contract] = useState("loading...");
    const [nftTokenContract_Lend, setNftTokenContractLend] = useState("loading...");
    const [nftTokenId_Lend, setNftTokenIdLend] = useState("loading...");
    const [lendDuration, setLendDuration] = useState("loading...");
    const [closingTime, setClosingTime] = useState("loading...");
    const [lender, setLender] = useState("loading...");
    
    const signLenderMessage = async () => {
      var hash = ethers.utils.solidityKeccak256(
        ["uint256", "address", "address", "uint256", "uint256", "address"],
        [lendPrincipalAmount, lendERC20Contract, nftTokenContract_Lend, nftTokenId_Lend, closingTime, lender]
        );
        let bytesDataHash = ethers.utils.arrayify(hash)
        const signature = await signer.signMessage(bytesDataHash);
        setSignatures([ ...signatures, {
          type: 'lend',
          lendPrincipalAmount,
          lendERC20Contract,
          nftTokenContract_Lend,
          nftTokenId_Lend,
          closingTime,
          lender,
          signature
        }]);
      }
    
    const verifyLenderSignature = async (lendPrincipalAmount, lendERC20Contract, nftTokenContract, nftTokenId, closingTime, lender, signature) => {
      let result = await readContracts['NFTProject'].isValidLenderSignature(lendPrincipalAmount, lendERC20Contract, nftTokenContract, nftTokenId, closingTime, lender, signature) 
      alert(result);
      return result;
    }

    // State display
    const [daiBalance, setDaiBalance] = useState(0);
    const [yTokenBalance, setYTokenBalance] = useState(0);
    const [hashMaskTokenId, setHashMaskTokenId] = useState(5499);
    const [hashMaskOwner, setHashMaskOwner] = useState('');
  
    const [hashMaskApproval, setHashMaskApproval] = useState('')
    const [DAIApproval, setDAIApproval] = useState(0)
    
    const refreshDAIBalance = async ()=>{
      setDaiBalance('...')
      const signer = await userProvider.getSigner()
      const myDaiContract = new ethers.Contract(DAI_ADDRESS, ERC20_ABI, signer);
      
      const signerDaiBal = await myDaiContract.balanceOf(await signer.getAddress())
      console.log("BALANCE:",formatEther(signerDaiBal))
      setDaiBalance(formatEther(signerDaiBal))

      console.log("daiBalance: ", daiBalance);
      console.log("amountToSnatch: ", amountToSnatch);
      if (daiBalance > amountToSnatch) {
        const yieldGen = parseFloat(((daiBalance - amountToSnatch) * 2))
        setTotalYieldGen(yieldGen)
        setApy((((((yieldGen/(lendDuration/24/60/60)) * 365) / (parseFloat(lendPrincipalAmount)/(10**18)))*100)).toFixed(2))
        console.log("yVault apy: ", apy);
      }
    }
    
    const refreshYTokenBalance = async ()=>{
      setYTokenBalance('...')
      const signer = await userProvider.getSigner()
      const myYTokenContract = new ethers.Contract(yDAI_ADDRESS, ERC20_ABI, signer);
      
      const signerDaiBal = await myYTokenContract.balanceOf(readContracts['YearnStrat'].address)
      console.log("yToken BALANCE:",formatEther(signerDaiBal))
      setYTokenBalance(formatEther(signerDaiBal))
    }
    
    const refreshDAIApproval = async ()=>{
      setDAIApproval('...')
      const signer = await userProvider.getSigner()
      const myDaiContract = new ethers.Contract(DAI_ADDRESS, ERC20_ABI, signer);
      
      const DAIApproval = await myDaiContract.allowance(await signer.getAddress(), readContracts['NFTProject'].address)
      setDAIApproval(formatEther(DAIApproval))
    }
    
    const refreshHashMaskOwner = async ()=>{
      setHashMaskOwner('...')
      const hashMasksContract = new ethers.Contract(HASHMASKS_ADDRESS, HASHMASKS_ABI, signer);
      let accountToImpersonate = await hashMasksContract.ownerOf(hashMaskTokenId);
      console.log(accountToImpersonate);
      setHashMaskOwner(accountToImpersonate);
    }
    
    const refreshHashMaskApproval = async ()=>{
      setHashMaskApproval('...')
      const signer = await userProvider.getSigner()
      const hashMasksContract = new ethers.Contract(HASHMASKS_ADDRESS, HASHMASKS_ABI, signer);
      
      const hashMaskApproval = await hashMasksContract.getApproved(hashMaskTokenId)
      setHashMaskApproval(hashMaskApproval)
    }
    
    const approveDAI = async () => {
      const localProviderSigner = await localProvider.getSigner(accounts.lender)
      const daiContract = new ethers.Contract(DAI_ADDRESS, ERC20_ABI, localProviderSigner);
      await tx(daiContract.approve(readContracts['NFTProject'].address, ethers.constants.MaxUint256));
    }
    
    const approveHashMasks = async () => {
      const localProviderSigner = await localProvider.getSigner(accounts.borrower)
      const hashMasksContract = new ethers.Contract(HASHMASKS_ADDRESS, HASHMASKS_ABI, localProviderSigner);
      await tx(hashMasksContract.approve(readContracts['NFTProject'].address, hashMaskTokenId));
    }

    const [amountToSnatch, setAmountToSnatch] = useState(50000)
    
    const getImpersonatingSignerDai = async (to) => {
      let accountToImpersonate = "0x28c6c06298d514db089934071355e5743bf21d60" // Binance
      await localProvider.send("hardhat_impersonateAccount",[accountToImpersonate])
      const signer = await localProvider.getSigner(accountToImpersonate)
      const myDaiContract = new ethers.Contract(DAI_ADDRESS, ERC20_ABI, signer);
      const myAddress = await signer.getAddress()
      const signerDaiBal = await myDaiContract.balanceOf(myAddress)
      let transferbal = parseFloat(amountToSnatch)
      const userProviderSigner = userProvider.getSigner();
      const recipientAddress = to ? to : await userProviderSigner.getAddress();
      let txmisc = await tx(myDaiContract.transfer(
        recipientAddress,
        parseEther(transferbal.toString())
        ));
      }
      
    const getImpersonatingSignerHashMasks = async (to) => {
      let accountToImpersonate = hashMaskOwner
      await localProvider.send("hardhat_impersonateAccount",[accountToImpersonate])
      const signer = await localProvider.getSigner(accountToImpersonate)
      const hashMasksContract = new ethers.Contract(HASHMASKS_ADDRESS, HASHMASKS_ABI, signer);
      const signerAddress = await signer.getAddress();
      const userProviderSigner = userProvider.getSigner();
      const recipientAddress = to ? to : await userProviderSigner.getAddress();
      let txmisc = await tx(hashMasksContract.transferFrom(signerAddress, recipientAddress, hashMaskTokenId));
    }

    // BorrowMenu

    const nftTokenContracts = {
      "hashmasks": {
        address: HASHMASKS_ADDRESS,
        text: "HashMasks"
      },
      "null": {
        address: '0x0000000000000000000000000000000000000000',
        text: "Null"
      }
    }

    const [viaNFT20, setViaNFT20] = useState(false);

    const [nftTokenContract_BorrowMenuText, setNftTokenContractBorrowMenuText] = useState(nftTokenContracts['null'].text);
    const [nftTokenContract_BorrowMenuState, setNftTokenContract_BorrowMenuState] = useState({ visible: false });
    
    const handleNftTokenContract_BorrowMenuVisibleChange = flag => {
      setNftTokenContract_BorrowMenuState({ visible: flag });
    };
    
    const handleNftTokenContract_BorrowMenuClick = e => {
      setNftTokenContractBorrow(nftTokenContracts[e.key].address)
      setNftTokenContractBorrowMenuText(nftTokenContracts[e.key].text)
      setNftTokenContract_BorrowMenuState({ visible: false });
    };
    
    const nftTokenContract_BorrowMenuList = (
      <Menu onClick={(e)=>{handleNftTokenContract_BorrowMenuClick(e)}}>
        <Menu.Item key="hashmasks">{nftTokenContracts['hashmasks'].text}</Menu.Item>
        <Menu.Item key="null">{nftTokenContracts['null'].text}</Menu.Item>
      </Menu>
    );

    const strategyContracts = {
      "yearnstrat": {
        address: readContracts?readContracts['YearnStrat'].address:'0x00000000000000',
        text: "YearnStrat"
      },
      // "zapperstrat": {
      //   address: readContracts?readContracts['ZapperStrat'].address:'0x00000000000000',
      //   text: "ZapperStrat"
      // },
      "null": {
        address: '0x0000000000000000000000000000000000000000',
        text: "Null"
      }
    }
    
    const [strategyMenuText, setStrategyMenuText] = useState(strategyContracts['null'].text);
    const [strategyMenuState, setStrategyMenuState] = useState({ visible: false });
    
    const handleStrategyMenuVisibleChange = flag => {
      setStrategyMenuState({ visible: flag });
    };

    const handleStrategyMenuClick = e => {
      setStrategy(strategyContracts[e.key].address);
      setStrategyMenuText(strategyContracts[e.key].text);
      setStrategyMenuState({ visible: false });
    };
    
    const strategyMenuList = (
      <Menu onClick={(e)=>{handleStrategyMenuClick(e)}}>
        <Menu.Item key="yearnstrat">{strategyContracts['yearnstrat'].text}</Menu.Item>
        {/* <Menu.Item key="zapperstrat">{strategyContracts['zapperstrat'].text}</Menu.Item> */}
        <Menu.Item key="null">{strategyContracts['null'].text}</Menu.Item>
      </Menu>
    );

    const yVaultContracts = {
      "ydai": {
        address: yDAI_ADDRESS,
        text: "yDAI Vault"
      },
      "yusdc": {
        address: yUSDC_ADDRESS,
        text: "yUSDC Vault"
      },
      "yusdt": {
        address: yUSDT_ADDRESS,
        text: "yUSDT Vault"
      },
      "null": {
        address: '0x0000000000000000000000000000000000000000',
        text: "Null"
      }
    }
    
    const [yVaultMenuText, setYVaultMenuText] = useState(yVaultContracts['null'].text);
    const [yVaultMenuState, setYVaultMenuState] = useState({ visible: false });
    
    const handleYVaultMenuVisibleChange = flag => {
      setYVaultMenuState({ visible: flag });
    };

    const handleYVaultMenuClick = e => {
      setYVault(yVaultContracts[e.key].address);
      setYVaultMenuText(yVaultContracts[e.key].text);
      setYVaultMenuState({ visible: false });
    };
    
    // const yVaultMenuList = strategy !== strategyContracts['zapperstrat'].address ? (
    //   <Menu onClick={(e)=>{handleYVaultMenuClick(e)}}>
    //     <Menu.Item key="ydai">{yVaultContracts['ydai'].text}</Menu.Item>
    //     <Menu.Item key="null">{yVaultContracts['null'].text}</Menu.Item>
    //   </Menu>
    // ) : (
    const yVaultMenuList = <Menu onClick={(e)=>{handleYVaultMenuClick(e)}}>
        <Menu.Item key="ydai">{yVaultContracts['ydai'].text}</Menu.Item>
        {/* <Menu.Item key="yusdc">{yVaultContracts['yusdc'].text}</Menu.Item>
        <Menu.Item key="yusdt">{yVaultContracts['yusdt'].text}</Menu.Item> */}
        <Menu.Item key="null">{yVaultContracts['null'].text}</Menu.Item>
      </Menu>
    // )
    ;

    const lendERC20Contracts = {
      "dai": {
        address: DAI_ADDRESS,
        text: "DAI"
      },
      "usdc": {
        address: USDC_ADDRESS,
        text: "USDC"
      },
      "usdt": {
        address: USDT_ADDRESS,
        text: "USDT"
      },
      "null": {
        address: '0x0000000000000000000000000000000000000000',
        text: "Null"
      }
    }
    
    const [lendERC20ContractMenuText, setLendERC20ContractMenuText] = useState(lendERC20Contracts['null'].text);
    const [lendERC20ContractMenuState, setLendERC20ContractMenuState] = useState({ visible: false });
    
    const handleLendERC20ContractMenuVisibleChange = flag => {
      setLendERC20ContractMenuState({ visible: flag });
    };

    const handleLendERC20ContractMenuClick = e => {
      setLendERC20Contract(lendERC20Contracts[e.key].address);
      setLendERC20ContractMenuText(lendERC20Contracts[e.key].text);
      setLendERC20ContractMenuState({ visible: false });
    };
    
    // const lendERC20ContractMenuList = strategy !== strategyContracts['zapperstrat'].address ? (
    //   <Menu onClick={(e)=>{handleLendERC20ContractMenuClick(e)}}>
    //     <Menu.Item key="dai">{lendERC20Contracts['dai'].text}</Menu.Item>
    //     <Menu.Item key="null">{lendERC20Contracts['null'].text}</Menu.Item>
    //   </Menu>
    // ) : (
    const lendERC20ContractMenuList = <Menu onClick={(e)=>{handleLendERC20ContractMenuClick(e)}}>
        <Menu.Item key="dai">{lendERC20Contracts['dai'].text}</Menu.Item>
        {/* <Menu.Item key="usdc">{lendERC20Contracts['usdc'].text}</Menu.Item>
        <Menu.Item key="usdt">{lendERC20Contracts['usdt'].text}</Menu.Item> */}
        <Menu.Item key="null">{lendERC20Contracts['null'].text}</Menu.Item>
      </Menu>
    // );


    const [nftTokenContract_LendMenuText, setNftTokenContractLendMenuText] = useState(nftTokenContracts['null'].text);
    const [nftTokenContract_LendMenuState, setNftTokenContract_LendMenuState] = useState({ visible: false });
    
    const handleNftTokenContract_LendMenuVisibleChange = flag => {
      setNftTokenContract_LendMenuState({ visible: flag });
    };
    
    const handleNftTokenContract_LendMenuClick = e => {
      setNftTokenContractLend(nftTokenContracts[e.key].address)
      setNftTokenContractLendMenuText(nftTokenContracts[e.key].text)
      setNftTokenContract_LendMenuState({ visible: false });
    };
    
    const nftTokenContract_LendMenuList = (
      <Menu onClick={(e)=>{handleNftTokenContract_LendMenuClick(e)}}>
        <Menu.Item key="hashmasks">{nftTokenContracts['hashmasks'].text}</Menu.Item>
        <Menu.Item key="null">{nftTokenContracts['null'].text}</Menu.Item>
      </Menu>
    );

    const beginInvestment = async (nftTokenContract, nftTokenId, borrower, lender, strategy, yToken, lendPrincipalAmount, lendERC20Contract, closingTime, borrowerSignature, lenderSignature, viaNFT20) => {
      console.log(`beginInvestment(${nftTokenContract}, ${nftTokenId}, ${borrower}, ${lender}, ${strategy}, ${yToken}, ${lendPrincipalAmount}, ${lendERC20Contract}, ${closingTime}, ${borrowerSignature}, ${lenderSignature}, ${viaNFT20})`);

      let result;

      const beginInvestmentStruct = {
        "investId": ethers.BigNumber.from("0"),
        nftTokenContract,
        nftTokenId,
        borrower,
        lender,
        strategy,
        yToken,
        lendPrincipalAmount,
        lendERC20Contract,
        closingTime,
        "yTokensReceived": ethers.BigNumber.from("0"),
        borrowerSignature,
        lenderSignature,
        viaNFT20,
      }

      result = await tx(readContracts['NFTProject'].connect(signer)
          .beginInvestment(beginInvestmentStruct));

      /* if (strategy === readContracts['ZapperStrat'].address) {
        

      // {
      //   -- "to": "0xb832cc0e8ed40ae42eddc63d9d07ebaf022994e8",
      //   "from": "0x2a4d...",
      //   -- "data": "0xbb0abba7000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005b99b82a033ddb700000000000000000000000019d3364a399d251e894ac732651be8b0e4e85001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002737641f7304d7d4e9000000000000000000000000def1c0ded9bec7f1a1670819833240f027b25eff000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000128d9627aa4000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000005b99b82a033ddb7000000000000000000000000000000000000000000000027eb0781bcc6ad968d00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f869584cd000000000000000000000000f4e386b070a18419b5d3af56699f8a438dd18e890000000000000000000000000000000000000000000000bd5d54886f60470580000000000000000000000000000000000000000000000000",
      //   "value": "0x5b99b82a033ddb7",
      //   lendERC20Contract -- "sellTokenAddress": "0x0000000000000000000000000000000000000000",
      //   "sellTokenAmount": "412531826216918455",
      //   yToken -- "buyTokenAddress": "0x19d3364a399d251e894ac732651be8b0e4e85001",
      //   "gasPrice": "153800000000",
      //   "gas": "316245"
      // }

     

        const api_key = '96e0cc51-a62e-42ca-acee-910ea7d2a241';
        const calldata = await axios.get(`https://api.zapper.fi/v1/zap-in/yearn/transaction?
          api_key=${api_key}&
          slippagePercentage=0.03&
          gasPrice=100000000000&
          poolAddress=${yToken}&
          sellTokenAddress=${lendERC20Contract}&
          sellAmount=${lendPrincipalAmount}"&
          ownerAddress=${readContracts['ZapperStrat'].address}`)

        const zapContract = calldata.to;
        const zapData = calldata.data;
        
        result = await tx(readContracts['NFTProject'].connect(signer)
          .beginInvestment(
            nftTokenContract,
            nftTokenId,
            borrower,
            lender,
            strategy,
            yToken,
            lendPrincipalAmount,
            lendERC20Contract,
            lendDuration,
            borrowerSignature,
            lenderSignature,
            zapContract,
            zapData
            ))
      } else {
        result = await tx(readContracts['NFTProject'].connect(signer)
          .beginInvestment(
            nftTokenContract,
            nftTokenId,
            borrower,
            lender,
            strategy,
            yToken,
            lendPrincipalAmount,
            lendERC20Contract,
            lendDuration,
            borrowerSignature,
            lenderSignature))
      } */

      alert('beginInvestment() DONE')
      console.log(result);
      return result;
    }

    // const getUniswapPairData = async () => {
    //   const ERC20 = new Token(ChainId.MAINNET, lendERC20Contract, 18)
    //   const NFT20FactoryABI = [
    //     'function nftToToken(address _originalNft) external view returns (address)'
    //   ];
    //   const NFT20Factory = new ethers.Contract('0x0f4676178b5c53Ae0a655f1B19A96387E4b8B5f2', NFT20FactoryABI, signer);
    //   const NFT20PairTokenAddress = await NFT20Factory.nftToToken(nftTokenContract_Borrow);
    //   const NFT20PairToken = new Token(ChainId.MAINNET, NFT20PairTokenAddress, 18)

    //   const pair = await Fetcher.fetchPairData(ERC20, NFT20PairToken, localProvider)

    //   console.log("uniswapPairData: ", pair)
    // }
    
    const [endInvestId, setEndInvestId] = useState(0);
    const [apy, setApy] = useState(0)
    const [totalYieldGen, setTotalYieldGen] = useState(0)
    
    const endInvestment = async () => {
      console.log(`endInvestment(${endInvestId}`);
      let result = await tx(readContracts['NFTProject'].connect(signer).endInvestment(endInvestId))
      alert('endInvestment() DONE')
      console.log(result);
      return result;
    }

    const getInvestment = async ()=>{
      const NFTProjectContract = readContracts['NFTProject']
      
      const investment = await NFTProjectContract.investIdToInvestment(endInvestId)
      alert('investIdToInvestment() DONE')
      console.log("investment: ", investment);
    }

    function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    const [latestBlock, setLatestBlock] = useState(0)
    const [prevBlockTimestamp, setPrevBlockTimestamp] = useState(0)
    const [latestBlockTimestamp, setLatestBlockTimestamp] = useState(0)

    const refreshLatestBlock = async () => {
      setLatestBlock(await localProvider.getBlockNumber());
    }

    const refreshLatestBlockTimestamp = async () => {
      setPrevBlockTimestamp(latestBlockTimestamp);
      setLatestBlockTimestamp((await localProvider.getBlock(latestBlock)).timestamp);
    }

    const [timeTravelSeconds, setTimeTravelSeconds] = useState(0);

    const timeTravel = async () => {
      console.log(typeof timeTravelSeconds);
      await localProvider.send("evm_setNextBlockTimestamp", [parseInt(timeTravelSeconds)])
      alert('evm_setNextBlockTimestamp() DONE')
      await localProvider.send("evm_mine")
      alert('evm_mine() DONE')
    }
    
    const [ahv2CreditLimit, setAhv2CreditLimit] = useState(0);

    const refreshAhv2CreditLimit = async () => {
      setAhv2CreditLimit('...')
      const signer = await userProvider.getSigner()

      const homoraBankAddress = '0x5f5Cd91070960D13ee549C9CC47e7a4Cd00457bb'; // proxy contract

      const creamComptrollerAddress = "0xAB1c342C7bf5Ec5F02ADEA1c2270670bCa144CbB"; // unitroller proxy
      const creamComptrollerABI = [
        "function _setCreditLimit(address protocol, uint creditLimit)",
        "function creditLimits(address) view returns (uint)",
        "event CreditLimitChanged(address protocol, uint creditLimit)"
      ]
      const creamComptrollerContract = new ethers.Contract(creamComptrollerAddress, creamComptrollerABI, signer);
      
      const creditLimit = await creamComptrollerContract.creditLimits(homoraBankAddress)
      setAhv2CreditLimit(formatEther(creditLimit))
    }

    const increaseCreditLimit = async () => {
      const creamComptrollerAdmin = '0x6D5a7597896A703Fe8c85775B23395a48f971305' // Cream:Multisig is the admin of unitroller
      let accountToImpersonate = creamComptrollerAdmin
      await localProvider.send("hardhat_impersonateAccount",[accountToImpersonate])
      const signer = await localProvider.getSigner(accountToImpersonate)

      const homoraBankAddress = '0x5f5Cd91070960D13ee549C9CC47e7a4Cd00457bb'; // proxy contract

      const creamComptrollerAddress = "0xAB1c342C7bf5Ec5F02ADEA1c2270670bCa144CbB"; // unitroller proxy
      const creamComptrollerABI = [
        "function _setCreditLimit(address protocol, uint creditLimit)",
        "function creditLimits(address) view returns (uint)",
        "event CreditLimitChanged(address protocol, uint creditLimit)"
      ]
      const creamComptrollerContract = new ethers.Contract(creamComptrollerAddress, creamComptrollerABI, signer);

      tx(creamComptrollerContract.connect(signer)._setCreditLimit(homoraBankAddress, ethers.constants.MaxUint256));
    }


    const [amountUSDTToSnatch, setAmountUSDTToSnatch] = useState(200000)
    
    const getImpersonatingSignerUSDT = async () => {
      let accountToImpersonate = "0xf977814e90da44bfa03b6295a0616a897441acec" // Binance
      await localProvider.send("hardhat_impersonateAccount",[accountToImpersonate])
      const signer = await localProvider.getSigner(accountToImpersonate)
      const myUSDTContract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, signer);
      const myAddress = await signer.getAddress()
      const signerUSDTBal = await myUSDTContract.balanceOf(myAddress)
      let transferbal = parseFloat(amountUSDTToSnatch)
      const userProviderSigner = userProvider.getSigner();
      const userProviderSignerAddress = await userProviderSigner.getAddress();
      let txmisc = tx(myUSDTContract.transfer(
        userProviderSignerAddress,
        parseUnits(transferbal.toString(), 'mwei')
        ));
      }

    const [usdtBalance, setUsdtBalance] = useState(0);
          
    const refreshUSDTBalance = async ()=>{
      setUsdtBalance('...')
      const signer = await userProvider.getSigner()
      const myUSDTContract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, signer);
      
      const signerUSDTBal = await myUSDTContract.balanceOf(await signer.getAddress())
      console.log("BALANCE:",formatEther(signerUSDTBal))
      setUsdtBalance(formatUnits(signerUSDTBal, 'mwei'))

      console.log("usdtBalance: ", usdtBalance);
      console.log("amountToSnatch: ", amountToSnatch);
    }

    const approveUSDT = async () => {
      const usdtContract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, signer);
      const HomoraBankProxyAddress = '0x5f5Cd91070960D13ee549C9CC47e7a4Cd00457bb';
      tx(usdtContract.approve(HomoraBankProxyAddress, ethers.constants.MaxUint256));
    }

    const [USDTApproval, setUSDTApproval] = useState(0)

    const refreshUSDTApproval = async ()=>{
      setUSDTApproval('...')
      const signer = await userProvider.getSigner()
      const myUSDTContract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, signer);
      const HomoraBankProxyAddress = '0x5f5Cd91070960D13ee549C9CC47e7a4Cd00457bb';
      const USDTApproval = await myUSDTContract.allowance(await signer.getAddress(), HomoraBankProxyAddress)
      setUSDTApproval(formatUnits(USDTApproval, 'mwei'))
    }
    
    const executeHomoraBank = async () => {
      const localProviderSigner = await localProvider.getSigner(borrower)
      const HomoraBankProxyAddress = '0x5f5Cd91070960D13ee549C9CC47e7a4Cd00457bb'; // proxy contract

      const HomoraBankProxyABI = [
        "function caster() view returns (address)",
        "function allowContractStatus() pure returns (bool)",
        "function allBanks(uint) view returns (address)",
        "event Liquidate(uint positionId, address liquidator, address debtToken, uint amount, uint share, uint bounty)",
        "event AddBank(address token, address cToken)",
        "event Borrow(uint positionId, address caller, address token, uint amount, uint share)",
        "function execute(uint,address,bytes) external payable lock onlyEOAEx returns (uint)"
      ]

      const homoraBankContract = new ethers.Contract(HomoraBankProxyAddress, HomoraBankProxyABI, localProviderSigner);

      // txn: 0x94bee4870d2a5172fd5191a5091e66bcaff4f318325db63d7a59b668075a89b8
      // 0	_value	uint256	0
      // 1	_to	address	0x42C750024E02816eE32EB2eB4DA79ff5BF343D30
      // 2	_data	bytes	0xbe0ca4650000000000000000000000006c3f90f043a72fa612cbac8115ee7e52bde6e49000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000174876e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000305fb2ce0a09749b2c5d0000000000000000000000000000000000000000000000000000002d66894af800000000000000000000000000000000000000000000000000000018d4fc339f000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000825a13fc9a14b84f233300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000


      const result = await tx(homoraBankContract
                      .execute(
                        '0',
                        '0x42C750024E02816eE32EB2eB4DA79ff5BF343D30',
                        '0xbe0ca4650000000000000000000000006c3f90f043a72fa612cbac8115ee7e52bde6e49000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000174876e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000305fb2ce0a09749b2c5d0000000000000000000000000000000000000000000000000000002d66894af800000000000000000000000000000000000000000000000000000018d4fc339f000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000825a13fc9a14b84f233300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
                      ));
    }

    const resetNFT20Fee = async () => {
      const NFT20FactoryAdmin = '0x4b5922abf25858d012d12bb1184e5d3d0b6d6be4' // NFT20 Factory owner
      let accountToImpersonate = NFT20FactoryAdmin
      await localProvider.send("hardhat_impersonateAccount",[accountToImpersonate])
      const signer = await localProvider.getSigner(accountToImpersonate)

      const NFT20FactoryAddress = "0x0f4676178b5c53Ae0a655f1B19A96387E4b8B5f2"; // unitroller proxy
      const NFT20FactoryABI = [
        "function setFactorySettings(uint256 _fee, bool _allowFlashLoans) external"
      ]
      const NFT20FactoryContract = new ethers.Contract(NFT20FactoryAddress, NFT20FactoryABI, signer);

      tx(NFT20FactoryContract.connect(signer).setFactorySettings(0, true));
    }

    const initialSetup = async () => {
      await getImpersonatingSignerHashMasks(accounts.borrower);
      await getImpersonatingSignerDai(accounts.lender);
      await approveHashMasks();
      await approveDAI();
    }
    

  return (
    <div>
      {/*
        ⚙️ Here is an example UI that displays and sets the purpose in your smart contract:
      */}

      <div style={{border:"1px solid #cccccc", padding:16, width:"70%", margin:"auto",marginTop:64, marginBottom:24}}>

        {/* <div>
          <h2>Re-enable Alpha Homora V2:</h2>
          <h3>AHv2 Credit Limit: {ahv2CreditLimit}</h3><br />
          <Button onClick={() => {refreshAhv2CreditLimit()}}>Refresh AHv2 Credit Limit</Button>
          <Button onClick={()=>{increaseCreditLimit()}}>Increase AHv2 Credit Limit</Button><br /><br />
          <h3>{usdtBalance} USDT</h3>
          <h3>USDT Approval for HomoraBankProxy Contract: {USDTApproval}</h3>
          <br/>
          <Button onClick={()=>{getImpersonatingSignerUSDT()}}>Snatch USDT</Button>
          <Button onClick={() => {refreshUSDTBalance()}}>Refresh USDT Balance</Button><br />
          <Button onClick={() => {approveUSDT()}}>Approve USDT for HomoraBank</Button>
          <Button onClick={() => {refreshUSDTApproval()}}>Refresh USDT Approval</Button><br />
          <Button onClick={() => {executeHomoraBank()}}>Execute HomoraBank</Button>
        </div> */}

      <Divider />

      <h4>Latest Block:</h4>
      <h1>{latestBlock}</h1>
      <h6>Previous Block timestamp: {prevBlockTimestamp}</h6>
      <h6>Diff: {latestBlockTimestamp - prevBlockTimestamp}</h6>
      <h6>Latest Block timestamp: {latestBlockTimestamp}</h6>

      <Button onClick={()=>{refreshLatestBlock()}}>Refresh Block</Button>
      <Button onClick={()=>{refreshLatestBlockTimestamp()}}>Refresh Block Timestamp</Button><br/>

      <Input style={{width: '20%', margin: 5}} placeholder='timetravel seconds' onChange={(e)=>{setTimeTravelSeconds(e.target.value)}} />
      <Button onClick={()=>{timeTravel()}}>Time Travel</Button>

      <Divider />

        <Button onClick={()=>{initialSetup()}}>Initial Setup</Button>
        <Button onClick={()=>{resetNFT20Fee()}}>Reset NFT20 Fee</Button>
        
        <br />
        <br />

        <Button onClick={()=>{refreshStates()}}>Refresh</Button>
        
        <br />
        <br />

        <h3>{daiBalance} DAI</h3>
        {
          apy ? (<h3>APY: {apy}%</h3>) : <></>
        }
        {
          totalYieldGen ? (<h3>Total Yield: {totalYieldGen} DAI</h3>) : <></>
        }

        <h3>Owner of HashMask {hashMaskTokenId} : {hashMaskOwner}</h3>

        <span style={{margin: 2}}>HashMask Token ID:</span>
        <Input style={{width: '20%'}} placeholder='hashmasks tokenid' value={hashMaskTokenId} onChange={(e)=>{setHashMaskTokenId(e.target.value)}} />

        <br/>
        <br/>

        <Button onClick={()=>{getImpersonatingSignerDai(null)}}>Snatch DAI</Button>
        <Button onClick={()=>{getImpersonatingSignerHashMasks(null)}}>Snatch HashMasks</Button>

        <br/>
        

        <Button onClick={() => {refreshDAIBalance()}}>Refresh DAI Balance</Button>
        <Button onClick={() => {refreshHashMaskOwner()}}>Refresh HashMask Owner</Button>

        <br/>
        <br/>
        
        <h3>DAI Approval for NFTProject Contract: {DAIApproval}</h3>
        <h3>HashMask Approvals for {hashMaskTokenId}: {hashMaskApproval}</h3>
        <Button onClick={() => {approveDAI(null)}}>Approve DAI</Button>
        <Button onClick={() => {approveHashMasks(null)}}>Approve HashMasks</Button>

        <br/>

        <Button onClick={() => {refreshDAIApproval()}}>Refresh DAI Approval</Button>
        <Button onClick={() => {refreshHashMaskApproval()}}>Refresh HashMask Approval</Button>

        <br/>
        <br/>

        <h3>YearnStrat: {yTokenBalance} yDAI</h3>
        <Button onClick={() => {refreshYTokenBalance()}}>Refresh yDAI Balance</Button>

        <br/>
        <br/>

        <Divider/>

        <h2><u>NFTProject UI:</u></h2>

        <br/>

          {isSignatures ? (
            <>
              <div>
                <h2>Listed NFTs</h2> <Button onClick={() => setSignatures([])}>Clear</Button>

                <div style={{margin:8}}>
                  <Signatures signatures={signatures} type='borrow' signerAddress={borrower} beginInvestment={beginInvestment} verifyBorrowerSignature={verifyBorrowerSignature} verifyLenderSignature={verifyLenderSignature}/>
                </div>
              </div>
              <Divider />
            </>
          ) : (<div />)}

        <h2>Borrow</h2>

        <div style={{margin:8}}>
        <span style={{margin: 5}}>nftTokenContract:</span>
          <Dropdown
            overlay={nftTokenContract_BorrowMenuList}
            onVisibleChange={handleNftTokenContract_BorrowMenuVisibleChange}
            visible={nftTokenContract_BorrowMenuState.visible}
          >
            <a className="ant-dropdown-link" onClick={e => e.preventDefault()}>
              <b>{nftTokenContract_BorrowMenuText}</b> <DownOutlined />
            </a>
          </Dropdown> : {nftTokenContract_Borrow}
          
          <br/>
          <br/>

          {/* <Input placeholder='nftTokenContract_Borrow' onChange={(e)=>{setNftTokenContractBorrow(e.target.value)}} /> */}
          <span style={{margin: 5}}>nftTokenId:</span>
          <Input style={{width: '20%', margin: 5}} placeholder={'nftTokenId'} onChange={(e)=>{setNftTokenIdBorrow(e.target.value)}} />

          <br/>

          <span style={{margin: 5}}>borrower:</span>
          <Input style={{width: '70%', margin: 5}} placeholder='borrower' value={borrower} disabled onChange={(e)=>{setBorrower(e.target.value)}} />

          <br/>  
          <br/>  
          
          <span style={{margin: 10}}>strategy:</span>
          <Dropdown
            overlay={strategyMenuList}
            onVisibleChange={handleStrategyMenuVisibleChange}
            visible={strategyMenuState.visible}
          >
            <a className="ant-dropdown-link" onClick={e => e.preventDefault()}>
              <b>{strategyMenuText}</b> <DownOutlined />
            </a>
          </Dropdown> : {strategy}

          <br/>
          <br/>
          
          <span style={{margin: 5}}>yVault:</span>
          <Dropdown
            overlay={yVaultMenuList}
            onVisibleChange={handleYVaultMenuVisibleChange}
            visible={yVaultMenuState.visible}
          >
            <a className="ant-dropdown-link" onClick={e => e.preventDefault()}>
              <b>{yVaultMenuText}</b> <DownOutlined />
            </a>
          </Dropdown> : {yVault}

          <br/>
          <br/>

          <span style={{margin: 5}}>viaNFT20:</span>
          <Checkbox onChange={(e)=>{setViaNFT20(e.target.checked)}}></Checkbox>

          <br/>
          <br/>

          {/* <Input placeholder='strategy' value={strategy} onChange={(e)=>{setStrategy(e.target.value)}} /> */}
          <Button onClick={() => signBorrowerMessage()}>Sign Message</Button>
        </div>

        <Divider />

        <h2>Lend</h2>

        <div style={{margin:8}}>
        <span style={{margin: 5}}>lendPrincipalAmount:</span>
          <Input style={{width: '50%', margin: 5}}placeholder='lendPrincipalAmount' value={lendPrincipalAmount} onChange={(e)=>{setLendPrincipalAmount(e.target.value)}} suffix={(
            <Tooltip placement="right" title={"* 10 ** 18"}>
            <div
              type="dashed"
              style={{ cursor: "pointer" }}
              onClick={async () => {
                setLendPrincipalAmount(((utils.parseEther(lendPrincipalAmount)).toString()))
              }}
            >
              ✴️
              </div>
          </Tooltip>
          )}/>
          {/* <Input placeholder='lendPrincipalAmount' onChange={(e)=>{setLendPrincipalAmount(e.target.value)}} /> */}

          <br/>  
          <br/>  

          <span style={{margin: 10}}>lendERC20Contract:</span>
          <Dropdown
            overlay={lendERC20ContractMenuList}
            onVisibleChange={handleLendERC20ContractMenuVisibleChange}
            visible={lendERC20ContractMenuState.visible}
          >
            <a className="ant-dropdown-link" onClick={e => e.preventDefault()}>
              <b>{lendERC20ContractMenuText}</b> <DownOutlined />
            </a>
          </Dropdown> : {lendERC20Contract}

          <br/>  
          <br/>  

          {/* <Input placeholder='lendERC20Contract' onChange={(e)=>{setLendERC20Contract(e.target.value)}} /> */}

          <span style={{margin: 5}}>nftTokenContract:</span>
          <Dropdown
            overlay={nftTokenContract_LendMenuList}
            onVisibleChange={handleNftTokenContract_LendMenuVisibleChange}
            visible={nftTokenContract_LendMenuState.visible}
          >
            <a className="ant-dropdown-link" onClick={e => e.preventDefault()}>
              <b>{nftTokenContract_LendMenuText}</b> <DownOutlined />
            </a>
          </Dropdown> : {nftTokenContract_Lend}
          
          <br/>
          <br/>

          {/* <Input placeholder='nftTokenContract_Lend' onChange={(e)=>{setNftTokenContractLend(e.target.value)}} /> */}
          <span style={{margin: 5}}>nftTokenId:</span>
          <Input style={{width: '20%', margin: 5}} placeholder={'nftTokenId'} onChange={(e)=>{setNftTokenIdLend(e.target.value)}} />

          <br/>

          <span style={{margin: 5}}>lendDuration:</span>
          <Input style={{width: '50%', margin: 5}} placeholder='lendDuration days' value={lendDuration} onChange={(e)=>{setLendDuration(e.target.value)}} suffix={(
            <Tooltip placement="right" title={"days to seconds"}>
            <div
              type="dashed"
              style={{ cursor: "pointer" }}
              onClick={async () => {
                setLendDuration(lendDuration * 24 * 60 * 60);
                setClosingTime(Math.floor(Date.now() / 1000) + lendDuration * 24 * 60 * 60);
              }}
            >
              🕒
              </div>
          </Tooltip>
          )}/>
          <br/>
          <span style={{margin: 5}}>closingTime: {parseInt(latestBlockTimestamp) + parseInt(lendDuration)}</span>

          <br/>

          {/* <Input placeholder='lendDuration' onChange={(e)=>{setLendDuration(e.target.value)}} /> */}

          <span style={{margin: 5}}>lender:</span>
          <Input style={{width: '70%', margin: 5}} placeholder='lender' value={lender} disabled onChange={(e)=>{setLender(e.target.value)}} />

          <br/>
          <br/>

          <Button onClick={() => signLenderMessage()}>Sign Message</Button>
        </div>

        <Divider />

        {/* <Button onClick={() => getUniswapPairData()}>getUniswapPairData</Button> */}


        <span style={{margin: 5}}>investId:</span>
        <Input style={{width: '20%', margin: 5}} placeholder='investId' onChange={(e)=>{setEndInvestId(e.target.value)}} /><br />
        <Button onClick={() => endInvestment()}>End Investment</Button>
        <Button onClick={() => getInvestment()}>Get Investment</Button>

        <br/>  
        <br/>  

        {/* <Divider /> */}

        {/* <div>
          <h2>Balances</h2>

          <h3>Borrower: {accounts.borrower}</h3>
          <span style={{textDecoration:'underline'}}>FakeERC20</span>:
          <TokenBalance
            contracts={readContracts}
            name='FakeERC20'
            address={accounts.borrower}
          /><br />
          <span style={{textDecoration:'underline'}}>FakeNFT</span>:
          <NFTBalance
            contracts={readContracts}
            name='FakeNFT'
            localProvider={localProvider}
            address={accounts.borrower}
          />
          <span style={{textDecoration:'underline'}}>NFTProject IOU</span>:
          <NFTBalance
            contracts={readContracts}
            name='NFTProject'
            localProvider={localProvider}
            address={accounts.borrower}
          />

          <br />

          <h3>Lender: {accounts.lender}</h3>
          <span style={{textDecoration:'underline'}}>FakeERC20</span>:
          <TokenBalance
            contracts={readContracts}
            name='FakeERC20'
            address={accounts.lender}
          /><br />
          <span style={{textDecoration:'underline'}}>FakeNFT</span>:
          <NFTBalance
            contracts={readContracts}
            name='FakeNFT'
            localProvider={localProvider}
            address={accounts.lender}
          />
          <span style={{textDecoration:'underline'}}>NFTProject IOU</span>:
          <NFTBalance
            contracts={readContracts}
            name='NFTProject'
            localProvider={localProvider}
            address={accounts.lender}
          />

          <br />

          <h3>NFTProject Contract: {readContracts?readContracts['NFTProject'].address:'0x00000000000000'}</h3>
          <span style={{textDecoration:'underline'}}>FakeERC20</span>:
          <TokenBalance
            contracts={readContracts}
            name='FakeERC20'
            address={readContracts?readContracts['NFTProject'].address:'0x00000000000000'}
          /><br />
          <span style={{textDecoration:'underline'}}>FakeNFT</span>:
          <NFTBalance
            contracts={readContracts}
            name='FakeNFT'
            localProvider={localProvider}
            address={readContracts?readContracts['NFTProject'].address:'0x00000000000000'}
          />
          <span style={{textDecoration:'underline'}}>NFTProject IOU</span>:
          <NFTBalance
            contracts={readContracts}
            name='NFTProject'
            localProvider={localProvider}
            address={readContracts?readContracts['NFTProject'].address:'0x00000000000000'}
          />
          </div> */}

      </div>

      {/*
        📑 Maybe display a list of events?
          (uncomment the event and emit line in YourContract.sol! )
      */}
      {/* <div style={{ width:600, margin: "auto", marginTop:32, paddingBottom:32 }}>
        <h2>Events:</h2>
        <List
          bordered
          dataSource={setPurposeEvents}
          renderItem={(item) => {
            return (
              <List.Item key={item.blockNumber+"_"+item.sender+"_"+item.purpose}>
                <Address
                    address={item[0]}
                    ensProvider={mainnetProvider}
                    fontSize={16}
                  /> =>
                {item[1]}
              </List.Item>
            )
          }}
        />
      </div> */}


    </div>
  );
}
