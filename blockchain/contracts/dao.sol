// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.28;

contract TRPG_DAO {
    // === Roles ===
    address public owner;
    mapping(address => bool) public ruleMasters;

    // === Proposal Structure ===
    struct Proposal {
        string description; // Text description of the proposal
        uint256 voteEndTime; // Voting deadline (Unix timestamp)
        uint256[] votes; // Array storing vote counts per option
        uint256 totalVotes; // Number of users who have voted
        bool active; // Voting status
        address[] users; // Whitelisted voters for this proposal
    }

    Proposal[] public proposals;
    mapping(uint256 => mapping(address => uint8)) public userVotes; // proposalId => user => selected option

    // === Events ===
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event RuleMasterAdded(address indexed newRuleMaster);
    event RuleMasterRemoved(address indexed removedRuleMaster);

    event ProposalCreated(uint256 proposalId, string description, uint256 voteEndTime);
    event ProposalClosed(uint256 proposalId);
    event Voted(uint256 proposalId, address voter, uint8 option);

    constructor() {
        owner = msg.sender;
        ruleMasters[msg.sender] = true;
    }

    // === Modifiers ===
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can execute this");
        _;
    }

    modifier onlyRuleMaster() {
        require(ruleMasters[msg.sender], "Only Rule Master can execute this");
        _;
    }

    modifier onlyActiveProposal(uint256 _proposalId) {
        require(_proposalId < proposals.length, "Invalid proposal");
        require(proposals[_proposalId].active, "Proposal not active");
        _;
    }

    modifier onlyExistingProposal(uint256 _proposalId) {
        require(_proposalId < proposals.length, "Invalid proposal");
        _;
    }

    // === Owner Functions ===
    // Transfer ownership to a new address (EOA or another contract)
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "New owner should not be the zero address");
        
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    // Add a new Rule Master
    function addRuleMaster(address _ruleMaster) public onlyOwner {
        require(_ruleMaster != address(0), "New Rule Master should not be the zero address");
        require(!ruleMasters[_ruleMaster], "Address is already a Rule Master");

        ruleMasters[_ruleMaster] = true;
        emit RuleMasterAdded(_ruleMaster);
    }

    // Remove an existing Rule Master
    function removeRuleMaster(address _ruleMaster) public onlyOwner {
        require(ruleMasters[_ruleMaster], "Address is not a Rule Master");

        ruleMasters[_ruleMaster] = false;
        emit RuleMasterRemoved(_ruleMaster);
    }

    // === Proposal Creation ===
    // Create a new proposal with given scope and duration
    function createProposal(string memory _description, uint256 _duration, uint256 _numOptions, address[] memory _users) public onlyRuleMaster {
        require(_numOptions > 1, "Must have at least 2 voting Options");
        require(_users.length > 0, "must have at least 1 voter");

        uint256 voteEndTime = block.timestamp + _duration; // Current time + duration (second)

        proposals.push(Proposal({
            description: _description,
            voteEndTime: voteEndTime,
            votes : new uint256[](_numOptions),
            totalVotes: 0,
            active: true,
            users: _users
        }));

        emit ProposalCreated(proposals.length - 1, _description, voteEndTime);
    }

    // === Voting ===
    // Vote or update vote on a proposal
    function vote(uint256 _proposalId, uint8 _option) public onlyActiveProposal(_proposalId) {
        Proposal storage proposal = proposals[_proposalId];

        require(isEligibleToVote(_proposalId, msg.sender), "You are not eligible to vote in this proposal");
        require(_option > 0 && _option <= proposal.votes.length, "Invalid option");

        if (userVotes[_proposalId][msg.sender] != 0) {
            uint256 previousVote = userVotes[_proposalId][msg.sender];
            proposal.votes[previousVote -1]--;
        } else {
            proposal.totalVotes++;
        }

        proposal.votes[_option -1]++;
        userVotes[_proposalId][msg.sender] = _option;

        emit Voted(_proposalId, msg.sender, _option);

        if (isAllVotesCast(_proposalId)){
            _closeProposal(_proposalId);
        }
    }

    // === Proposal Closure ===
    // Manually close a proposal
    function closeProposal(uint256 _proposalId) public onlyRuleMaster onlyActiveProposal(_proposalId) {
        _closeProposal(_proposalId);
    }

    // Internal function to close a proposal (called by vote or closeProposal)
    function _closeProposal(uint256 _proposalId) internal onlyActiveProposal(_proposalId) {
        Proposal storage proposal = proposals[_proposalId];
        require(block.timestamp >= proposal.voteEndTime || isAllVotesCast(_proposalId), "Voting still ongoing");

        proposal.active = false;
        emit ProposalClosed(_proposalId);
    }

    // === Vote Eligibility ===
    // Check if a user is eligible to vote
    function isEligibleToVote(uint256 _proposalId, address user) public view returns (bool) {
        Proposal storage proposal = proposals[_proposalId];
        uint256 length = proposal.users.length;
        for (uint256 i=0; i <length; i++) {
            if (proposal.users[i] == user) return true;
        }
        return false;
    }

     // === Utility Views ===
    function isAllVotesCast(uint256 _proposalId) public view returns (bool) {
        Proposal storage proposal = proposals[_proposalId];
        return proposal.totalVotes == getTotalEligibleVoters(_proposalId);
    }
    
    // Calculate total number of users eligible to vote
    function getTotalEligibleVoters(uint256 _proposalId) public view returns (uint256) {
        Proposal storage proposal = proposals[_proposalId];
        return proposal.users.length;
    }

    // Get proposal details
    function getProposal(uint256 _proposalId) public view onlyExistingProposal(_proposalId) returns (Proposal memory) {
        return proposals[_proposalId];
    }

    // Get all proposal details
    function getAllProposals() public view returns (Proposal[] memory) {
        return proposals;
    }

    // Get vote counts for a proposal
    function getProposalResults(uint256 _proposalId) public view onlyExistingProposal(_proposalId) returns (uint256[] memory) {
        return proposals[_proposalId].votes;
    }

    // Get all vote counts for a proposal
    function getAllProposalResults() public view returns (uint256[][] memory) {
        uint256 length = proposals.length;
        uint256[][] memory results = new uint256[][](length);
        for (uint256 i=0;i<length;i++) {
            results[i] = proposals[i].votes;
        }
        return results;
    }
}