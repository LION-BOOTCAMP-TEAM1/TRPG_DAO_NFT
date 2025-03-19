// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

interface IERC1155WithSupply is IERC1155 {
    function totalSupply(uint256 id) external view returns (uint256);
}

contract TRPG_DAO {
    IERC1155WithSupply public token;
    address public owner;

    struct Proposal {
        string description;
        uint256 tokenId; // Required token ID to vote
        uint256 voteEndTime; // Voting deadline (Unix timestamp)
        uint256 votesA;
        uint256 votesB;
        uint256 votesC;
        uint256 totalVotes;
        bool active;
    }

    Proposal[] public proposals;
    mapping(uint256 => mapping(address => uint256)) public userVotes; // proposalId => user => number of votes
    mapping(uint256 => mapping(address => uint8)) public userVoteOptions; // proposalId => user => selected option

    event ProposalCreated(uint256 proposalId, string description, uint256 tokenId, uint256 voteEndTime);
    event Voted(uint256 proposalId, address voter, uint8 option);
    event ProposalClosed(uint256 proposalId);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(address _token) {
        token = IERC1155WithSupply(_token);
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can execute this");
        _;
    }

    modifier onlyActiveProposal(uint256 _proposalId) {
        require(_proposalId < proposals.length, "Invalid proposal");
        require(proposals[_proposalId].active, "Proposal not active");
        _;
    }

    // Transfer ownership to a new address (EOA or another contract)
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "New owner should not be the zero address");
        
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    // Create a new proposal (only owner can execute)
    function createProposal(string memory _description, uint256 _tokenId, uint256 _duration) public onlyOwner {
        uint256 voteEndTime = block.timestamp + _duration; // Current time + duration (second)
        proposals.push(Proposal({
            description: _description,
            tokenId: _tokenId,
            voteEndTime: voteEndTime,
            votesA: 0,
            votesB: 0,
            votesC: 0,
            totalVotes: 0,
            active: true
        }));

        uint256 proposalId = proposals.length - 1;
        emit ProposalCreated(proposalId, _description, _tokenId, voteEndTime);
    }

    // Cast or update a vote
    function vote(uint256 _proposalId, uint8 _option) public onlyActiveProposal(_proposalId) {
        Proposal storage proposal = proposals[_proposalId];

        require(block.timestamp < proposal.voteEndTime, "Voting period ended");
        require(token.balanceOf(msg.sender, proposal.tokenId) > 0, "Not a token holder");
        require(_option >= 1 && _option <= 3, "Invalid option");

        uint256 voterBalance = token.balanceOf(msg.sender, proposal.tokenId);
        uint256 previousVoteWeight = userVotes[_proposalId][msg.sender];
        uint8 previousVoteOption = userVoteOptions[_proposalId][msg.sender];

        // Remove previous vote
        if (previousVoteWeight > 0) {
            if (previousVoteOption == 1) {
                proposal.votesA -= previousVoteWeight;
            } else if (previousVoteOption == 2) {
                proposal.votesB -= previousVoteWeight;
            } else if (previousVoteOption == 3) {
                proposal.votesC -= previousVoteWeight;
            }
            proposal.totalVotes -= previousVoteWeight;
        }

        // Register new vote (balance-weighted)
        if (_option == 1) {
            proposal.votesA += voterBalance;
        } else if (_option == 2) {
            proposal.votesB += voterBalance;
        } else if (_option == 3) {
            proposal.votesC += voterBalance;
        }
        proposal.totalVotes += voterBalance;


        // Store user's new vote option and weight
        userVotes[_proposalId][msg.sender] = voterBalance;
        userVoteOptions[_proposalId][msg.sender] = _option;

        emit Voted(_proposalId, msg.sender, _option);
    }

    // Close the proposal (only owner can execute)
    function closeProposal(uint256 _proposalId) public onlyOwner onlyActiveProposal(_proposalId) {
        Proposal storage proposal = proposals[_proposalId];
        
        require(block.timestamp >= proposal.voteEndTime || isAllVotesCast(_proposalId), "Voting still ongoing");

        proposal.active = false;
        emit ProposalClosed(_proposalId);
    }

    // Check if all token holders have voted
    function isAllVotesCast(uint256 _proposalId) public view returns (bool) {
        Proposal storage proposal = proposals[_proposalId];
        
        uint256 totalVoters = token.totalSupply(proposal.tokenId);

        return proposal.totalVotes >= totalVoters;
    }

    // Get proposal details
    function getProposal(uint256 _proposalId) public view returns (
        string memory, uint256, uint256, uint256, uint256, uint256, uint256, bool
    ) {
        require(_proposalId < proposals.length, "Invalid proposal");
        Proposal storage proposal = proposals[_proposalId];

        return (
            proposal.description, 
            proposal.tokenId, 
            proposal.voteEndTime,            
            proposal.votesA, 
            proposal.votesB,                  
            proposal.votesC,                
            proposal.totalVotes,
            proposal.active
        );
    }
}
