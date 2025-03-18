// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

contract TRPG_DAO {
    IERC1155 public token;
    address public owner;

    struct Proposal {
        string description;
        uint256 tokenId; // 해당 투표에 필요한 ERC-1155 토큰 ID
        uint256 voteEndTime; // 투표 종료 시간 (Unix timestamp)
        uint256 votesA;
        uint256 votesB;
        uint256 votesC;
        bool active;
    }

    Proposal[] public proposals;
    mapping(uint => mapping(address => bool)) public hasVoted; // proposalId => user

    event ProposalCreated(uint256 proposalId, string description, uint256 tokenId, uint256 voteEndTime);
    event Voted(uint256 proposalId, address voter, uint8 option);
    event ProposalClosed(uint256 proposalId);

    constructor(address _token) {
        token = IERC1155(_token);
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can execute this");
        _;
    }

    modifier onlyTokenHolders(uint256 _tokenId) {
        require(token.balanceOf(msg.sender, _tokenId) > 0, "Not a token holder");
        _;
    }

    modifier onlyActiveProposal(uint256 _proposalId) {
        require(_proposalId < proposals.length, "Invalid proposal");
        require(proposals[_proposalId].active, "Proposal not active");
        _;
    }

    function createProposal(string memory _description, uint256 _tokenId, uint256 _duration) public onlyOwner {
        uint256 voteEndTime = block.timestamp + _duration; // 현재 시간 + 지속 시간 (초 단위)
        proposals.push(Proposal({
            description: _description,
            tokenId: _tokenId,
            voteEndTime: voteEndTime,
            votesA: 0,
            votesB: 0,
            votesC: 0,
            active: true
        }));
    }
}