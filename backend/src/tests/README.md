# 블록체인 테스트 가이드

이 디렉토리에는 블록체인 연결 및 기능을 테스트하기 위한 스크립트들이 포함되어 있습니다.

## 준비 사항

테스트를 실행하기 전에 다음 준비가 필요합니다:

1. 프로젝트 루트에 `.env` 파일을 생성하고 필요한 환경 변수 설정 (`.env.example` 참조)
2. 필요한 패키지 설치: `npm install`

## 테스트 파일 목록

각 테스트 파일은 특정 블록체인 기능을 검증합니다:

1. **blockchainTest.ts**: 기본 블록체인 연결 테스트
2. **eventListenerTest.ts**: 이벤트 리스너 테스트
3. **syncTest.ts**: 블록체인 데이터 동기화 테스트
4. **transactionTest.ts**: DAO 제안 생성 트랜잭션 테스트
5. **nftMintTest.ts**: NFT 민팅 트랜잭션 테스트

## 테스트 실행 방법

각 테스트는 다음 명령으로 실행할 수 있습니다:

```bash
# 프로젝트 루트 디렉토리에서
npx ts-node backend/src/tests/blockchainTest.ts
npx ts-node backend/src/tests/eventListenerTest.ts
npx ts-node backend/src/tests/syncTest.ts
npx ts-node backend/src/tests/transactionTest.ts
npx ts-node backend/src/tests/nftMintTest.ts

# 또는 tests 디렉토리에서
cd backend/src/tests
npx ts-node blockchainTest.ts
```

## 테스트 순서

블록체인 연결을 테스트할 때는 다음 순서로 진행하는 것이 좋습니다:

1. 먼저 **blockchainTest.ts**를 실행하여 기본 연결이 되는지 확인
2. **eventListenerTest.ts**를 실행하여 이벤트 리스너가 제대로 작동하는지 테스트
3. **syncTest.ts**를 실행하여 과거 이벤트 동기화가 제대로 되는지 확인
4. **transactionTest.ts**와 **nftMintTest.ts**를 실행하여 트랜잭션 전송 테스트

## 참고 사항

- 트랜잭션 테스트는 실제 블록체인에 트랜잭션을 전송하므로 주의가 필요합니다.
- 테스트넷(Sepolia, Goerli 등)에서 테스트하는 것을 권장합니다.
- 트랜잭션 테스트에는 가스비(ETH)가 필요합니다. 테스트넷의 경우 Faucet에서 테스트 ETH를 받을 수 있습니다.
- 개인키는 절대 공개 저장소에 커밋하지 마세요. 항상 `.env` 파일을 `.gitignore`에 포함시키세요. 