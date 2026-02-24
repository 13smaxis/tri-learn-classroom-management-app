## School Management App

Comprehensive school management system with role-based access for teachers, parents, and learners. The project is structured as a Node.js workspace with a React frontend, TypeScript backend services, and Terraform infrastructure.

### Getting Started

#### Prerequisites

- Node.js (LTS recommended)
- npm

#### Install dependencies

From the workspace root:

```bash
npm install
```

#### Run the frontend

```bash
npm run dev
```

This starts the Vite dev server for the frontend. The URL and port will be shown in the terminal (for example `http://localhost:8080`).

#### Run backend services (example: auth-service)

From the workspace root, depending on how you wire up backend scripts:

```bash
# Example, if you add scripts for the auth service
npm run backend:dev
```

### Key Features

- React + TypeScript + Vite frontend
- Role-based access for teachers, parents, and learners
- Auth flow with landing page (sign in / sign up)
- Modular backend services (auth-service, shared middleware & models)
- Terraform-based infrastructure definition under `infra/terraform`


### Project Structure

```
school-app/
├─ package.json              # Root app config and scripts (npm run dev)
├─ README.md                 # Project documentation
├─ public/                   # Static assets served by Vite
│  ├─ manifest.json
│  ├─ logo-removebg.png
│  ├─ robots.txt
│  └─ sw.js
├─ src/                      # Main React + Vite frontend
│  ├─ main.tsx               # Frontend entrypoint
│  ├─ App.tsx                # App shell and routing
│  ├─ index.css              # Global styles
│  ├─ components/            # UI components (landing, dashboards, views, shared UI)
│  ├─ contexts/              # React context providers (auth, app state)
│  ├─ hooks/                 # Reusable React hooks
│  ├─ lib/                   # Client libraries (e.g. supabase, utils)
│  └─ pages/                 # Top-level routed pages (Index, NotFound)
├─ backend/                  # Backend services and shared code
│  ├─ package.json           # Backend workspace config
│  ├─ tsconfig.json          # TypeScript config for backend
│  ├─ services/              # Individual micro-services
│  │  └─ auth-service/
│  │     ├─ package.json
│  │     └─ src/
│  │        ├─ index.ts      # Auth service entrypoint
│  │        └─ service.ts    # Auth business logic
│  └─ shared/                # Shared backend utilities
│     ├─ middleware/
│     │  └─ index.ts
│     ├─ models/
│     │  └─ index.ts
│     └─ utils/
│        └─ index.ts
├─ docs/                     # Additional project documentation
│  ├─ api-spec.md
│  ├─ architecture.md
│  ├─ deployment.md
│  ├─ development.md
│  ├─ PROJECT_SETUP.md
│  └─ QUICK_START.md
├─ infra/
│  └─ terraform/             # Infrastructure as Code
│     ├─ main.tf
│     ├─ variables.tf
│     ├─ outputs.tf
│     └─ README.md
└─ config & tooling files
	├─ vite.config.ts
	├─ tailwind.config.ts
	├─ eslint.config.js
	├─ tsconfig.json
	├─ tsconfig.app.json
	└─ tsconfig.node.json
```