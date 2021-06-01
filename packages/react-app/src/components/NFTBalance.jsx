import React, { useState, useEffect } from 'react'

import { Button, List, Card } from "antd";
import { useContractReader, useContractLoader } from "../hooks";

export default function NFTBalance(props) {

  //
  // 🧠 This effect will update yourCollectibles by polling when your balance changes
  //

  const readContracts = useContractLoader(props.localProvider)
  console.log(readContracts);

  const balance = useContractReader(readContracts,props.name, "balanceOf", [ props.address ])
  console.log("🤗 NFT balance:",balance)

  const yourBalance = balance && balance.toNumber && balance.toNumber()
  const [ yourCollectibles, setYourCollectibles ] = useState([])

  useEffect(()=>{
    const updateYourCollectibles = async () => {
      let collectibleUpdate = []
      for(let tokenIndex=0;tokenIndex<balance;tokenIndex++){
        try{
          console.log("GEtting token index",tokenIndex)
          const tokenId = await readContracts[props.name].tokenOfOwnerByIndex(props.address, tokenIndex)
          console.log("tokenId",tokenId)
          // const tokenURI = await readContracts.FakeNFT.tokenURI(tokenId)
          // console.log("tokenURI",tokenURI)

          // const ipfsHash =  tokenURI.replace("https://ipfs.io/ipfs/","")
          // console.log("ipfsHash",ipfsHash)

          // const jsonManifestBuffer = await getFromIPFS(ipfsHash)

          try{
            // const jsonManifest = JSON.parse(jsonManifestBuffer.toString())
            // console.log("jsonManifest",jsonManifest)
            // collectibleUpdate.push({ id:tokenId, uri:tokenURI, owner: address, ...jsonManifest })
            collectibleUpdate.push({ id:tokenId, owner: props.address })
          }catch(e){console.log(e)}

        }catch(e){console.log(e)}
      }
      setYourCollectibles(collectibleUpdate)
    }
    updateYourCollectibles()
  },[ props.address, yourBalance ])


  return (
    <div>
      {yourCollectibles ? (
        <p>
          Total: {yourBalance}<br />
          {yourCollectibles.map(collectible => (
            <>
              <span>Token Id: {collectible.id.toString()}</span>
              <br />
            </>
          ))}
        </p>
      ) : (
        <div />
      )}
    </div>
  );
}
