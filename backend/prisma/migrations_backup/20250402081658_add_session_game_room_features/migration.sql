/*
  Warnings:

  - Added the required column `gameMasterId` to the `Session` table without a default value. This is not possible if the table is not empty.

*/
-- 먼저 Enum 값들을 추가합니다 (한 번에 하나씩)
ALTER TYPE "SessionStatus" ADD VALUE IF NOT EXISTS 'WAITING_FOR_PLAYERS';

-- 트랜잭션을 커밋하여 첫 번째 값을 안전하게 적용합니다
COMMIT;
BEGIN;

ALTER TYPE "SessionStatus" ADD VALUE IF NOT EXISTS 'IN_PROGRESS';

-- 트랜잭션을 커밋하여 두 번째 값을 안전하게 적용합니다
COMMIT;
BEGIN;

ALTER TYPE "SessionStatus" ADD VALUE IF NOT EXISTS 'COMPLETED';

-- 트랜잭션을 커밋하여 세 번째 값을 안전하게 적용합니다
COMMIT;
BEGIN;

ALTER TYPE "SessionStatus" ADD VALUE IF NOT EXISTS 'PAUSED';

-- AlterTable - 먼저 필수가 아닌 필드를 추가합니다
ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "description" TEXT,
ADD COLUMN IF NOT EXISTS "maxPlayers" INTEGER NOT NULL DEFAULT 6,
ADD COLUMN IF NOT EXISTS "minPlayers" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN IF NOT EXISTS "status" "SessionStatus" NOT NULL DEFAULT 'WAITING_FOR_PLAYERS';

-- 마지막으로 필수 필드 추가합니다
-- 세션 테이블에 데이터가 있다면 임시 값을 사용하도록 설정
DO $$
BEGIN
  -- 세션 테이블이 비어 있지 않으면 임시 사용자 ID 설정
  IF EXISTS (SELECT 1 FROM "Session") THEN
    -- 첫 번째 사용자를 찾아 모든 세션의 게임마스터로 설정
    DECLARE
      default_user_id INTEGER;
    BEGIN
      -- 임시로 첫 번째 사용자 ID 가져옴
      SELECT id INTO default_user_id FROM "User" LIMIT 1;
      
      -- 사용자가 없으면 새로 생성
      IF default_user_id IS NULL THEN
        INSERT INTO "User" ("walletAddress", "nonce") 
        VALUES ('0x0000000000000000000000000000000000000001', 'temp-nonce') 
        RETURNING id INTO default_user_id;
      END IF;
      
      -- gameMasterId 컬럼 추가 및 기본값 설정
      ALTER TABLE "Session" ADD COLUMN "gameMasterId" INTEGER NOT NULL DEFAULT default_user_id;
      
      -- 기본값 제약 제거
      ALTER TABLE "Session" ALTER COLUMN "gameMasterId" DROP DEFAULT;
    END;
  ELSE
    -- 세션 테이블이 비어있다면 그냥 컬럼 추가
    ALTER TABLE "Session" ADD COLUMN "gameMasterId" INTEGER NOT NULL;
  END IF;
END $$;

-- 외래 키 제약 조건 추가
ALTER TABLE "Session" ADD CONSTRAINT "Session_gameMasterId_fkey" FOREIGN KEY ("gameMasterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
