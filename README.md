# TRPG DAO NFT 프로젝트 실행 방법

프로젝트를 직접 실행해보기 전에, 먼저 실행 방법에 대해 이해해보는 것이 좋을 것 같습니다. 패키지 구조를 살펴보고 어떻게 실행하면 좋을지 생각해볼까요?

## 프로젝트 구조

이 프로젝트는 모노레포 구조로 되어 있어, 다음과 같은 세 개의 폴더로 구성되어 있습니다:

- `frontend`: 프론트엔드 애플리케이션
- `backend`: 백엔드 서버
- `blockchain`: 블록체인 관련 코드

## 실행 방법

### 1. 프로젝트 설치

먼저 의존성 패키지를 설치해야 합니다:

```bash
npm install
```

### 2. 백엔드 데이터베이스 설정 (필요한 경우)

백엔드에서 Prisma를 사용하고 있다면, 데이터베이스를 설정해야 합니다:

```bash
npm run prisma:generate  # Prisma 클라이언트 생성
npm run prisma:migrate   # 데이터베이스 마이그레이션 실행
```

필요한 경우 Prisma Studio를 통해 데이터베이스를 확인할 수 있습니다:

```bash
npm run prisma:studio
```

### 3. 개발 서버 실행

전체 개발 환경(프론트엔드 + 백엔드)을 한 번에 실행하는 명령어:

```bash
npm run dev
```

또는 개별적으로 실행할 수도 있습니다:

```bash
# 프론트엔드만 실행
npm run frontend

# 백엔드만 실행
npm run backend
```

### 4. 빌드 및 프로덕션 실행

프로덕션 환경을 위한 빌드:

```bash
npm run build
```

빌드된 프론트엔드 실행:

```bash
npm start
```

