# 데이터베이스 마이그레이션 계획 (Hybrid 방식)

## 전략
기존 테이블을 최대한 활용하되, 우리가 계획한 기능을 위해 필요한 부분만 수정

---

## 1. users 테이블 생성 (신규)

### 목적
- OAuth 인증 (Google, Apple)
- 사용자 정보 및 승인 관리

### SQL
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  cohort INTEGER NOT NULL,  -- 기수
  oauth_provider VARCHAR(20) NOT NULL,  -- 'google' or 'apple'
  oauth_id VARCHAR(255) NOT NULL,  -- OAuth provider의 user ID
  role VARCHAR(20) DEFAULT 'student',  -- 'student' or 'admin'
  approval_status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'approved', 'rejected'
  approved_by UUID REFERENCES users(id),  -- 승인한 관리자
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(oauth_provider, oauth_id)
);

-- 인덱스
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_approval_status ON users(approval_status);
CREATE INDEX idx_users_role ON users(role);
```

---

## 2. topics 테이블 수정

### 현재 구조
```sql
topics (
  id: integer (PK)
  title: varchar(200)
  category: varchar(100)  -- ⚠️ 문제: 문자열
  content: text
  created_at, updated_at
)
```

### 필요한 변경사항

#### 2-1. category_id 컬럼 추가 (FK)
```sql
-- 1단계: category_id 컬럼 추가
ALTER TABLE topics
ADD COLUMN category_id INTEGER REFERENCES categories(id);

-- 2단계: 기존 category 문자열 데이터를 category_id로 마이그레이션
-- (이 부분은 기존 데이터 확인 후 수동으로 매핑 필요)
-- 예시:
-- UPDATE topics SET category_id = (SELECT id FROM categories WHERE name = topics.category);

-- 3단계: category_id를 NOT NULL로 변경 (데이터 마이그레이션 완료 후)
-- ALTER TABLE topics ALTER COLUMN category_id SET NOT NULL;

-- 4단계: 기존 category 컬럼 삭제 (선택사항, 나중에)
-- ALTER TABLE topics DROP COLUMN category;
```

#### 2-2. created_by 컬럼 추가
```sql
-- 작성자 추적
ALTER TABLE topics
ADD COLUMN created_by UUID REFERENCES users(id);

-- 기존 데이터는 NULL 허용 또는 기본 관리자 ID 설정
```

#### 2-3. content 타입 변경 (TEXT → JSONB)
```sql
-- 노션 레벨 마크다운을 JSON 형식으로 저장하기 위해
-- 주의: 기존 데이터 마이그레이션 필요

-- 1단계: content_json 컬럼 추가
ALTER TABLE topics
ADD COLUMN content_json JSONB;

-- 2단계: 기존 text 데이터를 JSON으로 변환
-- UPDATE topics SET content_json = jsonb_build_object('text', content);

-- 3단계: 마이그레이션 완료 후
-- ALTER TABLE topics DROP COLUMN content;
-- ALTER TABLE topics RENAME COLUMN content_json TO content;
```

**또는 간단하게**:
```sql
-- content를 그냥 TEXT로 유지하고, JSON 문자열로 저장
-- (이게 더 간단할 수 있음)
```

#### 2-4. 기타 유용한 컬럼 추가
```sql
-- 공개/비공개 설정
ALTER TABLE topics
ADD COLUMN is_published BOOLEAN DEFAULT true;

-- 조회수
ALTER TABLE topics
ADD COLUMN view_count INTEGER DEFAULT 0;

-- 정렬 순서
ALTER TABLE topics
ADD COLUMN order_index INTEGER DEFAULT 0;
```

---

## 3. topic_versions 테이블 수정

### 현재 구조
```sql
topic_versions (
  id, topic_id, content, version,
  changed_by, change_reason, created_at
)
```

### 필요한 변경사항

```sql
-- title도 버전 관리에 포함
ALTER TABLE topic_versions
ADD COLUMN title VARCHAR(200);

-- category_id도 버전 관리에 포함
ALTER TABLE topic_versions
ADD COLUMN category_id INTEGER REFERENCES categories(id);

-- keywords 버전 관리 (배열 또는 JSON)
ALTER TABLE topic_versions
ADD COLUMN keywords TEXT[];

-- content를 JSONB로 (선택사항)
-- ALTER TABLE topic_versions ADD COLUMN content_json JSONB;
```

---

## 4. templates 테이블 수정

### 현재 구조는 거의 완벽하지만 추가하면 좋은 것들

```sql
-- 작성자 추적
ALTER TABLE templates
ADD COLUMN created_by UUID REFERENCES users(id);

-- content를 JSONB로 변경 (선택사항)
-- 현재 TEXT로도 충분할 수 있음
```

---

## 5. categories 테이블 수정

### 현재 구조는 완벽! 추가할 것들:

```sql
-- 정렬 순서 (같은 레벨에서의 순서)
ALTER TABLE categories
ADD COLUMN order_index INTEGER DEFAULT 0;

-- 아이콘 또는 색상 (선택사항)
ALTER TABLE categories
ADD COLUMN icon VARCHAR(50);

ALTER TABLE categories
ADD COLUMN color VARCHAR(20);

-- 인덱스
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_order_index ON categories(order_index);
```

---

## 6. keywords 테이블 - 그대로 유지

현재 구조가 좋습니다. 별도 테이블로 관리하는 것이 검색/필터링에 유리합니다.

```sql
-- 인덱스만 추가
CREATE INDEX idx_keywords_topic_id ON keywords(topic_id);
CREATE INDEX idx_keywords_keyword ON keywords(keyword);
```

---

## 7. 새 테이블 추가: user_progress (선택사항)

### 목적
수강생의 학습 진행도 추적

```sql
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT false,
  is_bookmarked BOOLEAN DEFAULT false,
  last_viewed_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, topic_id)
);

CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_topic_id ON user_progress(topic_id);
CREATE INDEX idx_user_progress_completed ON user_progress(is_completed);
CREATE INDEX idx_user_progress_bookmarked ON user_progress(is_bookmarked);
```

---

## 8. 새 테이블 추가: user_notes (선택사항)

### 목적
수강생의 개인 메모

```sql
CREATE TABLE user_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  note_content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, topic_id)
);

CREATE INDEX idx_user_notes_user_id ON user_notes(user_id);
CREATE INDEX idx_user_notes_topic_id ON user_notes(topic_id);
```

---

## 마이그레이션 순서 (우선순위)

### Phase 1: 필수 (지금 바로)
1. ✅ **users 테이블 생성**
2. ✅ **topics 테이블에 category_id 추가**
3. ✅ **topics 테이블에 created_by 추가**
4. ✅ **categories 테이블에 order_index 추가**
5. ✅ **필요한 인덱스 추가**

### Phase 2: 중요 (초기 개발 중)
6. **topic_versions 테이블 확장** (title, category_id, keywords 추가)
7. **templates 테이블에 created_by 추가**
8. **topics의 기존 category 데이터를 category_id로 마이그레이션**

### Phase 3: 추가 기능 (나중에)
9. user_progress 테이블 생성
10. user_notes 테이블 생성
11. topics content를 JSONB로 변경 (필요시)

---

## 다음 단계

위의 Phase 1 SQL 쿼리들을 복사해서 Supabase SQL Editor에서 실행하시면 됩니다!

각 쿼리를 하나씩 실행하고 결과를 확인하는 게 안전합니다.

준비되셨나요?
