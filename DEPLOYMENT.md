# PE Subnote 배포 가이드

## 🚀 배포 구조

- **Frontend (Student App)**: Vercel
- **Backend (API)**: Render
- **Database**: Render PostgreSQL

---

## 📦 Vercel 배포 (Student App)

### 1. Vercel 프로젝트 생성

1. [Vercel](https://vercel.com) 로그인
2. **Add New Project** 클릭
3. GitHub 저장소 `bine130/pe-subnote` 선택
4. **Root Directory**: `frontend/student-app` 설정
5. **Framework Preset**: Vite 선택

### 2. 환경변수 설정

Vercel Dashboard → Settings → Environment Variables:

```
VITE_API_URL=https://your-backend-url.onrender.com
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### 3. 배포

- **Deploy** 클릭
- 자동으로 빌드 및 배포 시작

---

## 🖥️ Render 배포 (Backend)

### 1. Render 대시보드에서 생성

#### Option A: render.yaml 사용 (추천)

1. [Render](https://render.com) 로그인
2. **New** → **Blueprint** 선택
3. GitHub 저장소 `bine130/pe-subnote` 연결
4. `render.yaml` 자동 감지
5. **Apply** 클릭

#### Option B: 수동 생성

1. **New** → **Web Service** 클릭
2. GitHub 저장소 연결
3. 설정:
   - **Name**: `pe-subnote-backend`
   - **Region**: Singapore
   - **Root Directory**: `backend`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### 2. PostgreSQL 데이터베이스 생성

1. **New** → **PostgreSQL** 클릭
2. 설정:
   - **Name**: `pe-subnote-db`
   - **Region**: Singapore (백엔드와 동일)
   - **Database**: `pesubnote`
   - **User**: `pesubnote`
3. **Create Database** 클릭

### 3. 환경변수 설정

Web Service → Environment Variables:

```
DATABASE_URL=<PostgreSQL Internal Connection String>
SECRET_KEY=<랜덤 생성된 키>
ALLOWED_ORIGINS=https://your-frontend-url.vercel.app
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

**중요**: `DATABASE_URL`은 Render PostgreSQL의 **Internal Connection String** 사용

### 4. 데이터베이스 마이그레이션

배포 후 Render Shell에서 실행:

```bash
# SQL 마이그레이션 실행 (필요시)
psql $DATABASE_URL < add_importance_level.sql
psql $DATABASE_URL < add_note_size.sql
psql $DATABASE_URL < alter_user_notes.sql
```

---

## 🔄 배포 후 설정

### 1. CORS 업데이트

Backend의 `ALLOWED_ORIGINS` 환경변수를 Vercel URL로 업데이트:

```
ALLOWED_ORIGINS=https://your-app.vercel.app,http://localhost:5173
```

### 2. Frontend API URL 업데이트

Vercel의 `VITE_API_URL`을 Render 백엔드 URL로 업데이트:

```
VITE_API_URL=https://pe-subnote-backend.onrender.com
```

### 3. 테스트

- Frontend: `https://your-app.vercel.app`
- Backend API: `https://pe-subnote-backend.onrender.com/health`
- API Docs: `https://pe-subnote-backend.onrender.com/docs`

---

## 📝 주의사항

### Render Free Tier
- 15분 동안 요청이 없으면 자동으로 sleep
- Cold start 시 첫 요청이 느릴 수 있음 (30초~1분)
- 해결: Paid plan 또는 keep-alive 서비스 사용

### Vercel
- 빌드 시간: 최대 45초 (Hobby plan)
- 자동 HTTPS 적용
- 매 push마다 자동 배포

### 환경변수 변경
- Render: 변경 후 자동 재배포
- Vercel: 변경 후 재배포 필요

---

## 🔧 트러블슈팅

### CORS 에러
- Backend `ALLOWED_ORIGINS`에 Frontend URL 추가 확인
- Vercel URL은 `https://` 사용

### Database 연결 에러
- `DATABASE_URL`이 `postgresql+asyncpg://` 형식인지 확인
- Render PostgreSQL Internal URL 사용

### Build 실패
- Node 버전: package.json engines 확인
- Python 버전: render.yaml에 3.11 명시됨

---

## 📚 추가 자료

- [Vercel Docs](https://vercel.com/docs)
- [Render Docs](https://render.com/docs)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
