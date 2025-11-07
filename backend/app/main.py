from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="PE Subnote API",
    description="기술사 서브노트 관리 시스템 API",
    version="1.0.0"
)

# CORS origins 로깅
cors_origins_list = settings.cors_origins
logger.info(f"CORS Origins: {cors_origins_list}")
logger.info(f"CORS Origins type: {type(cors_origins_list)}")
logger.info(f"CORS Origins items: {[repr(o) for o in cors_origins_list]}")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "PE Subnote API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Import routers
from app.api.routes import auth, users, categories, topics, templates, comments, bookmarks, read_counts, notes

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(categories.router, prefix="/api/categories", tags=["categories"])
app.include_router(topics.router, prefix="/api/topics", tags=["topics"])
app.include_router(templates.router, prefix="/api/templates", tags=["templates"])
app.include_router(comments.router, tags=["comments"])  # prefix already in router
app.include_router(bookmarks.router, tags=["bookmarks"])  # prefix already in router
app.include_router(read_counts.router, tags=["read-counts"])  # prefix already in router
app.include_router(notes.router, tags=["notes"])  # prefix already in router
