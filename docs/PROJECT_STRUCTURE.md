# Project Structure Guide

## Overview

TriLearn is a full-stack classroom management platform with the following architecture:

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Spring Boot (Java 21) + Node.js Express (Auth Service)
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth (JWT-based)
- **Infrastructure**: Terraform (optional deployment)

## Directory Breakdown

### Root Configuration Files

```
tri-learn-classroom-management-app/
├── .env.local              📌 LOCAL ONLY - Supabase credentials (git-ignored)
├── .env.example            📋 Template for environment variables
├── .gitignore              🚫 Git exclusions (includes .env.local)
├── package.json            📦 Frontend dependencies & scripts
├── vite.config.ts          ⚙️ Vite build configuration
├── tailwind.config.ts      🎨 Tailwind CSS customization
├── postcss.config.ts       📄 PostCSS configuration
├── tsconfig.json           🔤 TypeScript root config
├── tsconfig.app.json       🔤 TypeScript frontend config
├── tsconfig.node.json      🔤 TypeScript build tools config
├── eslint.config.js        ✓ Linting rules
├── components.json         🧩 shadcn/ui component config
├── pom.xml                 📦 Spring Boot Maven config
├── index.html              🌐 HTML entry point
├── README.md               📖 Main documentation
└── VERIFICATION_CHECKLIST.md ✅ Deployment verification guide
```

---

## Frontend Structure (`src/`)

### Entry Points
```
src/
├── main.tsx                React entry point (vite)
├── index.css               Global styles (Tailwind)
└── App.tsx                 Root component & routing
```

### Components (`src/components/`)

The component structure is organized by feature and role:

#### 1. **Core Components**
```
src/components/
├── AppLayout.tsx           Main app wrapper/layout
├── theme-provider.tsx      Dark/light mode provider
└── navigation.tsx          Main navigation (if exists)
```

#### 2. **Authentication Components** (`src/components/auth/`)
```
auth/
├── LoginModal.tsx          Teacher/Parent login
├── RegisterModal.tsx       User registration
├── InviteModal.tsx         Join class with code
└── InviteView.tsx          Invite code interface
```

#### 3. **Dashboard Components** (`src/components/dashboard/`)
```
dashboard/
├── TeacherDashboard.tsx    Teacher home dashboard
├── ParentDashboard.tsx     Parent home dashboard
└── LearnerDashboard.tsx    Learner home dashboard
```

#### 4. **Landing Page** (`src/components/landing/`)
```
landing/
└── LandingPage.tsx         Public landing page
```

#### 5. **Layout Components** (`src/components/layout/`)
```
layout/
└── Sidebar.tsx             Navigation sidebar
```

#### 6. **Teacher Features** (`src/components/teacher/`)
```
teacher/
├── AssignmentsView.tsx     Manage assignments
├── AttendanceView.tsx      Attendance register
├── ClassworkView.tsx       Classwork management
├── HomeworkView.tsx        Homework management
├── MarksView.tsx           Grade entry & tracking
├── TestsView.tsx           Test management
├── StarsView.tsx           Reward/recognition system
└── CreateClassModal.tsx    Create new class
```

#### 7. **Learner Features** (`src/components/learner/`)
```
learner/
└── LearnerAssignmentsView.tsx  View & submit assignments
```

#### 8. **Parent Features** (`src/components/parent/`)
```
parent/
└── ChildProgressView.tsx   View child's progress
```

#### 9. **Shared Features** (`src/components/shared/`)
```
shared/
├── ClassDetailsView.tsx    Class information display
├── ClassesView.tsx         List of classes
├── GradesView.tsx          Grade/mark display
├── MessagesView.tsx        Messaging interface
└── StudentUploadWidget.tsx  Bulk student upload
```

#### 10. **UI Components** (`src/components/ui/`)
```
ui/
├── accordion.tsx           (50+ shadcn/ui components)
├── alert.tsx
├── alert-dialog.tsx
├── avatar.tsx
├── badge.tsx
├── button.tsx
├── calendar.tsx
├── card.tsx
├── checkbox.tsx
├── ... and many more
```

**Note**: UI components from shadcn/ui are pre-built and can be imported.

---

### State Management (`src/contexts/`)

```
src/contexts/
├── AppContext.tsx          Global app state
│   └── Manages: theme, notifications, UI state
├── AuthContext.tsx         Authentication state
│   └── Manages: user, token, login/logout
```

