# PE Subnote - 기술사 서브노트 관리 시스템

기술사 시험 준비를 위한 서브노트 관리 및 조회 시스템

## 프로젝트 구조

```
pe-subnote/
├── frontend/
│   ├── student-app/    # 수강생용 PWA
│   └── admin-app/      # 관리자용 웹
├── backend/            # FastAPI 백엔드
└── docs/              # 문서
```

## 기술 스택

### Frontend
- React 18 + TypeScript
- Vite
- TanStack Query
- Tailwind CSS
- PWA

### Backend
- FastAPI
- SQLAlchemy
- PostgreSQL (Supabase)

### 배포
- Frontend: Vercel
- Backend: Render
- Database: Supabase

## 시작하기

### Backend 설정

```bash
cd backend

# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# .env 파일 생성
cp .env.example .env
# .env 파일 편집하여 환경 변수 설정

# 서버 실행
uvicorn app.main:app --reload --port 8000
```

### Frontend - Student App (수강생용 PWA)

```bash
cd frontend/student-app

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### Frontend - Admin App (관리자용)

```bash
cd frontend/admin-app

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

## 주요 기능

- ✅ OAuth 인증 (Google, Apple)
- ✅ 노션 레벨 마크다운 에디터
- ✅ 트리 구조 카테고리 관리
- ✅ 템플릿 시스템
- ✅ 버전 관리 (수정 이력, 비교, 복구)
- ✅ 키워드 관리
- 🔄 검색 및 필터링
- 🔄 PWA (오프라인 지원)

## 문서

자세한 문서는 `docs/` 폴더를 참고하세요:

- [요구사항](docs/requirements.md)
- [기술 스택](docs/tech-stack.md)
- [인증 프로세스](docs/authentication-flow.md)
- [카테고리 관리](docs/category-management.md)
- [템플릿 관리](docs/template-management.md)
- [버전 관리](docs/version-control.md)
- [데이터베이스 분석](docs/database-analysis.md)
- [데이터베이스 마이그레이션](docs/database-migration.md)

## 라이선스

MIT
