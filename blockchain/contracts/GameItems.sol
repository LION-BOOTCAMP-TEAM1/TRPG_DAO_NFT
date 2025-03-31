// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28; 

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GameItems is ERC1155, Ownable {
    address public admin;
    mapping(address => uint256[]) private _ownedTokens; // 소유자가 가진 모든 토큰 ID
    mapping(address => mapping(uint256 => uint256)) private _ownedTokenIndex; // 토큰 ID의 인덱스 저장 (중복 방지)

    constructor() ERC1155("https://violet-eligible-junglefowl-936.mypinata.cloud/ipfs/bafybeicr6hlq6sommzbslgk3o6hhg4ljd4aegu3g6cd747qtqwe4nwjice/{id}.json") Ownable(msg.sender) {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin allowed");
        _;
    }

    function setAdmin(address _addr) public onlyAdmin {
        admin = _addr;
    }

    // 새로운 아이템 민팅
    function mint(address to, uint256 id, uint256 amount) public onlyAdmin {
        _mint(to, id, amount, "");
        _addTokenToOwnerEnumeration(to, id);
    }

    // 관리자만 여러 개 한 번에 발행
    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts) external onlyOwner {
        _mintBatch(to, ids, amounts, "");
        for(uint i = 0; i < ids.length; i++) {
            _addTokenToOwnerEnumeration(to, ids[i]);
        }
    }

    // 소유자가 보유한 모든 아이템 ID 조회
    function getOwnedTokens(address owner) public view returns (uint256[] memory) {
        return _ownedTokens[owner];
    }

    // 소유자별 토큰 ID를 트래킹
    function _addTokenToOwnerEnumeration(address owner, uint256 tokenId) private {
        if (_ownedTokenIndex[owner][tokenId] == 0) {
            _ownedTokenIndex[owner][tokenId] = _ownedTokens[owner].length + 1;
            _ownedTokens[owner].push(tokenId);
        }
    }

    // Transfer 발생시 아래함수 실행하도록
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
