# API 테스팅 가이드

## Backend 서버 시작

```bash
cd backend

# 가상환경 활성화 (Windows)
venv\Scripts\activate

# 서버 실행
uvicorn app.main:app --reload --port 8000
```

서버가 시작되면:
- API 문서: http://localhost:8000/docs
- Alternative 문서: http://localhost:8000/redoc

## 인증 API 테스트

### 1. 회원가입 테스트

#### Step 1: OAuth ID 토큰 생성 (개발용)
실제로는 Google/Apple OAuth를 통해 받지만, 개발 시에는 임시 토큰 사용 가능

Python으로 테스트 토큰 생성:
```python
import jwt

# 테스트용 Google ID 토큰 생성
payload = {
    "email": "test@example.com",
    "name": "홍길동",
    "sub": "google-user-123"
}
token = jwt.encode(payload, "secret", algorithm="HS256")
print(token)
```

#### Step 2: 회원가입 API 호출

**POST** `/api/auth/oauth/register`

Request Body:
```json
{
  "provider": "google",
  "id_token": "eyJ...(위에서 생성한 토큰)",
  "name": "홍길동",
  "cohort": 1
}
```

Response (200 OK):
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer"
}
```

### 2. 로그인 테스트

**POST** `/api/auth/oauth/login`

Request Body:
```json
{
  "provider": "google",
  "id_token": "eyJ...(같은 이메일의 토큰)"
}
```

Response (200 OK):
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer"
}
```

### 3. 현재 사용자 정보 조회

**GET** `/api/auth/me`

Headers:
```
Authorization: Bearer eyJhbGc...(위에서 받은 access_token)
```

Response:
```json
{
  "id": "uuid",
  "email": "test@example.com",
  "name": "홍길동",
  "cohort": 1,
  "oauth_provider": "google",
  "role": "student",
  "approval_status": "pending",
  "approved_by": null,
  "approved_at": null,
  "created_at": "2025-11-05T...",
  "updated_at": "2025-11-05T..."
}
```

## 사용자 관리 API 테스트 (관리자 전용)

### 1. 관리자 계정 생성

먼저 DB에서 직접 관리자 계정 생성:
```sql
-- Supabase SQL Editor에서 실행
INSERT INTO users (email, name, cohort, oauth_provider, oauth_id, role, approval_status)
VALUES ('admin@example.com', '관리자', 1, 'google', 'admin-123', 'admin', 'approved');
```

### 2. 관리자로 로그인

Python으로 관리자 토큰 생성:
```python
import jwt

payload = {
    "email": "admin@example.com",
    "name": "관리자",
    "sub": "admin-123"
}
token = jwt.encode(payload, "secret", algorithm="HS256")
print(token)
```

**POST** `/api/auth/oauth/login` 으로 관리자 JWT 토큰 받기

### 3. 승인 대기 사용자 목록 조회

**GET** `/api/users/pending`

Headers:
```
Authorization: Bearer (관리자_access_token)
```

Response:
```json
[
  {
    "id": "uuid",
    "email": "test@example.com",
    "name": "홍길동",
    "cohort": 1,
    "role": "student",
    "approval_status": "pending",
    ...
  }
]
```

### 4. 사용자 승인

**POST** `/api/users/{user_id}/approve`

Headers:
```
Authorization: Bearer (관리자_access_token)
```

Response:
```json
{
  "id": "uuid",
  "approval_status": "approved",
  "approved_by": "관리자_uuid",
  "approved_at": "2025-11-05T...",
  ...
}
```

## 권한 테스트

### 수강생이 관리자 기능 접근 시도

**GET** `/api/users/` (수강생 토큰으로)

Response (403 Forbidden):
```json
{
  "detail": "Admin role required. Please use the admin app."
}
```

### 승인되지 않은 수강생이 접근 시도

승인 전 수강생 토큰으로 require_student가 필요한 API 호출 시:

Response (403 Forbidden):
```json
{
  "detail": "Your account is pending approval. Please wait for admin approval."
}
```

## Swagger UI에서 테스트

1. http://localhost:8000/docs 접속
2. 오른쪽 상단 "Authorize" 버튼 클릭
3. Bearer 토큰 입력
4. 각 API 엔드포인트를 GUI로 테스트 가능

## cURL로 테스트

### 회원가입
```bash
curl -X POST "http://localhost:8000/api/auth/oauth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "google",
    "id_token": "test-token",
    "name": "홍길동",
    "cohort": 1
  }'
```

### 로그인
```bash
curl -X POST "http://localhost:8000/api/auth/oauth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "google",
    "id_token": "test-token"
  }'
```

### 인증 필요한 API
```bash
curl -X GET "http://localhost:8000/api/auth/me" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 다음 단계

백엔드 인증 API가 정상 작동하면:
1. Frontend 로그인 화면 구현
2. OAuth Provider 실제 연동 (Google, Apple)
3. 토큰 저장 및 자동 로그인
