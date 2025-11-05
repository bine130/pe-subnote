from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings
from uuid import UUID

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    JWT 액세스 토큰 생성
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})

    # UUID를 문자열로 변환
    if "user_id" in to_encode and isinstance(to_encode["user_id"], UUID):
        to_encode["user_id"] = str(to_encode["user_id"])

    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> Optional[dict]:
    """
    JWT 토큰 검증
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None


def decode_id_token(provider: str, id_token: str) -> Optional[dict]:
    """
    OAuth Provider의 ID 토큰 디코딩 및 검증

    실제 구현 시에는 각 provider의 공개 키로 검증해야 함
    현재는 개발용으로 간단히 디코딩만 수행
    """
    try:
        # 개발용: 검증 없이 디코딩 (프로덕션에서는 절대 사용 금지!)
        # 모든 검증을 비활성화
        payload = jwt.decode(
            id_token,
            key="",
            options={
                "verify_signature": False,
                "verify_aud": False,
                "verify_iat": False,
                "verify_exp": False,
                "verify_nbf": False,
                "verify_iss": False,
                "verify_sub": False,
                "verify_jti": False,
                "verify_at_hash": False
            }
        )

        print(f"[DEBUG] Decoded payload: {payload}")  # 디버깅용

        # Provider별 필드 매핑
        if provider == "google":
            email = payload.get("email")
            name = payload.get("name")
            oauth_id = payload.get("sub")

            print(f"[DEBUG] Google data - email: {email}, name: {name}, oauth_id: {oauth_id}")

            if not email or not oauth_id:
                print(f"[ERROR] Missing required fields in Google token")
                return None

            return {
                "email": email,
                "name": name or email.split("@")[0],
                "oauth_id": oauth_id,
                "provider": "google"
            }
        elif provider == "apple":
            return {
                "email": payload.get("email"),
                "name": payload.get("name") or payload.get("email", "").split("@")[0],
                "oauth_id": payload.get("sub"),
                "provider": "apple"
            }

        return None
    except Exception as e:
        print(f"[ERROR] Error decoding ID token: {e}")
        import traceback
        traceback.print_exc()
        return None
