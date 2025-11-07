-- user_notes 테이블에 필요한 컬럼 추가
-- 기존: id, user_id, topic_id, note_content, created_at, updated_at
-- 추가: position_x, position_y, color

-- position_x 컬럼 추가 (없을 경우)
ALTER TABLE user_notes ADD COLUMN IF NOT EXISTS position_x INTEGER DEFAULT 100;

-- position_y 컬럼 추가 (없을 경우)
ALTER TABLE user_notes ADD COLUMN IF NOT EXISTS position_y INTEGER DEFAULT 100;

-- color 컬럼 추가 (없을 경우)
ALTER TABLE user_notes ADD COLUMN IF NOT EXISTS color VARCHAR(20) DEFAULT 'yellow';
