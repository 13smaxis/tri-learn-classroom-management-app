# TriLearn - Classroom Management Platform

A comprehensive classroom management system connecting teachers, parents, and learners on one unified platform. Built with React + TypeScript on the frontend and Express + Supabase on the backend.

## Stack
- Frontend: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- Backend: Express.js, TypeScript, Supabase
- Database/auth: Supabase PostgreSQL and Supabase Auth

## Quick start
1. Install frontend dependencies: npm install
2. Create a frontend environment file: copy the frontend Supabase variables into .env.local if needed
3. Start the frontend: npm run dev
4. Start the backend: cd backend && npm install && npm run dev

## Project structure
```text
root/
├── backend/
│   ├── src/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── index.ts
│   │   ├── server.ts
│   │   └── types/
│   ├── index.ts
│   ├── package.json
│   └── tsconfig.json
├── data/
├── docs/
├── infra/
│   └── terraform/
├── public/
├── restore_check/
## Project structure
```text
root/
├── backend/
│   ├── index.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts
│       ├── server.ts
│       ├── middleware/
│       │   ├── auth.ts
│       │   └── cors.ts
│       ├── routes/
│       │   ├── attendance.ts
│       │   ├── auth.ts
│       │   └── teacher.ts
│       ├── services/
│       │   ├── authService.ts
│       │   └── supabase.ts
│       ├── types/
│       │   └── index.ts
│       └── utils/
│           ├── inviteCode.test.ts
│           ├── inviteCode.ts
│           └── logger.ts
├── data/
├── docs/
├── api-spec.md
├── architecture.md
├── deployment.md
├── development.md
├── PROJECT_SETUP.md
├── PROJECT_STRUCTURE.md
├── QUICK_START.md
├── SUPABASE_SETUP.md
├── infra/
│   └── terraform/
│       ├── main.tf
│       ├── outputs.tf
│       └── variables.tf
├── postman/
│   ├── collections/
│   ├── environments/
│   ├── flows/
│   ├── globals/
│   └── mocks/
├── public/
│   ├── manifest.json
│   ├── robots.txt
│   └── sw.js
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── vite-env.d.ts
│   ├── components/
│   │   ├── AppLayout.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── theme-provider.tsx
│   │   ├── auth/
│   │   ├── dashboard/
│   │   │   ├── LearnerDashboard.tsx
│   │   │   ├── ParentDashboard.tsx
│   │   │   └── TeacherDashboard.tsx
│   │   ├── landing/
│   │   ├── layout/
│   │   ├── learner/
│   │   ├── parent/
│   │   ├── shared/
│   │   ├── teacher/
│   │   └── ui/
│   ├── contexts/
│   │   ├── AppContext.tsx
│   │   └── AuthContext.tsx
│   ├── hooks/
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   ├── lib/
│   │   ├── api.ts
│   │   ├── supabase.ts
│   │   └── utils.ts
│   ├── pages/
│   │   ├── Index.tsx
│   │   └── NotFound.tsx
│   └── services/
│       ├── authService.ts
│       └── teacherService.ts
├── components.json
├── eslint.config.js
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
└── VERIFICATION_CHECKLIST.md
```
