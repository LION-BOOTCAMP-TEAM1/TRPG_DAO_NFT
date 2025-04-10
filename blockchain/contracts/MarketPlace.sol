// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Marketplace is ReentrancyGuard, Ownable {
    IERC1155 public immutable token;

    constructor(address tokenAddress) Ownable(msg.sender) {
        token = IERC1155(tokenAddress);
    }

    struct Listing {
        uint256 id;
        address seller;
        uint256 tokenId;
        uint256 pricePerItem;
        uint256 amountAvailable;
    }

    uint256 public nextListingId;
    uint256 public accumulatedFees;

    uint256 public constant FEE_PERCENT = 100; // 1%
    uint256 public constant BASIS_POINTS = 10000;

    mapping(uint256 => Listing) public listingsById;
    mapping(address => uint256[]) public listingIdsBySeller;
    uint256[] public activeListingIds;
    mapping(uint256 => uint256) private activeListingIndex;

    event Listed(uint256 indexed listingId, address indexed seller, uint256 tokenId, uint256 amount, uint256 price);
    event Purchase(uint256 indexed listingId, address indexed buyer, uint256 amount);
    event Canceled(uint256 indexed listingId);
    event FeesWithdrawn(uint256 amount);

    function setForSale(uint256 tokenId, uint256 amount, uint256 pricePerItem) external {
        require(amount > 0, "Nothing to sell");
        require(pricePerItem > 0, "Price must be positive");
        require(token.isApprovedForAll(msg.sender, address(this)), "Marketplace not approved");

        uint256 balance = token.balanceOf(msg.sender, tokenId);
        require(balance >= amount, "Not enough balance to list");

        uint256 listingId = nextListingId++;
        Listing memory newListing = Listing({
            id: listingId,
            seller: msg.sender,
            tokenId: tokenId,
            pricePerItem: pricePerItem,
            amountAvailable: amount
        });

        listingsById[listingId] = newListing;
        listingIdsBySeller[msg.sender].push(listingId);
        activeListingIndex[listingId] = activeListingIds.length;
        activeListingIds.push(listingId);

        emit Listed(listingId, msg.sender, tokenId, amount, pricePerItem);
    }

    function buy(uint256 listingId, uint256 amount) external payable nonReentrant {
        Listing storage listing = listingsById[listingId];
        require(listing.amountAvailable >= amount, "Not enough quantity");

        uint256 totalPrice = listing.pricePerItem * amount;
        require(msg.value >= totalPrice, "Not enough ETH");

        uint256 fee = (totalPrice * FEE_PERCENT) / BASIS_POINTS;
        uint256 sellerAmount = totalPrice - fee;
        accumulatedFees += fee;

        token.safeTransferFrom(listing.seller, msg.sender, listing.tokenId, amount, "");
        payable(listing.seller).transfer(sellerAmount);

        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }

        listing.amountAvailable -= amount;

        emit Purchase(listingId, msg.sender, amount);

        if (listing.amountAvailable == 0) {
            _removeListing(listingId);
        }
    }

    function cancelListing(uint256 listingId) external {
        Listing memory listing = listingsById[listingId];
        require(listing.seller == msg.sender, "Only seller can cancel");

        _removeListing(listingId);
        emit Canceled(listingId);
    }

    function _removeListing(uint256 listingId) internal {
        delete listingsById[listingId];

        // Remove from activeListingIds
        uint256 index = activeListingIndex[listingId];
        uint256 lastId = activeListingIds[activeListingIds.length - 1];

        activeListingIds[index] = lastId;
        activeListingIndex[lastId] = index;

        activeListingIds.pop();
        delete activeListingIndex[listingId];

        // (Optional) You can also remove from listingIdsBySeller[msg.sender] if you need
    }

    function getAllListings() external view returns (Listing[] memory) {
        Listing[] memory result = new Listing[](activeListingIds.length);
        for (uint256 i = 0; i < activeListingIds.length; i++) {
            result[i] = listingsById[activeListingIds[i]];
        }
        return result;
    }

    function getMyListings() external view returns (Listing[] memory) {
        uint256[] memory ids = listingIdsBySeller[msg.sender];
        Listing[] memory result = new Listing[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = listingsById[ids[i]];
        }
        return result;
    }

    function getListing(uint256 listingId) external view returns (Listing memory) {
        return listingsById[listingId];
    }

    function withdrawFees() external onlyOwner {
        uint256 amount = accumulatedFees;
        accumulatedFees = 0;
        payable(owner()).transfer(amount);
        emit FeesWithdrawn(amount);
    }

    function getAccumulatedFees() external view returns (uint256) {
        return accumulatedFees;
    }

    receive() external payable {}
}
