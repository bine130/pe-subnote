# 앱 아키텍처 (Option 2: 완전 분리)

## 전체 구조

```
┌─────────────────────────────────────────────────────────┐
│                    사용자 접근                           │
└─────────────────────────────────────────────────────────┘
                            │
           ┌────────────────┴────────────────┐
           │                                 │
    ┌──────▼──────┐                  ┌──────▼──────┐
    │ Student App │                  │  Admin App  │
    │    (PWA)    │                  │    (Web)    │
    └──────┬──────┘                  └──────┬──────┘
           │                                 │
           │  student.domain.com             │  admin.domain.com
           │                                 │
           └────────────────┬────────────────┘
                            │
                     ┌──────▼──────┐
                     │   Backend   │
                     │   FastAPI   │
                     └──────┬──────┘
                            │
                     ┌──────▼──────┐
                     │  Supabase   │
                     │  PostgreSQL │
                     └─────────────┘
```

## 앱별 역할 및 권한

### 1. Student App (수강생용 PWA)

#### 접속 URL
- **개발**: `http://localhost:5173`
- **프로덕션**: `https://student.yourdomain.com`

#### 접근 권한
- OAuth 로그인 (Google, Apple)
- 백엔드에서 `role === 'student'` 체크
- 승인 상태 `approval_status === 'approved'` 체크
- 관리자 계정으로 로그인 시도하면 **거부**

#### 주요 기능
- 서브노트 조회 (읽기 전용)
- 검색 및 필터링
- 카테고리 트리 네비게이션
- 키워드 검색
- 북마크 (선택사항)
- 학습 진행도 (선택사항)
- 개인 메모 (선택사항)
- PWA 기능 (오프라인 캐싱, 홈 화면 추가)

#### 제한 사항
- 서브노트 생성/수정/삭제 **불가**
- 카테고리 관리 **불가**
- 템플릿 관리 **불가**
- 사용자 승인 관리 **불가**

---

### 2. Admin App (관리자용 웹)

#### 접속 URL
- **개발**: `http://localhost:5174`
- **프로덕션**: `https://admin.yourdomain.com`

#### 접근 권한
- OAuth 로그인 (Google, Apple)
- 백엔드에서 `role === 'admin'` 체크
- 수강생 계정으로 로그인 시도하면 **거부**

#### 주요 기능
- **서브노트 관리**
  - 생성, 조회, 수정, 삭제
  - 노션 레벨 마크다운 에디터
  - 템플릿에서 시작
  - 버전 이력 조회
  - 버전 비교 및 복구

- **카테고리 관리**
  - 트리 구조 관리
  - 생성, 수정, 삭제
  - 드래그 앤 드롭 순서 변경

- **템플릿 관리**
  - 템플릿 CRUD
  - 노션 에디터로 작성

- **사용자 관리**
  - 가입 승인 대기 목록
  - 사용자 승인/거부
  - 사용자 목록 조회

- **대시보드** (선택사항)
  - 서브노트 통계
  - 사용자 통계

#### 제한 사항
- 없음 (전체 권한)

---

## 인증 흐름

### Student App 로그인

```
1. 사용자가 Student App 접속
   ↓
2. OAuth 로그인 버튼 클릭 (Google/Apple)
   ↓
3. OAuth Provider 인증
   ↓
4. Backend로 OAuth 토큰 전송
   ↓
5. Backend에서 사용자 확인:
   - 신규 사용자? → 회원가입 (email, name, cohort 입력)
   - 기존 사용자? → 로그인
   ↓
6. Backend에서 권한 체크:
   - role !== 'student'? → ❌ 401 에러 "관리자 계정으로는 접근할 수 없습니다"
   - approval_status !== 'approved'? → ❌ 403 에러 "승인 대기 중입니다"
   - ✅ 모두 통과 → JWT 토큰 발급
   ↓
7. Student App에서 JWT 저장 및 메인 화면 이동
```

### Admin App 로그인

