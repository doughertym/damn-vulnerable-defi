## [Side entrance](https://www.damnvulnerabledefi.xyz/challenges/4.html)

A surprisingly simple lending pool allows anyone to deposit ETH, and withdraw it at any point in time.

This very simple lending pool has 1000 ETH in balance already, and is offering free flash loans using the deposited ETH to promote their system.

You must take all ETH from the lending pool.

### Solutions

#### [cmichel.io](https://cmichel.io/damn-vulnerable-de-fi-solutions/)

This time the flash loan contract has an integrated accounting system (`balances` storage variable) that allows anyone to deposit and withdraw their liquidity. The issue is that, when taking a flash loan, the contract only checks if the contract’s token balance has not decreased - but the accounting system is ignored. We can take a flash loan and in the callback deposit the funds again which will credit our attacker with the same balance. The flash loan check passes as the tokens are still in the flash loan contract because of the deposit. Afterwards, we can withdraw the funds.