### Custom Hooks (`src/hooks/`)

```
src/hooks/
├── use-mobile.tsx          Responsive design hook
└── use-toast.ts            Toast notification system
```

### Client Libraries (`src/lib/`)

```
src/lib/
├── supabase.ts             ✨ Supabase client initialization
│   └── Creates client from environment variables
├── api.ts                  API client & endpoints
│   └── All backend API calls routed through here
└── utils.ts                Utility functions
    └── Common helpers (formatDate, cn(), etc.)
```

### Pages (`src/pages/`)

```
src/pages/
├── Index.tsx               Main app page (route: /)
└── NotFound.tsx            404 error page (route: /404)
```

---

## Backend Structure

### Node.js Backend (`backend/`)

#### Services (`backend/services/`)

```
backend/services/
└── auth-service/           Express.js authentication service
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── index.ts        App entry & routes
        ├── service.ts      Business logic
        └── ... (other service files)
```

**Port**: `3000` (default)

**Endpoints**:
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/health` - Health check

#### Shared Code (`backend/shared/`)

```
backend/shared/
├── middleware/
│   └── index.ts            CORS, auth middleware
├── models/
│   └── index.ts            TypeScript interfaces/types
└── utils/
    └── index.ts            Shared utilities
```

### Spring Boot Backend (`backend/spring-backend/`)

```
backend/spring-backend/
├── pom.xml                 Maven dependencies
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/schoolapp/
│   │   │       ├── config/          Spring configuration
│   │   │       ├── controller/      REST endpoints
│   │   │       ├── service/         Business logic
│   │   │       ├── model/           JPA entities
│   │   │       ├── dto/             Data transfer objects
│   │   │       ├── repository/      Database access
│   │   │       ├── security/        Security/JWT
│   │   │       └── exception/       Exception handlers
│   │   └── resources/
│   │       ├── application.yml      Spring Boot config
│   │       ├── schema.sql           Database schema
│   │       └── data.sql             Sample data
│   └── test/                        Unit tests
└── target/                          Build output (Maven)
```

**Port**: `3000` (default, same as Node service)

**Key Features**:
- Spring Data JPA for database operations
- Spring Security with JWT
- H2 → PostgreSQL migration (now Supabase)
- RESTful API endpoints

---

## Database (`data/` and Supabase)

### Local Demo Data (`data/`)

```
data/
├── demo-data-upload-gr12a.csv      Grade 12A sample students
├── demo-data-upload-gr12b.csv      Grade 12B sample students
├── demo-data-upload-gr8a.csv       Grade 8A sample students
└── demo-data-append.csv            Additional records
```

These can be imported into Supabase for testing.

### Supabase Database Structure

**Core Tables**:
- `auth.users` - User authentication (managed by Supabase)
- `classes` - Classroom records
- `students` - Student information & class memberships
- `teachers` - Teacher profiles
- `assignments` - Assignment details
- `submissions` - Student assignment submissions
- `marks` - Grade records
- `attendance` - Attendance records
- `messages` - In-app messaging
- `notifications` - Notification logs

---

## Documentation (`docs/`)

```
docs/
├── SUPABASE_SETUP.md              ✨ Complete Supabase setup guide
├── MIGRATION_SUPABASE_SUMMARY.md  ✨ Migration changelog
├── architecture.md                 System architecture & design
├── api-spec.md                     API documentation
├── development.md                  Development environment setup
├── deployment.md                   Production deployment guide
├── attendance-implementation.md    Attendance feature details
├── attendance-testing-guide.md     Attendance testing procedures
├── PROJECT_SETUP.md               Initial project setup
├── QUICK_START.md                 Quick start guide
├── progress.md                    Development progress tracker
├── plan.md                        Project plan
└── summary.md                     Project summary
```

---

## Infrastructure (`infra/`)

### Terraform Configuration (`infra/terraform/`)

```
infra/terraform/
├── main.tf          Main infrastructure definitions
├── variables.tf     Input variables (customizable)
├── outputs.tf       Output values (server IPs, etc.)
└── README.md        Terraform setup guide

