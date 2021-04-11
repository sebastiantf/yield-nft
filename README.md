# NFTProject
### Passive income from NFTs as collateral
> https://devfolio.co/submissions/nftproject-d942
## Introduction

*NFTProject* is a peer-to-peer marketplace that allows generating yield from idle NFTs. Holders can put up their NFTs as collateral and lenders with access to liquidity can offer capital against these collateral NFTs. The capital thus raised will be used in promising (automated) yield generation strategies across DeFi. The yield thus generated will be distributed between the participants.

## Why

There are several NFTs already available in the market with their value constantly going up. There are several collectors who buy these NFTs at very high prices. But once a collector acquires an NFT, there isn't much value generated from it, while sitting around idle inside their wallets. These NFTs can generate returns for the collector only in its next sale, and that too by having to cede ownership.

There aren't many platforms around that make use of such idle NFTs.

*NFTProject* can help collectors to use their idle NFTs to generate passive income for them, without them having to give up their ownership. 

For lenders who are looking for high yield investment opportunities in DeFi, they can invest in such strategies with less effort (automated), while hedging the risk of being liquidated which they would've had to bear, had they invested in them directly.

Since NFTs are collectibles, there is often huge value associated with them. This protocol enables to passively exploit that huge value using a win-win strategy

## How does it work?

NFT holders can list their NFTs in the marketplace as open for offers from lenders. Lenders checking the marketplace for listed NFTs can then see the NFT and make offers. Once the NFT holder and lender reach a consensus around the offer and the yield generation strategy, the NFT along with the funds offered by the lender will be transferred to the protocol's escrow contract.

The capital offered by the lender will be invested in one of the high risk, even leveraged yield generation strategies across DeFi, by the protocol. The protocol would then keep accruing yield from these strategies. The yield thus generated will be shared between the NFT provider and the lender, generating passive income off of the otherwise idle NFT.

If and when a liquidation event occurs in the investment strategy used by the protocol, the NFT locked up by the provider would be transferred to the lender's wallet giving the lender full ownership.

TL;DR 👇

Alice: NFT Provider; Bob, Charlie: Lenders

1. Alice lists her NFT as open for offers
2. Bob visits the marketplace and finds Alice's NFT
3. Bob decides to offer 1.5 ETH for Alice's NFT
4. Charlie visits the marketplace and finds Alice's NFT
5. Charlie decides to offer 2 ETH for Alice's NFT
6.  Alice finds both offers for her NFT in her dashboard and decides to proceed with Charlie's offer
7. Alice and Charlie finalize the terms of the offer, mainly the investment strategy to be used and the duration of the offer
8. When Alice and Charlie signs the finalization txn, Alice's NFT and funds offered by Charlie are transferred to the protocol's escrow contract
9. Protocol invests the funds in the chosen investment strategy and harvests the yield at regular intervals

10.a. When the offer reaches the end of the agreed tenure, the NFT, initial capital, and shares of the yield are transferred back to the provider and the lender with a relatively small share of the yield charged by the protocol as fees

10.b. If a liquidation event occurs, the NFT would be transferred to the lender

## Near-term Roadmap

The first thing in the near-term roadmap of the project would be to implement functionality that facilitates creating pools of NFTs that could be supported by multiple lenders. NFT holders will be allowed to pool together their NFTs into a single pool and multiple lenders would be allowed to offer capital against that single pool. The pooled fund will help generate higher yield for all participants with the yield shared pro rata between the providers and lenders.

Such pools of NFTs will be restricted to hold similar NFTs with relatively similar prices, to begin with.

In the event of liquidation of such a pooled capital, there are currently three fates (with more coming in the future) for the liquidated NFTs in the pool, one of which will be agreed upon by the lenders:

1. Liquidated NFTs can be sold on an NFT marketplace like OpenSea/Rarible with the proceeds from the sales distributed pro rata to the lenders
2. Liquidated NFTs can be used to create a new fund or join existing funds in [NFTX](http://nftx.org/) and the D1 tokens distributed pro rata to the lenders
3. Liquidated NFTs can be sharded and the shards distributed pro rata to the lenders

This feature can also open up the marketplace to those interested to participate, but don't have enough capital to offer for a whole NFT. It also benefits NFT providers who may not be having highly valuable NFTs to also take part and generate passive income. Helping the little guy.

Another major functionality that is planned for the near-term roadmap is the integration with the newly formed NFT liquidity protocols like NFT20, NFTX, etc. This could vastly improve the user experience and usage by eliminating the waiting period between when an NFT provider puts up their NFT and they receive an optimal offer from a lender

A gallery to showcase the NFTs currently participating in the marketplace is also planned. This can be implemented either by building a native showcase/gallery or possible integrations with existing projects like [Showtime](https://tryshowtime.com/) can be explored.

## An Exciting Future

The future of the protocol looks very exciting owing to the composability and innovations in DeFi

Once the protocol has been validated, battle-tested and has garnered community support and liquidity, there are several extensible manners that the protocol can develop. An exciting future for the protocol is one in which veteran DeFi protocols like Yearn Finance and Alpha Homora who have access to huge liquidity and to the Cream V2 Iron Bank become lenders in the marketplace.

Such protocols can gain access to huge under-collateralized liquidity from Cream V2 Iron Bank, which can then be used in the protocol to generate high yield off of the NFTs using highly leveraged strategies, while hedging risks. The idea for this protocol was initially conceived with this functionality in the first place. But this might be too ambitious for a protocol in its early days.

TL;DR 👇

1. Many different NFT holders put up their NFTs into a single pool
2. Protocols like Yearn Finance, Alpha Homora, etc. offer huge capital against the pooled NFTs
3. The lender protocol  draws under-collateralized liquidity from Cream V2 Iron Bank
4. Our protocol uses this huge liquidity to generate higher yield from the investment strategies

Also if research do us good, we shall come up with a mechanism to capture and represent the value of the NFTs in a much robust manner, so that the value can be determined and utilized effectively by the lenders
