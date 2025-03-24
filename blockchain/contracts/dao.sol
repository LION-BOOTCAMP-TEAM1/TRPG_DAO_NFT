// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.28;

contract TRPG_DAO {
    address public owner;
    mapping(address => bool) public ruleMasters;

    mapping(uint256 => address[]) public sessions;
    mapping(uint256 => uint256[]) public worlds;
    mapping(uint256 => uint256[]) public genres;


    struct Proposal {
        string description;
        uint256 voteEndTime; // Voting deadline (Unix timestamp)
        uint256[] votes; // Number of votes per option
        uint256 totalVotes; // Total number of voters (unique addresses)
        uint256 proposalScope; // 0: global, 1: session, 2: world, 3: genre
        uint256 scopeId; // ID corresponding to the scope type
        bool active; // Whether voting is still open
    }

    Proposal[] public proposals;
    mapping(uint256 => mapping(address => uint8)) public userVotes; // proposalId => user => selected option

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event RuleMasterAdded(address indexed newRuleMaster);
    event RuleMasterRemoved(address indexed removedRuleMaster);

    event UserJoinedSession(uint256 sessionId, address user);
    event UserLeftSession(uint256 sessionId, address user);
    event SessionAddedToWorld(uint256 worldId, uint256 sessionId);
    event SessionRemovedFromWorld(uint256 worldId, uint256 sessionId);
    event WorldAddedToGenre(uint256 genreId, uint256 worldId);
    event WorldRemovedFromGenre(uint256 genreId, uint256 worldId);

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

    // User joins a session
    function joinSession(uint256 sessionId) public {
        uint256 length = sessions[sessionId].length;
        for (uint256 i=0; i < length; i++) {
            require(sessions[sessionId][i] != msg.sender, "User already in session");
        }

        sessions[sessionId].push(msg.sender);
        emit UserJoinedSession(sessionId, msg.sender);
    }

    // User leaves a session
    function leaveSession(uint sessionId) public {
        address[] storage sessionUsers = sessions[sessionId];
        uint256 length = sessionUsers.length;
        for (uint256 i=0;i<length;i++) {
            if (sessionUsers[i] == msg.sender) {
                sessionUsers[i] = sessionUsers[length -1];
                sessionUsers.pop();
                emit UserLeftSession(sessionId, msg.sender);
                return;
            }
        }
        revert("User not found in session");
    }

    // Assign a session to a world (must not already belong to any world)
    function addSessionToWorld(uint256 worldId, uint256 sessionId) public onlyRuleMaster {
        for (uint256 wid = 0; wid < 10000; wid++) {
            uint256[] storage sids = worlds[wid];
            uint256 length = sids.length;
            for (uint256 i=0;i<length;i++) {
                require(sids[i] != sessionId, "Session already in World");
            }
        }

        worlds[worldId].push(sessionId);
        emit SessionAddedToWorld(worldId, sessionId);
    }

    // Remove a session from a world
    function removeSessionFromWorld(uint256 worldId, uint256 sessionId) public onlyRuleMaster {
        uint256[] storage sessionIds = worlds[worldId];
        uint256 length = sessionIds.length;
        for (uint256 i=0;i<length;i++) {
            if (sessionIds[i] == sessionId) {
                sessionIds[i] = sessionIds[length -1];
                sessionIds.pop();
                emit SessionRemovedFromWorld(worldId, sessionId);
                return;
            }
        }
        revert("Session not found in World");
    }

    // Assign a world to a genre (must not already belong to any genre)
    function addWorldToGenre(uint256 genreId, uint256 worldId) public onlyRuleMaster {
        for (uint256 gid = 0; gid < 10000; gid++) {
            uint256[] storage wids = genres[gid];
            uint256 length = wids.length;
            for (uint256 i=0;i<length;i++) {
                require(wids[i] != worldId, "World already in Genre");
            }
        }

        genres[genreId].push(worldId);
        emit WorldAddedToGenre(genreId, worldId);
    }

    // Remove a world from a genre
    function removeWorldFromGenre(uint256 genreId, uint256 worldId) public onlyRuleMaster {
        uint256[] storage worldIds = genres[genreId];
        uint256 length = worldIds.length;
        for (uint256 i = 0; i < length; i++) {
            if (worldIds[i] == worldId) {
                worldIds[i] = worldIds[length - 1];
                worldIds.pop();
                emit WorldRemovedFromGenre(genreId, worldId);
                return;
            }
        }
        revert("World not found in Genre");
    }

    // Create a new proposal (only Rule Master can execute)
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

    // Vote or change vote on a proposal
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

        if (isAllVotesCast(_proposalId)){
            _closeProposal(_proposalId);
        }

        emit Voted(_proposalId, msg.sender, _option);
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

    // Check if a user is eligible to vote based on the scope of the proposal
    function isEligibleToVote(uint256 scope, uint256 scopeId, address user) public view returns (bool) {
        if (scope == 0) {
            return true;
        } else if (scope == 1) {
            uint256 length = sessions[scopeId].length;
            for (uint256 i=0; i < length; i++) {
                if (sessions[scopeId][i] == user) return true;
            }
        } else if (scope == 2) {
            uint256 length = worlds[scopeId].length;
            for (uint256 i=0; i < length; i++) {
                if (isEligibleToVote(1, worlds[scopeId][i], user)) return true;
            }
        } else if (scope == 3) {
            uint256 length = genres[scopeId].length;
            for (uint256 i=0; i < length; i++) {
                if (isEligibleToVote(2, genres[scopeId][i], user)) return true;
            }
        }
        return false;
    }

    // Check if all token holders have voted
    function isAllVotesCast(uint256 _proposalId) public view returns (bool) {
        Proposal storage proposal = proposals[_proposalId];

        return proposal.totalVotes == getTotalEligibleVoters(proposal.proposalScope, proposal.scopeId);
    }

    // Calculate total number of users eligible to vote based on scope
    function getTotalEligibleVoters(uint256 scope, uint256 scopeId) public view returns (uint256) {
        uint256 total = 0;
        if (scope == 0) {
            for (uint256 sid = 0; sid < 10000; sid++) {
                total += sessions[sid].length;
            }
        } else if (scope == 1) {
            total = sessions[scopeId].length;
        } else if (scope == 2) {
            uint256[] memory sessionIds = worlds[scopeId];
            uint256 length = sessionIds.length;
            for (uint256 i=0;i<length;i++) {
                total += sessions[sessionIds[i]].length;
            }
        } else if (scope == 3) {
            uint256[] memory worldIds = genres[scopeId];
            uint256 wLength = worldIds.length;
            for (uint256 i=0;i<wLength;i++) {
                uint256[] memory sessionIds = worlds[worldIds[i]];
                uint256 sLength = sessionIds.length;
                for (uint256 j=0;j<sLength;j++) {
                    total += sessions[sessionIds[j]].length;
                }
            }
        }
        return total;
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