Defines:
- AWS/Cloud resources (optional)
- Database infrastructure
- Load balancers
- DNS configuration
```

---

## Static Assets (`public/`)

```
public/
├── manifest.json           PWA web app manifest
├── robots.txt             SEO robots file
├── sw.js                  Service worker (offline support)
└── logo-removebg.png      Brand logo
```

---

## Build Outputs

### Frontend Build (`dist/`)

```
dist/
├── index.html             Production HTML
├── assets/                JavaScript/CSS chunks
│   ├── index-*.js
│   ├── index-*.css
│   └── ... (vendor chunks)
└── ... (other assets)
```

Generated by: `npm run build`

### Spring Build (`target/`)

```
target/
├── classes/               Compiled Java classes
├── maven-status/          Maven build metadata
└── spring-backend-0.0.1-SNAPSHOT.jar  (if packaged)
```

Generated by: `mvn clean package`

---

## Key Configuration Files

### Environment Variables (`.env.local`)

```
VITE_SUPABASE_URL=https://...        Frontend: Supabase URL
VITE_SUPABASE_ANON_KEY=...           Frontend: Public API key
VITE_API_BASE_URL=http://localhost:3000

SUPABASE_URL=https://...             Backend: Supabase URL
SUPABASE_SERVICE_ROLE_KEY=...        Backend: Service role key
JWT_SECRET=...                       Backend: JWT signing key
SPRING_DATASOURCE_URL=...            Spring: PostgreSQL connection
SPRING_DATASOURCE_USERNAME=...       Spring: Database user
SPRING_DATASOURCE_PASSWORD=...       Spring: Database password
```

### Vite Configuration (`vite.config.ts`)

- Dev server on port 5173
- Proxy to backend on /api → localhost:3000
- React + SWC for fast builds
- Path alias: `@` → `src/`

### Tailwind Configuration (`tailwind.config.ts`)

- Dark mode support
- shadcn/ui theme variables
- Customized color palette

### TypeScript Configuration

- Root: `tsconfig.json` (base config)
- Frontend: `tsconfig.app.json` (React-specific)
- Build tools: `tsconfig.node.json` (Vite config)
- Backend: `backend/tsconfig.json` (Express config)
- Spring: Java config (pom.xml)

---

## File Naming Conventions

### React Components
- **Pattern**: `PascalCase.tsx`
- **Examples**: `LoginModal.tsx`, `TeacherDashboard.tsx`, `UserCard.tsx`

### Utilities & Hooks
- **Pattern**: `kebab-case.ts` or `camelCase.ts`
- **Examples**: `use-mobile.ts`, `utils.ts`, `api.ts`

### Styles
- **Pattern**: Global styles in `index.css`, component styles in Tailwind classes
- **No CSS modules** (Tailwind is used exclusively)

### Environment Variables
- **Pattern**: `VITE_` prefix for frontend, no prefix for backend
- **Examples**: `VITE_SUPABASE_URL`, `JWT_SECRET`

---

## Development Workflow

### Frontend Development
```
1. Edit src/components/...
2. Styles auto-update via Tailwind
3. HMR (Hot Module Reload) in browser
```

### Backend Development
```
1. Edit backend/services/auth-service/src/
2. Restart service: npm start
3. Test via API client or frontend
```

### Spring Backend Development
```
1. Edit backend/spring-backend/src/
2. Rebuild: mvn clean package
3. Restart: mvn spring-boot:run
```

### Database Development
```
1. Create/modify tables in Supabase SQL Editor
2. Or update backend entity models
3. Hibernate DDL handles migrations (ddl-auto: update)
```

---

## Useful Commands Reference

### Frontend
```bash
npm install              # Install dependencies
npm run dev             # Start dev server (port 5173)
npm run build           # Production build
npm run preview         # Preview production build locally
npm run lint            # Run ESLint
```

### Auth Service
```bash
cd backend/services/auth-service
npm install
npm start               # Start Express (port 3000)
```

### Spring Backend
```bash
cd backend/spring-backend
mvn clean package      # Build JAR
mvn spring-boot:run    # Start server (port 3000)
mvn test              # Run unit tests
```

---

## For More Information

- 📖 [README.md](../README.md) - Main documentation
- 📖 [docs/SUPABASE_SETUP.md](SUPABASE_SETUP.md) - Supabase setup
- 📖 [docs/architecture.md](architecture.md) - System architecture
- 📖 [docs/development.md](development.md) - Development guide
- 📖 [docs/api-spec.md](api-spec.md) - API documentation
