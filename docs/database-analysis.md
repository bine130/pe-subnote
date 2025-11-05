# 기존 데이터베이스 구조 분석

## 발견된 테이블 (11개)

### 1. topics (핵심 콘텐츠)
- **역할**: 서브노트의 메인 테이블로 보임
- **구조**:
  - id (PK)
  - title (제목)
  - category (카테고리 - 문자열)
  - content (본문)
  - created_at, updated_at

**분석**: 이미 우리가 계획한 "서브노트"와 유사한 역할을 하고 있음

### 2. categories (카테고리)
- **역할**: 카테고리 관리 (트리 구조)
- **구조**:
  - id (PK)
  - name (카테고리명)
  - description (설명)
  - parent_id (FK -> categories.id) - 트리 구조 지원
  - created_at

**분석**: 우리가 계획한 트리 구조 카테고리와 정확히 일치!

### 3. templates (템플릿)
- **역할**: 템플릿 관리
- **구조**:
  - id (PK)
  - name (템플릿명)
  - description (설명)
  - content (내용)
  - category (카테고리)
  - created_at, updated_at

**분석**: 우리가 계획한 템플릿 시스템과 거의 일치!

### 4. topic_versions (버전 관리)
- **역할**: topics의 버전 이력 관리
- **구조**:
  - id (PK)
  - topic_id (FK -> topics.id)
  - content (버전 내용)
  - version (버전 번호)
  - changed_by (수정자)
  - change_reason (수정 사유)
  - created_at

**분석**: 우리가 계획한 버전 관리 시스템과 유사!

### 5. keywords (키워드)
- **역할**: topics와 연결된 키워드
- **구조**:
  - id (PK)
  - topic_id (FK -> topics.id)
  - keyword (키워드)

**분석**: 별도 테이블로 관리 (우리는 topics에 배열로 저장 계획했음)

### 6. mnemonics (암기법)
- **역할**: topics와 연결된 암기법
- **구조**:
  - id (PK)
  - topic_id (FK -> topics.id)
  - mnemonic (암기법 약자)
  - full_text (전체 텍스트)

**분석**: 추가 기능 - 암기법 관리

### 7. exam_history (시험 이력)
- **역할**: 토픽별 시험 출제 이력
- **구조**:
  - id (PK)
  - topic_id (FK -> topics.id)
  - exam_round (시험 회차)
  - question_number (문제 번호)
  - score (점수)

**분석**: 시험 관련 기능 - 우리가 계획하지 않은 기능

### 8. weekly_exams (주간 시험)
- **역할**: 주간 시험 관리
- **구조**:
  - id (PK)
  - week_number (주차)
  - category_id (FK -> categories.id)
  - created_at

### 9. exam_questions (시험 문제)
- **역할**: 주간 시험 문제
- **구조**:
  - id (PK)
  - weekly_exam_id (FK -> weekly_exams.id)
  - session (회차)
  - question_number (문제 번호)
  - question_text (문제 내용)
  - question_type (문제 유형)
  - created_at

### 10. assignments (과제)
- **역할**: 과제 관리
- **구조**:
  - id (PK)
  - type (유형)
  - title (제목)
  - description (설명)
  - due_date (마감일)
  - created_at

### 11. submissions (과제 제출)
- **역할**: 과제 제출물 관리
- **구조**:
  - id (PK)
  - assignment_id (FK -> assignments.id)
  - user_id (사용자 ID)
  - file_path (파일 경로)
  - submitted_at (제출 시각)
  - score (점수)
  - feedback (피드백)

---

## 기존 구조와 계획의 비교

### ✅ 이미 존재하는 기능
1. **categories** - 트리 구조 카테고리 (완벽 일치)
2. **templates** - 템플릿 시스템 (거의 일치)
3. **topics** - 서브노트 메인 테이블 (유사)
4. **topic_versions** - 버전 관리 (유사)
5. **keywords** - 키워드 관리 (구조만 다름)

### ⚠️ 조정이 필요한 부분
1. **topics 테이블**
   - category 필드가 문자열 → category_id (FK)로 변경 필요
   - keywords 추가 필요 (또는 keywords 테이블 활용)

2. **topic_versions 테이블**
   - title, keywords, category_id도 버전 관리에 포함 필요
   - 우리 계획에는 전체 필드를 버전 관리

3. **users 테이블 없음**
   - 인증 시스템을 위한 users 테이블 필요
   - Supabase Auth 사용 시 auth.users 사용 가능

### 🆕 추가된 기능 (기존 DB에 있음)
1. **mnemonics** - 암기법 관리
2. **exam_history** - 시험 출제 이력
3. **weekly_exams** - 주간 시험
4. **exam_questions** - 시험 문제
5. **assignments** - 과제 관리
6. **submissions** - 과제 제출

### 📝 추가해야 할 것들
1. **users 테이블** (또는 Supabase Auth 활용)
   - OAuth 연동
   - 기수, 승인 상태 등

2. **topics 테이블 수정**
   - category → category_id (FK)
   - 노션 레벨 마크다운 지원 (JSONB)
   - created_by (FK -> users)

3. **키워드 통합**
   - 현재: keywords 별도 테이블
   - 계획: topics.keywords (배열)
   - 결정 필요: 어느 방식이 좋을까?

---

## 권장 사항

### Option 1: 기존 구조 활용
- topics를 서브노트로 활용
- 기존 테이블 구조 유지하고 필요한 필드만 추가/수정
- keywords 테이블 그대로 사용

**장점**:
- 기존 데이터 보존
- 빠른 개발

**단점**:
- 일부 구조가 우리 계획과 다름

### Option 2: 새로운 구조 생성
- subnotes 테이블 새로 생성
- 우리가 계획한 구조 그대로 구현
- 기존 topics 데이터 마이그레이션

**장점**:
- 깔끔한 구조
- 계획대로 구현

**단점**:
- 마이그레이션 필요
- 시간 소요

### 추천: Hybrid 접근
1. **topics 테이블을 서브노트로 활용**
2. **필요한 필드 추가/수정**:
   - category(varchar) → category_id(FK)
   - created_by 추가
   - content를 JSONB로 변경 (노션 형식)
3. **keywords 테이블 유지** (별도 관리가 나쁘지 않음)
4. **users 테이블 추가** (또는 Supabase Auth 연동)
5. **기존 exam, assignment 테이블 유지** (추가 기능 활용)

---

## 다음 단계

어떤 방향으로 갈까요?
1. 기존 구조 활용하고 필요한 부분만 수정?
2. 완전히 새로운 구조로 시작?
3. Hybrid 방식?
