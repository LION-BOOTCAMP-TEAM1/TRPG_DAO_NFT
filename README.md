변경

# 프로젝트 개요

TRPG (Tabletop Role-Playing Game)를 블록체인과 결합하여 NFT와 DAO 기반의 커뮤니티 중심 스토리 진행을 구현하는 시스템. 주요 분기점에서 DAO 투표를 활용하고, 완결된 스토리를 기반으로 NFT를 발행하여 플레이어들의 선택을 기록하고 보상하는 구조.

## 기술 스택

- 블록체인: Ethereum, Solidity, Remix
- 프론트엔드: React, Next, Tailwind, Web3.js, ethers,
- 백엔드: Node.js

## 주요 기능

🎭 정해진 스토리 라인을 활용한 TRPG 진행초기에는 AI 모델 없이 사전 설정된 TRPG 스토리라인을 사용하여 진행

- 스토리 분기점에서 DAO 투표를 활용하여 다음 진행 방향 결정
- 정해진 룰에 따라 NPC 반응 및 이벤트 발생 설정

🏰 DAO 기반 스토리 분기점주요 선택지마다 DAO 투표 진행하여 집단 지성 반영

- 온체인 투표 결과를 기반으로 스토리가 동적으로 변화
- 플레이어들이 직접 게임 세계의 운명을 결정

🎲 NFT 보상 시스템게임 완결 후 플레이어 선택 기록을 바탕으로 스토리 NFT 발행

- 특정 이벤트(전투 승리, 희귀 아이템 획득) 시 특별 NFT 지급
- NFT 소유 여부에 따라 후속 캠페인에서 보너스 제공

🎮 Web3 연동 & 온체인 데이터 기록모든 선택지를 온체인에 기록하여 공식적인 게임 히스토리 저장

- NFT를 통한 플레이어 인증 & 특별 권한 부여
- 스마트 컨트랙트를 활용한 자동화된 보상 지급 시스템
