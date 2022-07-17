## [Challenge #3 - Truster](https://www.damnvulnerabledefi.xyz/challenges/3.html)

More and more lending pools are offering flash loans. In this case, a new pool has launched that is offering flash loans of DVT tokens for free.

Currently the pool has 1 million DVT tokens in balance. And you have nothing.

But don't worry, you might be able to take them all from the pool. In a single transaction.

## Solutions

### Self

I tried to do this in Javascript. It seemed like using `target.functionCall(data)` with an encoded function call on some `target` address. But it was not working as expected. It probably is possible to do it in only Javascript. But using chichel's solution seems to work the best.   

### [cmichel.io](https://cmichel.io/damn-vulnerable-de-fi-solutions/)

This challenge involves another flash loan contract offering loans for the DVT token. The goal is to steal them. The flash loan contract accepts a custom function to call and a payload as its argument. This allows us to call any contract function on the flash loan contract’s behalf which can be exploited. First, we take a flash loan of 0 tokens (such that no repayment is required) and pass the token’s approve function as arguments with a payload that approves our attacker to withdraw all funds in a subsequent transaction. This works because the context under which approve is executed is the flash loan contract because it is the one calling it.

Again, we can write a custom contract that combines both steps in a single function/transaction.

