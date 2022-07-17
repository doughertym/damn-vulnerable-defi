## Challenge #2 - Naive receiver

There's a lending pool offering quite expensive flash loans of Ether, which has 1000 ETH in balance.

You also see that a user has deployed a contract with 10 ETH in balance, capable of interacting with the lending pool and receiveing flash loans of ETH.

Drain all ETH funds from the user's contract. Doing it in a single transaction is a big plus ;)

-----

## Solutions

### Self

So, do I actually understand what is going on here, or am I just copying and pasting the solution from someone else? 

No, at the moment, I am not sure I understand the exploit... or maybe I do...

The funds are being stolen from the borrower not the pool. The pool ends up with the initial 1,000 ETH plus the 10 ETH that was in the borrower's wallet. How? 

Well, the load receiver does not do one or both of the following. As, CMichel states, it allows anyone to take out a loan on its behalf. Which would not be a big problem is it also ensured that the balance of itself was at least greater than or equal to the starting balance. It assumes that any loan taken out by it, or on its behalf, will end up with more ETH than it started with. 

Of course, either that or it should make sure that the `receiveEther()` call is made where `txn.sender == owner`.

### [cmichel.io](https://cmichel.io/damn-vulnerable-de-fi-solutions/)

This challenge consists of a user contract interacting with a flash loan contract that takes a heavy fee on each flash loan. The goal is to drain the user’s contract. The issue here is that the user contract does not authenticate the user to be the owner, so anyone can just take any flash loan on behalf of that contract. It checks if msg.sender is the flash loan contract but this is always the case as the callback function is invoked from the flash loan contract.

To solve this challenge in a single transaction we can deploy a contract that repeatedly takes flash loans on the user contract’s behalf until its balance is less than the flash loan fee.

```solidity

function attack(
    NaiveReceiverLenderPool pool,
    address payable receiver
) public {
    uint256 FIXED_FEE = pool.fixedFee();
    while (receiver.balance >= FIXED_FEE) {
        pool.flashLoan(receiver, 0);
    }
}

```

