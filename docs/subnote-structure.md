# 서브노트 구조

## 에디터 요구사항
- **타입**: 노션 레벨 마크다운 에디터
- **저장 방식**: 수동 저장 (실시간 자동 저장 X)
- **관리자 화면에서만** 편집 가능

## 지원 기능
1. **리치 텍스트 편집**
   - 볼드, 이탤릭, 밑줄, 취소선
   - 제목 (H1 ~ H6)
   - 리스트 (순서/비순서)
   - 인용구
   - 링크

2. **마크다운 문법**
   - 노션 스타일 마크다운 지원
   - `/` 명령어로 블록 추가
   - 실시간 마크다운 렌더링

3. **코드 블록**
   - 문법 강조 (Syntax Highlighting)
   - 다양한 언어 지원

4. **표 (Table)**
   - 마크다운 표 작성
   - 행/열 추가/삭제
   - 셀 병합 (선택사항)
   - 정렬 옵션 (좌측/중앙/우측)
   - `/table` 명령어로 삽입

5. **이미지**
   - 이미지 삽입 가능
   - 드래그 앤 드롭 지원
   - 이미지 저장소: TBD (Supabase Storage 예정)

## 추천 라이브러리
- **Notion-style 에디터**:
  - `novel` (https://novel.sh) - Notion 스타일 에디터
  - `tiptap` - 확장 가능한 리치 텍스트 에디터 (표 지원)
  - `blocknote` - Notion-like 블록 에디터
- **표 기능 확장**:
  - `@tiptap/extension-table` - Tiptap 표 확장
  - `@tiptap/extension-table-row`
  - `@tiptap/extension-table-cell`
  - `@tiptap/extension-table-header`

## 서브노트 데이터 구조

### 데이터베이스 스키마 예시
```sql
subnotes (
  id: UUID (Primary Key)
  title: VARCHAR (제목)
  keywords: TEXT[] (키워드 배열)
  content: JSONB/TEXT (본문 내용)
  category_id: UUID (Foreign Key -> categories.id)
  created_by: UUID (Foreign Key -> users.id)
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
)
```

### 필드 설명
1. **제목 (Title)**
   - 필수 필드
   - 서브노트 제목

2. **키워드 (Keywords)**
   - 선택 필드
   - 태그 형태로 입력
   - 여러 개 입력 가능
   - 검색 및 필터링에 활용
   - 자동 완성 기능 (기존 키워드 제안)

3. **본문 (Content)**
   - 노션 레벨 마크다운 형식
   - JSON 또는 텍스트로 저장

4. **카테고리 (Category)**
   - 필수 필드
   - 트리 구조 카테고리 중 선택

## 데이터 저장 형식
- **저장**: JSON 형태 또는 마크다운 텍스트
- **렌더링**: 수강생 화면에서 읽기 전용으로 렌더링

## 키워드 UI/UX
- **입력 방식**: 태그 입력 컴포넌트
- **기능**:
  - 엔터 또는 쉼표로 키워드 추가
  - X 버튼으로 키워드 삭제
  - 기존 키워드 자동 완성
  - 키워드 클릭 시 관련 서브노트 필터링

## 추천 라이브러리 (키워드)
- `react-tag-input` - 태그 입력 컴포넌트
- `react-tagsinput` - 간단한 태그 입력
- `@chakra-ui/tag` - Chakra UI 태그 컴포넌트
