from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str

    @property
    def database_url(self) -> str:
        """DATABASE_URL을 psycopg2가 사용할 수 있게 반환"""
        # postgres:// -> postgresql:// 변환 (Render가 postgres://로 제공하는 경우)
        if self.DATABASE_URL.startswith("postgres://"):
            return self.DATABASE_URL.replace("postgres://", "postgresql://", 1)
        # 이미 postgresql://이면 그대로 반환 (psycopg2가 사용)
        return self.DATABASE_URL

    # Supabase (Optional)
    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    APPLE_CLIENT_ID: str = ""
    APPLE_CLIENT_SECRET: str = ""

    # CORS - 문자열로 받아서 나중에 split
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:5174"

    @property
    def cors_origins(self) -> list[str]:
        """CORS origins를 리스트로 반환"""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(',')]

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
