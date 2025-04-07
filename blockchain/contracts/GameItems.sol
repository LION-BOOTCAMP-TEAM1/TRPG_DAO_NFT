// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GameItems is ERC1155, Ownable {
    // 게임 관리 계정
    address admin;
    modifier adminOnly() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }
    function setAdmin(address addr) public onlyOwner {
        admin = addr;
    }

    // 새로운 토큰 관리
    mapping(uint256 => string) private customURIs;
    function setCustomURI(uint256 tokenId, string memory ipfsURI) external {
        customURIs[tokenId] = ipfsURI;
    }

    function uri(uint256 tokenId) public view override returns (string memory) {
        if (bytes(customURIs[tokenId]).length > 0) {
            return customURIs[tokenId];
        }
        return string(abi.encodePacked(super.uri(tokenId)));
    }

    // 소유자가 가진 모든 토큰 조회
    mapping(address => uint256[]) private _ownedTokens;
    mapping(address => mapping(uint256 => uint256)) private _ownedTokenIndex;
    
    // 등록된 게임 아이템
    uint256[] private existingTokenIds;
    mapping(uint256 => bool) private existingTokenIdMap;

    // Mint 비용
    uint256 public mintPrice = 0.01 ether;

    constructor()
    ERC1155("https://violet-eligible-junglefowl-936.mypinata.cloud/ipfs/bafybeie3imjcrijt5hc5gzdtzijg4b62jsv3wkntytg7laaojtzpdpgyle/{id}.json")
    Ownable(msg.sender)
    {
        admin = msg.sender;
        for (uint i = 0; i < 91; i++){
            addTokenId(i);
        }
    }

    function addTokenId(uint256 id) public onlyOwner {
        if(!existingTokenIdMap[id]) {
            existingTokenIds.push(id);
            existingTokenIdMap[id] = true;
        }
    }

    // 랜덤 민팅 (기존 토큰 중 하나)
    event  minted(address indexed user, uint256 tokenId);
    function mintRandom(address addr) external payable {
        require(msg.value >= mintPrice, "Not enough ETH");
        require(existingTokenIds.length > 0, "No tokens available");

        // 랜덤 인덱스 뽑기
        uint256 randIndex = uint256(keccak256(abi.encodePacked(block.timestamp, addr))) % existingTokenIds.length;
        uint256 tokenId = existingTokenIds[randIndex];

        // 유저에게 해당 ID 민팅
        _mint(addr, tokenId, 1, "");
        _addTokenToOwnerEnumeration(addr, tokenId);

        // 환불 처리: mintPrice 초과분 반환
        uint256 refund = msg.value - mintPrice;
        if (refund > 0) {
            (bool success, ) = addr.call{value: refund}("");
            require(success, "Refund failed");
        }

        emit minted(addr, tokenId); // 반환값 이벤트로 emit
    }

    function mintByID(address addr, uint256 tokenID) external adminOnly {
        require(existingTokenIdMap[tokenID], "No tokens available");

        // 유저에게 해당 ID 민팅
        _mint(addr, tokenID, 1, "");
        _addTokenToOwnerEnumeration(addr, tokenID);

        emit minted(addr, tokenID); // 반환값 이벤트로 emit
    }

    // 수익 인출
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    // 소유자가 보유한 모든 아이템 ID 조회
    function getOwnedTokens(address owner) public view returns (uint256[] memory) {
        return _ownedTokens[owner];
    }

    // 마켓플레이스 컨트랙트에서 거래 진행시 발생
    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public override {
        super.safeTransferFrom(from, to, id, amount, data);

        // amount가 0이 아니어야 의미 있음
        if (amount > 0) {
            _removeTokenFromOwnerEnumeration(from, id);
            _addTokenToOwnerEnumeration(to, id);
        }
    }


    // 소유자별 토큰 ID를 트래킹
    function _addTokenToOwnerEnumeration(address owner, uint256 tokenId) private {
        if (_ownedTokenIndex[owner][tokenId] == 0) {
            _ownedTokenIndex[owner][tokenId] = _ownedTokens[owner].length + 1;
            _ownedTokens[owner].push(tokenId);
        }
    }

    // 소유자가 더 이상 토큰을 보유하지 않으면 제거
    function _removeTokenFromOwnerEnumeration(address owner, uint256 tokenId) private {
        if (balanceOf(owner, tokenId) == 0) {
            uint256 lastTokenIndex = _ownedTokens[owner].length - 1;
            uint256 tokenIndex = _ownedTokenIndex[owner][tokenId] - 1; // 저장된 인덱스는 1-based

            if (tokenIndex != lastTokenIndex) {
                uint256 lastTokenId = _ownedTokens[owner][lastTokenIndex];
                _ownedTokens[owner][tokenIndex] = lastTokenId;
                _ownedTokenIndex[owner][lastTokenId] = tokenIndex + 1;
            }

            _ownedTokens[owner].pop();
            delete _ownedTokenIndex[owner][tokenId];
        }
    }
}
