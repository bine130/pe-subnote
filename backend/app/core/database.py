from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Supabase 무료 버전 연결 제한(15개)을 고려한 풀 설정
engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,       # 연결 유효성 체크
    echo=False,
    pool_size=3,              # 기본 연결 수 (낮게 설정)
    max_overflow=2,           # 최대 5개 연결로 제한
    pool_timeout=20,          # 20초 대기
    pool_recycle=300          # 5분마다 연결 재생성 (idle 방지)
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
