-- AddColumnToSession
ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "slug" TEXT;

-- AddUniqueConstraint for Session slug
ALTER TABLE "Session" ADD CONSTRAINT "Session_slug_key" UNIQUE ("slug");

-- 마이그레이션 이력에 PAUSED 상태가 있다면 제거합니다
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_type 
    WHERE typname = 'sessionstatus' 
    AND EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumtypid = pg_type.oid 
        AND enumlabel = 'PAUSED'
    )
  ) THEN
    -- 기존 PAUSED 값이 사용된 레코드가 있는지 확인
    IF NOT EXISTS (
      SELECT 1 FROM "Session" WHERE "status" = 'PAUSED'::text::"SessionStatus"
    ) THEN
      -- PAUSED 열거형 값 제거를 위한 작업 (PostgreSQL 12 이상에서 가능)
      -- 실제 열거형 값 제거는 PostgreSQL 14 이상에서만 가능하므로 참고용입니다.
      -- ALTER TYPE "SessionStatus" DROP VALUE 'PAUSED';
      -- 대신 상태를 IDLE로 변경하는 쿼리를 실행합니다
      -- UPDATE "Session" SET "status" = 'IDLE' WHERE "status" = 'PAUSED';
      RAISE NOTICE 'PAUSED 상태는 제거하지 않고 남겨둡니다. PostgreSQL 14 이상에서만 enum 값 제거가 가능합니다.';
    END IF;
  END IF;
END $$; 