// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Marketplace is ReentrancyGuard, Ownable {
    IERC1155 public immutable token;

    constructor(address tokenAddress) Ownable(msg.sender) {
        token = IERC1155(tokenAddress);
    }

    struct Listing {
        address seller;
        uint256 tokenId;
        uint256 pricePerItem;
        uint256 amountAvailable;
    }

    Listing[] public allListings;
    mapping(uint256 => mapping(address => Listing)) public listings;
    mapping(uint256 => mapping(address => uint256)) public listingIndex;

    uint256 public accumulatedFees;

    uint256 public constant FEE_PERCENT = 100; // 1%
    uint256 public constant BASIS_POINTS = 10000;

    function setForSale(uint256 tokenId, uint256 amount, uint256 pricePerItem) external {
        require(amount > 0, "Nothing to sell");
        require(pricePerItem > 0, "Price must be positive");
        require(token.isApprovedForAll(msg.sender, address(this)), "Marketplace not approved");

        uint256 balance = token.balanceOf(msg.sender, tokenId);
        require(balance >= amount, "Not enough balance to list");

        Listing memory newListing = Listing({
            seller: msg.sender,
            tokenId: tokenId,
            pricePerItem: pricePerItem,
            amountAvailable: amount
        });

        listings[tokenId][msg.sender] = newListing;

        if (listingIndex[tokenId][msg.sender] == 0 && 
            (allListings.length == 0 || allListings[0].seller != msg.sender || allListings[0].tokenId != tokenId)) {
            allListings.push(newListing);
            listingIndex[tokenId][msg.sender] = allListings.length - 1;
        } else {
            uint256 index = listingIndex[tokenId][msg.sender];
            allListings[index] = newListing;
        }
    }

    function buy(uint256 tokenId, address seller, uint256 amount) external payable nonReentrant {
        Listing storage listing = listings[tokenId][seller];
        require(listing.amountAvailable >= amount, "Not enough quantity");

        uint256 totalPrice = listing.pricePerItem * amount;
        require(msg.value >= totalPrice, "Not enough ETH");

        uint256 fee = (totalPrice * FEE_PERCENT) / BASIS_POINTS;
        uint256 sellerAmount = totalPrice - fee;
        accumulatedFees += fee;

        token.safeTransferFrom(seller, msg.sender, tokenId, amount, "");
        payable(seller).transfer(sellerAmount);

        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }

        listing.amountAvailable -= amount;

        uint256 index = listingIndex[tokenId][seller];
        allListings[index].amountAvailable -= amount;

        if (listing.amountAvailable == 0) {
            delete listings[tokenId][seller];

            uint256 last = allListings.length - 1;

            if (index != last) {
                allListings[index] = allListings[last];
                listingIndex[allListings[index].tokenId][allListings[index].seller] = index;
            }

            allListings.pop();
            delete listingIndex[tokenId][seller];
        }
    }

    function cancelListing(uint256 tokenId) external {
        delete listings[tokenId][msg.sender];

        uint256 index = listingIndex[tokenId][msg.sender];
        uint256 last = allListings.length - 1;

        if (index != last) {
            allListings[index] = allListings[last];
            listingIndex[allListings[index].tokenId][allListings[index].seller] = index;
        }

        allListings.pop();
        delete listingIndex[tokenId][msg.sender];
    }

    function getAllListings() external view returns (Listing[] memory) {
        return allListings;
    }

    function withdrawFees() external onlyOwner {
        uint256 amount = accumulatedFees;
        accumulatedFees = 0;
        payable(owner()).transfer(amount);
    }

    function getListing(uint256 tokenId, address seller) external view returns (Listing memory) {
        return listings[tokenId][seller];
    }

    function getAccumulatedFees() external view returns (uint256) {
        return accumulatedFees;
    }

    receive() external payable {}
}
