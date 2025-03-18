# Backend Setup Guide

프로젝트 초기 설정팀원이 로컬 환경에서 백엔드를 실행할 수 있도록 설정하는 가이드입니다.

---

## 1. 프로젝트 초기 설정

### 1.1. 저장소 클론 및 브랜치 설정

```bash
git clone <repository_url>
cd backend
git checkout feature/db-setup
```

## 2. 환경 변수 설정

팀원마다 다른 환경을 사용할 수 있도록 .env 파일을 설정합니다.

### 2.1. 환경 변수 예제 파일 생성

```bash
touch .env.example
```

`.env.example` 파일 내용:
```env
# 공통 환경 변수
NODE_ENV=development
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/trpg"
```

### 2.2. .env 파일 생성 및 수정

```bash
cp .env.example .env
```

이제 .env 파일을 열고 자신의 환경에 맞게 설정하세요:
```env
DATABASE_URL="postgresql://my_user:my_password@localhost:5432/my_database"
```

### 2.3. .gitignore에 .env 추가

환경 변수가 노출되지 않도록 .env를 Git에 포함하지 않습니다.

```bash
echo ".env" >> .gitignore
```

## 3. 패키지 설치 및 데이터베이스 마이그레이션

### 3.1. 패키지 설치

```bash
npm install
```

### 3.2. 데이터베이스 마이그레이션 실행

```bash
npx prisma migrate dev --name init
```

## 4. 서버 실행 및 API 테스트

### 4.1. 서버 실행
```bash
npm run dev
```
✅ 서버가 정상적으로 실행되면 다음과 같은 메시지가 출력됩니다:
```
🚀 Server running on http://localhost:5000/api
📡 Connected to database: postgresql://postgres@localhost:5432/trpg
```

### 4.2. API 테스트

**사용자 생성 (`POST /api/users`)**
```bash
curl -X POST http://localhost:5000/api/users \
-H "Content-Type: application/json" \
-d '{"wallet": "0x123456789abcdef"}'
```

**사용자 목록 조회 (`GET /api/users`)**
```bash
curl -X GET http://localhost:5000/api/users
```

✅ 정상적인 응답 예시:
```json
[
  {
    "id": 1,
    "wallet": "0x123456789abcdef",
    "createdAt": "2025-03-18T12:34:56.000Z"
  }
]
```

## 5. 실행 요약

팀원이 해야 할 작업:

1. `git pull origin main` (최신 코드 가져오기)
2. `.env.example`을 `.env`로 복사 (`cp .env.example .env`)
3. `.env` 파일을 자신의 DB 환경에 맞게 수정
4. `npm install` (패키지 설치)
5. `npx prisma migrate dev --name init` (DB 설정)
6. `npm run dev` (백엔드 실행)
7. `curl` 또는 Postman으로 API 테스트 실행

## 6. 추가 설정 및 문제 해결

### 6.1. PostgreSQL이 실행되지 않는 경우

```bash
# macOS
brew services restart postgresql

# Ubuntu/Debian
sudo systemctl restart postgresql
```

### 6.2. postgres 유저가 없을 경우

```bash
createuser -s postgres
psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'your_secure_password';"
createdb trpg
```

이제 백엔드 설정이 완료되었습니다! 🚀
