import React from "react";
import { useLocalStorage } from "../hooks";
import { Button } from "antd";
import { utils } from "ethers";

export default function Signatures(props) {
  const signatures = props.signatures;

  if (props.type == 'lend')
    return (
        signatures.filter((signature)=>
          signature.type == 'lend' && 
          signature.nftTokenContract_Lend == props.nftTokenContract && 
          signature.nftTokenId_Lend == props.nftTokenId
        ).map((signature, index) => (
          <>
            <h4>Offers: </h4>
            <ul>
              <h6 style={{textDecoration:"underline"}}>Offer {index+1}</h6>
              <li>Lend Principal Amount: {utils.formatEther(signature.lendPrincipalAmount)}</li>
              <li>Lend ERC20: {signature.lendERC20Contract}</li>
              <li>Lend Duration: {signature.lendDuration}</li>
              <li>Lender: {signature.lender}</li>
              {/* <li>Signature: {signature.signature}</li> */}
              <Button onClick={() => props.verifyLenderSignature(signature.lendPrincipalAmount, signature.lendERC20Contract, signature.nftTokenContract_Lend, signature.nftTokenId_Lend, signature.lendDuration,  signature.lender,  signature.signature)}>Verify Signature</Button>
                { props.signerAddress == props.borrower ? (
                  <Button onClick={() => props.beginInvestment(signature.nftTokenContract_Lend, signature.nftTokenId_Lend, props.borrower, signature.lender, props.borrowSignature.strategy, props.borrowSignature.yVault, signature.lendPrincipalAmount, signature.lendERC20Contract, signature.lendDuration, props.borrowSignature.signature, signature.signature)}>Begin Investment</Button>
                ) : null}
            </ul>
          </>
        ))
      )
  else
    return (<div>
      {
        signatures.filter((signature)=>signature.type == 'borrow').map((signature, index) => (
          <ul style={{ textAlign: "left" }}>
          <h2 style={{ textDecoration: "underline" }}>Item {index + 1}</h2>
          <li>NFT Contract: {signature.nftTokenContract_Borrow}</li>
          <li>NFT Token ID: {signature.nftTokenId_Borrow}</li>
          <li>Borrower: {signature.borrower}</li>
          <li>Strategy: {signature.strategy}</li>
          <li>yVault: {signature.yVault}</li>
          {/* <li>Signature: {signature.signature}</li> */}
          <Button onClick={() => props.verifyBorrowerSignature(signature.nftTokenContract_Borrow, signature.nftTokenId_Borrow, signature.borrower, signature.strategy, signature.yVault,  signature.signature)}>Verify Signature</Button>
          <Signatures 
            type='lend' 
            borrowSignature={signature}
            signatures={signatures}
            nftTokenContract={signature.nftTokenContract_Borrow}
            nftTokenId={signature.nftTokenId_Borrow}
            signerAddress={props.signerAddress}
            borrower={signature.borrower}
            beginInvestment={props.beginInvestment}
            verifyLenderSignature={props.verifyLenderSignature}
          />
          </ul>
        ))
      }
    </div>)
  }
