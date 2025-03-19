// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28; 

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GameItems is ERC1155, Ownable {
    mapping(address => uint256[]) private _ownedTokens; // 소유자가 가진 모든 토큰 ID
     mapping(address => mapping(uint256 => uint256)) private _ownedTokenIndex; // 토큰 ID의 인덱스 저장 (중복 방지)
    mapping(uint256 => string) private _tokenURIs;
    mapping(uint256 => uint256) private _totalSupply;

    constructor() ERC1155("") Ownable(msg.sender) {}

    // 새로운 아이템 민팅
    function mint(address to, uint256 id, uint256 amount, string memory metadataURI) public onlyOwner {
        _mint(to, id, amount, "");
        _tokenURIs[id] = metadataURI;
        _addTokenToOwnerEnumeration(to, id);
        _totalSupply[id] += amount;
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

    function totalSupply(uint256 id) public view returns (uint256) {
        return _totalSupply[id];
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
