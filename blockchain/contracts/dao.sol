// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.28;

contract TRPG_DAO {
    address public owner;
    mapping(address => bool) public ruleMasters;

    struct Session {
        address[] users; // List of users participating in the session
        uint256 worldId; // Associated world ID
        uint256 genreId; // Associated genre ID
    }

    mapping(uint256 => Session) public sessions; // sessionId => Session data
    uint256[] public sessionIds; // List of all session IDs

    struct Proposal {
        string description; // Description of the proposal
        uint256 voteEndTime; // Voting deadline (Unix timestamp)
        uint256[] votes; // Number of votes per option
        uint256 totalVotes; // Total number of voters
        uint256 proposalScope; // 0: global, 1: session, 2: world, 3: genre
        uint256 scopeId; // ID corresponding to the scope type
        bool active; // Whether voting is still open
    }

    Proposal[] public proposals;
    mapping(uint256 => mapping(address => uint8)) public userVotes; // proposalId => user => selected option

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event RuleMasterAdded(address indexed newRuleMaster);
    event RuleMasterRemoved(address indexed removedRuleMaster);

    event SessionCreated(uint256 sessionId, uint256 worldId, uint256 genreId);
    event SessionDeleted(uint256 sessionId);
    event UserAddedToSession(uint256 sessionId, address user);
    event UserRemovedFromSession(uint256 sessionId, address user);

    event ProposalCreated(uint256 proposalId, string description, uint256 voteEndTime, uint256 proposalScope, uint256 scopeId);
    event ProposalClosed(uint256 proposalId);
    event Voted(uint256 proposalId, address voter, uint8 option);

    constructor() {
        owner = msg.sender;
        ruleMasters[msg.sender] = true;
    }

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

    // Create a new session with world and genre association
    function createSession(uint256 sessionId, uint256 worldId, uint256 genreId) public onlyRuleMaster {
        require(!sessionExists(sessionId), "Session already exists");

        sessions[sessionId].worldId = worldId;
        sessions[sessionId].genreId = genreId;
        sessionIds.push(sessionId);
        emit SessionCreated(sessionId, worldId, genreId);
    }

    // Check if a session exists
    function sessionExists(uint256 sessionId) internal view returns(bool) {
        uint256 length = sessionIds.length;
        for (uint256 i=0;i<length;i++) {
            if (sessionIds[i] == sessionId) return true;
        }
        return false;
    }

    // Delete a session and remove its ID
    function deleteSession(uint256 sessionId) public onlyRuleMaster {
        require(sessionExists(sessionId), "Session does not exist");
        delete sessions[sessionId];

        uint256 length = sessionIds.length;
        for (uint256 i = 0; i < length; i++) {
            if (sessionIds[i] == sessionId) {
                sessionIds[i] = sessionIds[length - 1];
                sessionIds.pop();
                break;
            }
        }
        emit SessionDeleted(sessionId);
    }

    // Add a user to a session
    function addUserToSession(uint256 sessionId, address user) public onlyRuleMaster {
        Session storage session = sessions[sessionId];
        uint256 length = session.users.length;
        for (uint256 i=0; i < length; i++) {
            if (session.users[i] == user) revert("User already in session");
        }

        session.users.push(user);
        emit UserAddedToSession(sessionId, user);
    }

    // Remove a user from a session
    function removeUserFromSession(uint256 sessionId, address user) public onlyRuleMaster {
        Session storage session = sessions[sessionId];
        uint256 length = session.users.length;
        for (uint256 i = 0; i < length; i++) {
            if (session.users[i] == user) {
                session.users[i] = session.users[length -1];
                session.users.pop();
                emit UserRemovedFromSession(sessionId, user);
                return;
            }
        }
        revert("User not found in session");
    }

    // Create a new proposal with given scope and duration
    function createProposal(string memory _description, uint256 _duration, uint256 _scope, uint256 _scopeId, uint256 _numOptions) public onlyRuleMaster {
        require(_scope <= 3, "Invalid proposal scope");
        require(_numOptions > 1, "Must have at least 2 voting Options");

        uint256 voteEndTime = block.timestamp + _duration; // Current time + duration (second)
        proposals.push(Proposal({
            description: _description,
            voteEndTime: voteEndTime,
            votes : new uint256[](_numOptions),
            totalVotes: 0,
            proposalScope: _scope,
            scopeId: _scopeId, 
            active: true
        }));

        emit ProposalCreated(proposals.length - 1, _description, voteEndTime, _scope, _scopeId);
    }

    // Vote or update vote on a proposal
    function vote(uint256 _proposalId, uint8 _option) public onlyActiveProposal(_proposalId) {
        Proposal storage proposal = proposals[_proposalId];

        require(isEligibleToVote(proposal.proposalScope, proposal.scopeId, msg.sender), "You are not eligible to vote in this proposal");
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

    // Check if a user is eligible to vote for a given scope and ID
    function isEligibleToVote(uint256 scope, uint256 scopeId, address user) public view returns (bool) {
        if (scope == 0) return true;
        uint256 length = sessionIds.length;
        for (uint256 i=0;i<length;i++) {
            uint256 sessionId = sessionIds[i];
            Session storage s = sessions[sessionId];
            if (
                (scope == 1 && sessionId == scopeId) ||
                (scope == 2 && s.worldId == scopeId) ||
                (scope == 3 && s.genreId == scopeId)
            ) {
                uint256 uLength = s.users.length;
                for (uint256 j=0;j<uLength;j++) {
                    if (s.users[j] == user) return true;
                }
            }
        }
        return false;
    }

    // Check if all eligible users have voted (only for session proposals)
    function isAllVotesCast(uint256 _proposalId) public view returns (bool) {
        Proposal storage proposal = proposals[_proposalId];
        if (proposal.proposalScope != 1) return false;
        return proposal.totalVotes == sessions[proposal.scopeId].users.length;
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