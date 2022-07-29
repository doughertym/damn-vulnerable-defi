## [Challenge #10 - Free rider](https://www.damnvulnerabledefi.xyz/challenges/10.html)

A new marketplace of Damn Valuable NFTs has been released! There's been an initial mint of 6 NFTs, which are available for sale in the marketplace. Each one at 15 ETH.

A buyer has shared with you a secret alpha: the marketplace is vulnerable and all tokens can be taken. Yet the buyer doesn't know how to do it. So it's offering a payout of 45 ETH for whoever is willing to take the NFTs out and send them their way.

You want to build some rep with this buyer, so you've agreed with the plan.

Sadly you only have 0.5 ETH in balance. If only there was a place where you could get free ETH, at least for an instant.

## Solutions

### Self

OK, it seems like the vulnerability is in the `_buyOne()` function: 

```solidity
    // transfer from seller to buyer
    token.safeTransferFrom(token.ownerOf(tokenId), msg.sender, tokenId);

    // pay seller
    payable(token.ownerOf(tokenId)).sendValue(priceToPay);
```

Where the `safeTransferFrom()` function updates the underlying `_owners` array with the new owner. Then the next line sends the `priceToPay` to the new owner, essentially refunding the `priceToPay` back to the buyer. So borrowing enough ETH to buy the first 6 offered NFTs, then buying them all in the same transaction and then returning the borrowed amount back to the lender. This will work for the 6 offered. 

But then how to get the remaining. Actually, looking at the test case, I only need to get the 6 being offered.

So from where do I borrow the 15 ETH needed to buy them all? 

So it would seem that I can borrow the ETH from the Uniswap contract via a [flash swap](https://docs.uniswap.org/protocol/V2/guides/smart-contract-integration/using-flash-swaps).

I pretty much had the general idea from looking at the contract. But I did use [Zuhaib Mohammed's solution](https://zuhaibmd.medium.com/damn-vulnerable-defi-challenge-10-free-rider-341c8c0f52a1) in [free-rider.challenge.js](https://github.com/zzzuhaibmohd/damn-vulnerable-defi-solutions/blob/master/test/free-rider/free-rider.challenge.js) and [AttackFreeRider.sol](https://github.com/zzzuhaibmohd/damn-vulnerable-defi-solutions/blob/master/contracts/free-rider/AttackFreeRider.sol) for some of the code snippets.

### Fix Bug

Can I fix this issue? Maybe just keep the current owner as a variable, then use that variable to make the transfers.

```
Index: contracts/free-rider/FreeRiderNFTMarketplace.sol
===================================================================
diff --git a/contracts/free-rider/FreeRiderNFTMarketplace.sol b/contracts/free-rider/FreeRiderNFTMarketplace.sol
--- a/contracts/free-rider/FreeRiderNFTMarketplace.sol	
+++ b/contracts/free-rider/FreeRiderNFTMarketplace.sol	(date 1659057936917)
@@ -74,11 +74,10 @@
         amountOfOffers--;
 
         // transfer from seller to buyer
-        address originalOwner = token.ownerOf(tokenId);
-        token.safeTransferFrom(originalOwner, msg.sender, tokenId);
+        token.safeTransferFrom(token.ownerOf(tokenId), msg.sender, tokenId);
 
         // pay seller
-        payable(originalOwner).sendValue(priceToPay);
+        payable(token.ownerOf(tokenId)).sendValue(priceToPay);
 
         emit NFTBought(msg.sender, tokenId, priceToPay);
     }    

```