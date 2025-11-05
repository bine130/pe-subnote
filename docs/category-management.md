# 카테고리 관리 시스템

## 개요
관리자 화면에 별도 메뉴로 카테고리 관리 기능 제공

## 카테고리 구조
- **타입**: 트리 구조 (Tree Structure)
- **Depth**: 무한 레벨 지원
- **관계**: 부모-자식 관계 (Parent-Child)

## 데이터베이스 구조 예시
```sql
categories (
  id: UUID (Primary Key)
  name: VARCHAR
  parent_id: UUID (Foreign Key -> categories.id, nullable)
  order: INTEGER (같은 레벨 내 순서)
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
)
```

## 관리 기능 (CRUD)

### 1. 생성 (Create)
- 루트 카테고리 생성
- 특정 카테고리의 하위 카테고리 생성
- 카테고리명 입력

### 2. 조회 (Read)
- 전체 카테고리 트리 조회
- 특정 카테고리 상세 조회
- 계층 구조 시각화

### 3. 수정 (Update)
- 카테고리명 수정
- 부모 카테고리 변경 (이동)
- 순서 변경 (드래그 앤 드롭)

### 4. 삭제 (Delete)
- 하위 카테고리가 없을 때만 삭제 가능
- 또는 하위 카테고리 포함 전체 삭제 옵션
- 서브노트 연결 확인 후 삭제

## UI/UX 기능

### 트리 뷰
- 접기/펼치기 기능
- 드래그 앤 드롭으로 순서/계층 변경
- 컨텍스트 메뉴 (우클릭)
  - 하위 카테고리 추가
  - 수정
  - 삭제

### 예시 구조
```
📁 정보관리기술사
  📁 데이터베이스
    📄 정규화
    📄 트랜잭션
    📁 NoSQL
      📄 MongoDB
      📄 Redis
  📁 네트워크
    📄 OSI 7계층
    📄 TCP/IP
  📁 보안
    📄 암호화
    📄 인증/인가
```

## 추천 라이브러리
- `react-arborist` - 트리 구조 관리
- `react-dnd` - 드래그 앤 드롭
- `@dnd-kit/core` - 드래그 앤 드롭 (모던한 대안)
- `react-complex-tree` - 복잡한 트리 구조

## 서브노트 연결
- 각 서브노트는 하나의 카테고리에 속함
- 카테고리별 서브노트 목록 조회
- 카테고리 변경 가능
