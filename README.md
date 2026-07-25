# TriLearn - Classroom Management Platform

A comprehensive classroom management system connecting teachers, parents, and learners on one unified platform. Built with React + TypeScript on the frontend and Express + Supabase on the backend.

## Stack
- Frontend: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- Backend: Express.js, TypeScript, Supabase
- Database/auth: Supabase PostgreSQL and Supabase Auth

## Quick start
1. Install frontend dependencies: npm install
2. Create .env.local with your Supabase credentials
3. Start the frontend: npm run dev
4. Start the backend: cd backend && npm install && npm run dev

## Environment variables
Frontend:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

Backend:
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
PORT=3000
