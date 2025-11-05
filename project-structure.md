# 프로젝트 구조

```
pe-subnote/
├── docs/                           # 문서 모음
│   ├── authentication-flow.md
│   ├── category-management.md
│   ├── database-analysis.md
│   ├── database-migration.md
│   ├── frontend-structure.md
│   ├── requirements.md
│   ├── subnote-structure.md
│   ├── tech-stack.md
│   ├── template-management.md
│   └── version-control.md
│
├── frontend/                       # React 프론트엔드
│   ├── student-app/               # 수강생용 PWA
│   │   ├── public/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── hooks/
│   │   │   ├── utils/
│   │   │   ├── api/
│   │   │   └── App.tsx
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   └── admin-app/                 # 관리자용 웹
│       ├── public/
│       ├── src/
│       │   ├── components/
│       │   ├── pages/
│       │   ├── hooks/
│       │   ├── utils/
│       │   ├── api/
│       │   └── App.tsx
│       ├── package.json
│       └── vite.config.ts
│
├── backend/                        # FastAPI 백엔드
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── auth.py
│   │   │   │   ├── topics.py
│   │   │   │   ├── categories.py
│   │   │   │   ├── templates.py
│   │   │   │   ├── users.py
│   │   │   │   └── versions.py
│   │   │   └── deps.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── database.py
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── topic.py
│   │   │   ├── category.py
│   │   │   ├── template.py
│   │   │   └── version.py
│   │   ├── schemas/
│   │   │   ├── user.py
│   │   │   ├── topic.py
│   │   │   ├── category.py
│   │   │   ├── template.py
│   │   │   └── version.py
│   │   └── main.py
│   ├── requirements.txt
│   └── .env.example
│
├── .gitignore
└── README.md
```

## 프로젝트별 기술 스택

### Frontend (Student PWA)
- React 18
- TypeScript
- Vite
- TanStack Query (React Query)
- Zustand (상태 관리)
- React Router
- Tailwind CSS
- PWA Plugin

### Frontend (Admin Web)
- React 18
- TypeScript
- Vite
- TanStack Query
- Zustand
- React Router
- Tailwind CSS
- Tiptap (에디터)
- React DnD Kit (드래그앤드롭)

### Backend
- FastAPI
- Python 3.11+
- SQLAlchemy
- Pydantic
- Python-Jose (JWT)
- Supabase Python Client
- Uvicorn

## 배포

### Frontend
- **Student PWA**: Vercel
- **Admin Web**: Vercel

### Backend
- **API**: Render

### Database
- **Supabase**: PostgreSQL + Storage