```
1. 관리자가 Admin App 접속
   ↓
2. OAuth 로그인 버튼 클릭 (Google/Apple)
   ↓
3. OAuth Provider 인증
   ↓
4. Backend로 OAuth 토큰 전송
   ↓
5. Backend에서 권한 체크:
   - role !== 'admin'? → ❌ 401 에러 "관리자 권한이 필요합니다"
   - ✅ 통과 → JWT 토큰 발급
   ↓
6. Admin App에서 JWT 저장 및 대시보드 이동
```

---

## Backend API 권한 체크

### 미들웨어/의존성

```python
# app/api/deps.py
from fastapi import Depends, HTTPException, status
from jose import jwt, JWTError

async def get_current_user(token: str = Depends(oauth2_scheme)):
    # JWT 토큰 검증
    # 사용자 정보 반환
    pass

async def require_student(current_user: User = Depends(get_current_user)):
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student role required"
        )
    if current_user.approval_status != "approved":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account not approved yet"
        )
    return current_user

async def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin role required"
        )
    return current_user
```

### API 엔드포인트 예시

```python
# 수강생용 엔드포인트
@router.get("/api/topics", dependencies=[Depends(require_student)])
async def get_topics_for_student():
    # 조회만 가능
    pass

# 관리자용 엔드포인트
@router.post("/api/topics", dependencies=[Depends(require_admin)])
async def create_topic():
    # CRUD 가능
    pass

@router.put("/api/topics/{id}", dependencies=[Depends(require_admin)])
async def update_topic():
    pass

@router.delete("/api/topics/{id}", dependencies=[Depends(require_admin)])
async def delete_topic():
    pass
```

---

## 배포 전략

### Vercel 배포

#### Student App
1. Vercel에서 새 프로젝트 생성
2. GitHub 연결
3. **Root Directory**: `frontend/student-app`
4. **Framework Preset**: Vite
5. **Custom Domain**: `student.yourdomain.com`
6. 환경 변수:
   ```
   VITE_API_URL=https://your-backend.render.com
   VITE_APP_TYPE=student
   ```

#### Admin App
1. Vercel에서 새 프로젝트 생성 (별도)
2. GitHub 연결 (같은 레포지토리)
3. **Root Directory**: `frontend/admin-app`
4. **Framework Preset**: Vite
5. **Custom Domain**: `admin.yourdomain.com`
6. 환경 변수:
   ```
   VITE_API_URL=https://your-backend.render.com
   VITE_APP_TYPE=admin
   ```

### Render 배포 (Backend)
1. Web Service 생성
2. **Build Command**: `pip install -r requirements.txt`
3. **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. 환경 변수 설정

---

## 보안 고려사항

### 1. CORS 설정
```python
# Backend
ALLOWED_ORIGINS = [
    "https://student.yourdomain.com",
    "https://admin.yourdomain.com",
    "http://localhost:5173",  # 개발
    "http://localhost:5174",  # 개발
]
```

### 2. JWT 토큰
- Student App과 Admin App에 발급되는 토큰에 `role` 포함
- 모든 API 요청 시 `role` 검증

### 3. API 엔드포인트 분리
- `/api/student/*` - 수강생용
- `/api/admin/*` - 관리자용
- 또는 동일 엔드포인트에 권한 체크

---

## 개발 시 주의사항

### 1. 로컬 개발
- Student App: `http://localhost:5173`
- Admin App: `http://localhost:5174`
- Backend: `http://localhost:8000`

### 2. 환경 변수
각 앱마다 `.env` 파일 생성:

**student-app/.env**
```
VITE_API_URL=http://localhost:8000
VITE_APP_TYPE=student
```

**admin-app/.env**
```
VITE_API_URL=http://localhost:8000
VITE_APP_TYPE=admin
```

### 3. 공통 컴포넌트
만약 Student App과 Admin App에서 공통으로 사용하는 컴포넌트가 있다면:
- `frontend/shared/` 폴더 생성
- npm workspace 또는 심볼릭 링크 사용
- 또는 각 앱에 복사 (단순한 방법)

---

## 다음 단계

1. ✅ 아키텍처 문서 작성 완료
2. Backend 인증 API 구현
3. Student App 로그인 화면 구현
4. Admin App 로그인 화면 구현
5. JWT 토큰 관리 구현
6. 권한별 라우팅 구현
