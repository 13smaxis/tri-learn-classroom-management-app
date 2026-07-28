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
├── src/
│   ├── components/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   │   ├──LearnerDashboard.tsx
│   │   │   ├──ParentDashboard.tsx
│   │   │   ├──TeacherDashboard.tsx
│   │   ├── landing/
│   │   ├── layout/
│   │   ├── learner/
│   │   ├── parent/
│   │   ├── shared/
│   │   ├── teacher/
│   │   └── ui/
│   ├── contexts/
│   ├── hooks/
│   ├── lib/
│   ├── pages/
│   ├── services/
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
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

## Environment variables
Frontend:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

Backend:
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
PORT=3000
