-- 임시 slug 값을 설정하는 함수를 사용하여 NULL slug를 처리합니다
DO $$
DECLARE
  session_rec RECORD;
  new_slug TEXT;
BEGIN
  -- slug가 NULL인 모든 세션에 대해 반복
  FOR session_rec IN SELECT id, name FROM "Session" WHERE slug IS NULL
  LOOP
    -- 임시 slug 값 생성 (이름 + 랜덤 문자열)
    new_slug := LOWER(REPLACE(session_rec.name, ' ', '-')) || '-' || substr(md5(random()::text), 1, 6);
    
    -- slug 업데이트
    UPDATE "Session" SET slug = new_slug WHERE id = session_rec.id;
  END LOOP;
END $$;

-- slug 필드를 NOT NULL로 변경
ALTER TABLE "Session" ALTER COLUMN "slug" SET NOT NULL; 