# 문제 해결 가이드

이 문서는 TRPG DAO NFT 플랫폼에서 발생할 수 있는 일반적인 데이터베이스 및 Prisma 관련 문제를 해결하는 방법을 설명합니다.

## Prisma 관련 오류

### EPERM: operation not permitted 오류

```
Error: EPERM: operation not permitted, rename '...\node_modules\.prisma\client\query_engine-windows.dll.node.tmp...' -> '...\node_modules\.prisma\client\query_engine-windows.dll.node'
```

이 오류는 Windows 환경에서 Prisma 엔진 파일이 다른 프로세스에 의해 잠겨 있을 때 발생합니다.

#### 해결 방법:

1. **다른 Node.js 프로세스 종료**
   - 다른 터미널에서 실행 중인 Node.js 프로세스를 종료하세요.
   - Windows 작업 관리자에서 node.exe 프로세스를 확인하고 종료할 수 있습니다.

2. **데이터베이스 복구 도구 사용**
   ```bash
   npm run db:fix:clean
   # 또는
   npm run db:fix:force
   ```

3. **수동으로 Prisma 파일 정리**
   - node_modules/.prisma 디렉토리 삭제
   - 다시 Prisma 생성 실행:
   ```bash
   cd backend
   npx prisma generate --force
   ```

### Prisma 스키마 변경 적용 오류

Prisma 스키마를 변경한 후 적용되지 않는 경우:

#### 해결 방법:

1. **데이터베이스 스키마 강제 업데이트**
   ```bash
   npm run db:sync:full
   ```

2. **Prisma 클라이언트 재생성**
   ```bash
   cd backend
   npx prisma generate --force
   ```

3. **문제가 지속되는 경우 데이터베이스 초기화 (주의: 모든 데이터 삭제)**
   ```bash
   npm run db:fresh
   ```

## 데이터베이스 연결 오류

### 데이터베이스 연결 실패

데이터베이스 연결이 거부되는 경우:

#### 해결 방법:

1. **.env 파일 확인**
   - `DATABASE_URL` 환경 변수가 올바른지 확인하세요.
   - 예시 형식: `postgresql://username:password@localhost:5432/database_name`

2. **PostgreSQL 서버 실행 여부 확인**
   - PostgreSQL 서비스가 실행 중인지 확인하세요.
   - Windows: 서비스 앱에서 'postgresql' 검색
   - macOS/Linux: `sudo service postgresql status` 또는 `brew services list`

3. **포트 충돌 확인**
   - 기본 PostgreSQL 포트(5432)가 다른 서비스에 의해 사용 중인지 확인하세요.

## 마이그레이션 오류

### 마이그레이션 충돌

여러 개발자가 동시에 작업하거나 브랜치를 전환할 때 마이그레이션 충돌이 발생할 수 있습니다.

#### 해결 방법:

1. **마이그레이션 상태 확인**
   ```bash
   npm run db:status
   ```

2. **데이터베이스 복구 도구 사용**
   ```bash
   npm run db:fix:reset
   ```

3. **마이그레이션 강제 리셋 (주의: 모든 데이터 삭제)**
   ```bash
   cd backend
   npx prisma migrate reset --force
   ```

## 시드 데이터 오류

### 시드 스크립트 실행 오류

시드 데이터 적용 중 오류가 발생하는 경우:

#### 해결 방법:

1. **시드 파일 형식 확인**
   - `backend/src/seed` 디렉토리의 JSON 파일을 확인하세요.

2. **개별 시드 명령 실행**
   ```bash
   npm run db:fix:seed
   ```

3. **개발 환경 다시 설정**
   ```bash
   npm run setup-and-dev
   ```

## 알려진 문제 및 해결 방법

### Windows에서 파일 잠금 문제

Windows에서는 Node.js 프로세스가 종료된 후에도 DLL 파일 잠금이 남아있을 수 있습니다.

**해결 방법**: 컴퓨터를 재부팅하거나 작업 관리자에서 모든 Node.js 관련 프로세스를 종료하세요.

### Prisma Studio 오류

Prisma Studio가 실행되지 않는 경우:

**해결 방법**:
```bash
cd backend
npx prisma generate
npx prisma studio
```

## 모든 방법이 실패한 경우

모든 방법을 시도했지만 문제가 해결되지 않는 경우, 다음 단계를 시도하세요:

1. **전체 node_modules 삭제 및 재설치**
   ```bash
   rm -rf node_modules
   npm install
   ```

2. **임시 파일 수동 정리**
   - Windows: `C:\Users\[유저명]\AppData\Local\Temp` 디렉토리 정리
   - macOS/Linux: `/tmp` 디렉토리 정리

3. **도구 실행**
   ```bash
   npm run db:fix
   ```

4. **데이터베이스 초기화 및 재설정**
   ```bash
   npm run db:fresh-and-dev
   ```

이러한 단계를 수행해도 문제가 해결되지 않으면, 시스템을 재부팅하고 다시 시도하세요. 