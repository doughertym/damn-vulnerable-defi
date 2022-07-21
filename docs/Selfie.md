## [Challenge #6 - Selfie](https://www.damnvulnerabledefi.xyz/challenges/6.html)

A new cool lending pool has launched! It's now offering flash loans of DVT tokens.

Wow, and it even includes a really fancy governance mechanism to control it.

What could go wrong, right ?

You start with no DVT tokens in balance, and the pool has 1.5 million. Your objective: take them all.

### Solutions

#### Self

OK, I think I have this one figured out on my own. I need to borrow some tokens from the pool. As long as I have more than 50% of the total supply, I can do _governance things_. The thing I need to do with governance permissions, is queue an action. Then I can return my tokens back to the pool. With the tokens returned, the flash loan is satisfied. Then I can wait 2 days (or advance the chain by 2 days), and then execute the action. The action contained the code to `drainAllFunds()` of the pool into the attacker's wallet.   

