-- topics 테이블에 importance_level 컬럼 추가
ALTER TABLE topics ADD COLUMN IF NOT EXISTS importance_level INTEGER DEFAULT 3;

-- 1~5 범위 제약 추가
ALTER TABLE topics ADD CONSTRAINT check_importance_level CHECK (importance_level >= 1 AND importance_level <= 5);
