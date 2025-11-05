# 개발 가이드

## 개발 환경 설정

### 사전 요구사항
- Node.js 18+
- Python 3.11+
- Git
- Supabase 계정

## 로컬 개발 환경 설정

### 1. 저장소 클론
```bash
git clone <repository-url>
cd pe-subnote
```

### 2. Backend 설정

#### 가상환경 생성
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

#### 의존성 설치
```bash
pip install -r requirements.txt
```

#### 환경 변수 설정
```bash
cp .env.example .env
```

`.env` 파일을 열어 다음 값들을 설정:
```env
DATABASE_URL=postgresql://postgres.bxfqjnokvzdvomuzsupz:dlwpdnjs!004@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres
SUPABASE_URL=https://bxfqjnokvzdvomuzsupz.supabase.co
SUPABASE_KEY=your-anon-key

SECRET_KEY=your-super-secret-key-change-this
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
```

#### 서버 실행
```bash
uvicorn app.main:app --reload --port 8000
```

API 문서는 `http://localhost:8000/docs` 에서 확인 가능

### 3. Frontend - Student App (수강생용 PWA)

```bash
cd frontend/student-app
npm install
npm run dev
```

개발 서버: `http://localhost:5173`

### 4. Frontend - Admin App (관리자용)

```bash
cd frontend/admin-app
npm install
npm run dev
```

개발 서버: `http://localhost:5174`

## 개발 워크플로우

### Backend 개발

#### 1. 모델 추가 (models/)
```python
# app/models/topic.py
from sqlalchemy import Column, Integer, String, Text, ForeignKey, TIMESTAMP
from app.core.database import Base

class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text)
    category_id = Column(Integer, ForeignKey("categories.id"))
    # ...
```

#### 2. 스키마 추가 (schemas/)
```python
# app/schemas/topic.py
from pydantic import BaseModel
from typing import Optional

class TopicBase(BaseModel):
    title: str
    content: Optional[str] = None
    category_id: int

class TopicCreate(TopicBase):
    pass

class Topic(TopicBase):
    id: int

    class Config:
        from_attributes = True
```

#### 3. 라우터 추가 (api/routes/)
```python
# app/api/routes/topics.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db

router = APIRouter()

@router.get("/")
async def get_topics(db: Session = Depends(get_db)):
    # 로직
    pass

@router.post("/")
async def create_topic(topic: TopicCreate, db: Session = Depends(get_db)):
    # 로직
    pass
```

#### 4. main.py에 라우터 등록
```python
from app.api.routes import topics

app.include_router(topics.router, prefix="/api/topics", tags=["topics"])
```

### Frontend 개발

#### 1. API 클라이언트 작성
```typescript
// src/api/topics.ts
const API_URL = import.meta.env.VITE_API_URL;

export const getTopics = async () => {
  const response = await fetch(`${API_URL}/api/topics`);
  return response.json();
};

export const createTopic = async (data: TopicCreate) => {
  const response = await fetch(`${API_URL}/api/topics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
};
```

#### 2. React Query 훅 작성
```typescript
// src/hooks/useTopics.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { getTopics, createTopic } from '@/api/topics';

export const useTopics = () => {
  return useQuery({
    queryKey: ['topics'],
    queryFn: getTopics,
  });
};

export const useCreateTopic = () => {
  return useMutation({
    mutationFn: createTopic,
  });
};
```

#### 3. 컴포넌트에서 사용
```typescript
// src/pages/TopicsPage.tsx
import { useTopics } from '@/hooks/useTopics';

export const TopicsPage = () => {
  const { data: topics, isLoading } = useTopics();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {topics?.map(topic => (
        <div key={topic.id}>{topic.title}</div>
      ))}
    </div>
  );
};
```

## 코딩 컨벤션

### Python (Backend)
- PEP 8 스타일 가이드 준수
- 함수/변수명: snake_case
- 클래스명: PascalCase
- 상수: UPPER_CASE

### TypeScript (Frontend)
- ESLint + Prettier 사용
- 함수/변수명: camelCase
- 컴포넌트/타입: PascalCase
- 상수: UPPER_CASE
- 파일명: kebab-case 또는 PascalCase (컴포넌트)

## Git 워크플로우

### 브랜치 전략
- `main`: 프로덕션
- `develop`: 개발
- `feature/*`: 기능 개발
- `fix/*`: 버그 수정

### 커밋 메시지
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅
refactor: 코드 리팩토링
test: 테스트 추가
chore: 빌드/설정 변경
```

## 배포

### Backend (Render)
1. Render 대시보드에서 Web Service 생성
2. GitHub 저장소 연결
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. 환경 변수 설정

### Frontend (Vercel)
1. Vercel 대시보드에서 프로젝트 생성
2. GitHub 저장소 연결
3. Root Directory: `frontend/student-app` 또는 `frontend/admin-app`
4. Framework Preset: Vite
5. 환경 변수 설정

## 트러블슈팅

### Backend 서버가 시작되지 않을 때
- `.env` 파일이 제대로 설정되었는지 확인
- DATABASE_URL이 올바른지 확인
- 가상환경이 활성화되었는지 확인

### Frontend 빌드 에러
- `node_modules` 삭제 후 재설치
- `npm cache clean --force`
- Node.js 버전 확인

### CORS 에러
- Backend의 `ALLOWED_ORIGINS`에 프론트엔드 URL 추가
- 브라우저 캐시 삭제

## 유용한 명령어

### Backend
```bash
# 의존성 업데이트
pip freeze > requirements.txt

# DB 마이그레이션 (Alembic 사용 시)
alembic revision --autogenerate -m "message"
alembic upgrade head

# 테스트 실행
pytest
```

### Frontend
```bash
# 린팅
npm run lint

# 빌드
npm run build

# 빌드 미리보기
npm run preview

# 타입 체크
npm run type-check
```
