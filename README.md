## TriLearn - Classroom Management Platform

A comprehensive classroom management system connecting teachers, parents, and learners on one unified platform. Built with modern technologies: React + TypeScript frontend, Spring Boot backend, and Supabase for database & authentication.

### ✨ Key Features

- 👥 **Role-Based Access** - Teachers, parents, and learners with tailored dashboards
- 📚 **Class Management** - Create classes, manage rosters, send invite codes
- ✍️ **Assignments & Homework** - Create, distribute, and track assignments
- 📊 **Marks & Grades** - Capture and display student performance
- 📝 **Attendance Tracking** - Automated class register with attendance history
- 💬 **Messaging** - In-app communication between teachers, parents, and learners
- ⭐ **Progress Tracking** - Real-time progress updates and analytics
- 🔐 **Secure Authentication** - JWT-based auth via Supabase
- 🌐 **PWA Ready** - Works offline, installable on mobile devices
- 🎨 **Modern UI** - shadcn/ui components with Tailwind CSS

### Prerequisites

- **Node.js** (LTS recommended)
- **npm** (or yarn)
- **Supabase Account** - [Create free account](https://app.supabase.com)
- **Java 21** (for Spring backend only)
- **Maven** (for Spring backend only)

### Quick Start - Frontend

#### 1. Install Dependencies

```bash
npm install
```

#### 2. Configure Supabase

Create `.env.local` in the project root:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_API_BASE_URL=http://localhost:3000
```

Get these credentials from [Supabase Dashboard](https://app.supabase.com):
1. Go to Settings → API
2. Copy Project URL and anon/public API key

#### 3. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or the port shown in terminal).

### Backend Setup - Spring Boot

```bash
cd backend

# Set environment variables
export SPRING_DATASOURCE_URL=postgresql://user:password@host:port/database
export SPRING_DATASOURCE_USERNAME=postgres
export SPRING_DATASOURCE_PASSWORD=your-password
export JWT_SECRET=your-jwt-secret

# Build and run
mvn spring-boot:run

# Or build JAR
mvn clean package
java -jar target/spring-backend-0.0.1-SNAPSHOT.jar
```

### Build for Production

```bash
npm run build
```

Creates optimized production build in `dist/` directory.

### Project Structure

```
tri-learn-classroom-management-app/
├── 📄 Configuration Files
│   ├── .env.local                 # Supabase credentials (⚠️ not in git)
│   ├── .env.example               # Environment template
│   ├── .gitignore                 # Git exclusions
│   ├── package.json               # Frontend dependencies
│   ├── vite.config.ts             # Vite bundler config
│   ├── tailwind.config.ts         # Tailwind CSS config
│   ├── tsconfig.json              # TypeScript config
│   ├── eslint.config.js           # Linting rules
│   ├── components.json            # shadcn/ui config
│   ├── postcss.config.js          # PostCSS config
│   ├── pom.xml                    # Maven (Spring backend)
│   └── index.html                 # HTML entry point
│
├── 📁 src/ - Frontend Application
│   ├── main.tsx                   # React entry point
│   ├── App.tsx                    # App shell & routing
│   ├── index.css                  # Global styles
│   │
│   ├── components/                # React components
│   │   ├── AppLayout.tsx          # Main layout wrapper
│   │   ├── theme-provider.tsx     # Dark/light mode provider
│   │   ├── auth/                  # Authentication screens
│   │   │   ├── LoginModal.tsx
│   │   │   ├── RegisterModal.tsx
│   │   │   ├── InviteModal.tsx
│   │   │   └── InviteView.tsx
│   │   ├── dashboard/             # Role-based dashboards
│   │   │   ├── TeacherDashboard.tsx
│   │   │   ├── ParentDashboard.tsx
│   │   │   └── LearnerDashboard.tsx
│   │   ├── landing/               # Landing page
│   │   │   └── LandingPage.tsx
│   │   ├── layout/                # Layout components
│   │   │   └── Sidebar.tsx
│   │   ├── teacher/               # Teacher-specific views
│   │   │   ├── AssignmentsView.tsx
│   │   │   ├── AttendanceView.tsx
│   │   │   ├── ClassworkView.tsx
│   │   │   ├── HomeworkView.tsx
│   │   │   ├── MarksView.tsx
│   │   │   ├── TestsView.tsx
│   │   │   ├── StarsView.tsx
│   │   │   └── CreateClassModal.tsx
│   │   ├── learner/               # Learner-specific views
│   │   │   └── LearnerAssignmentsView.tsx
│   │   ├── parent/                # Parent-specific views
│   │   │   └── ChildProgressView.tsx
│   │   ├── shared/                # Shared views across roles
│   │   │   ├── ClassDetailsView.tsx
│   │   │   ├── ClassesView.tsx
│   │   │   ├── GradesView.tsx
│   │   │   ├── MessagesView.tsx
│   │   │   └── StudentUploadWidget.tsx
│   │   └── ui/                    # shadcn/ui components
│   │       ├── accordion.tsx
│   │       ├── alert-dialog.tsx
│   │       ├── avatar.tsx
│   │       ├── badge.tsx
│   │       └── ... (50+ UI components)
│   │
│   ├── contexts/                  # React Context providers
│   │   ├── AppContext.tsx         # Global app state
│   │   └── AuthContext.tsx        # Auth state & user info
│   │
│   ├── hooks/                     # Custom React hooks
│   │   ├── use-mobile.tsx         # Responsive hook
│   │   └── use-toast.ts           # Toast notifications
│   │
│   ├── lib/                       # Client libraries
│   │   ├── supabase.ts            # Supabase client init
│   │   ├── api.ts                 # API client & endpoints
│   │   └── utils.ts               # Utility functions
│   │
│   └── pages/                     # Top-level pages
│       ├── Index.tsx              # Main app shell
│       └── NotFound.tsx           # 404 page
│
├── 📁 backend/ - Backend Services
│   ├── data/                      # Local backend data files
│   ├── package.json               # Backend workspace config
│   ├── pom.xml                    # Maven dependencies
│   ├── tsconfig.json              # TypeScript config
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/              # Java source code
│   │   │   │   └── com/schoolapp/
│   │   │   │       ├── controller/
│   │   │   │       ├── service/
│   │   │   │       ├── model/
│   │   │   │       ├── dto/
│   │   │   │       ├── security/
│   │   │   │       └── config/
│   │   │   └── resources/
│   │   │       ├── application.yml   # Spring config
│   │   │       └── schema.sql       # Database schema
│   └── target/                    # Build output
│
├── 📁 infra/ - Infrastructure
│   └── terraform/
│       ├── main.tf                # Main infrastructure
│       ├── variables.tf           # Input variables
│       ├── outputs.tf             # Output values
│       └── README.md              # Terraform guide
│
├── 📁 docs/ - Documentation
│   ├── README.md
│   ├── SUPABASE_SETUP.md          # ✨ Supabase setup guide
│   ├── MIGRATION_SUPABASE_SUMMARY.md  # ✨ Migration notes
│   ├── architecture.md             # System architecture
│   ├── api-spec.md                 # API documentation
│   ├── development.md              # Dev environment setup
│   ├── deployment.md               # Deployment guide
│   ├── attendance-implementation.md
│   ├── attendance-testing-guide.md
│   ├── PROJECT_SETUP.md
│   ├── QUICK_START.md
│   └── progress.md
│
├── 📁 public/ - Static Assets
│   ├── manifest.json              # PWA manifest
│   ├── robots.txt                 # SEO robots file
│   ├── sw.js                      # Service worker
│   └── logo-removebg.png
│
├── 📁 data/ - Demo & Sample Data
│   ├── demo-data-upload-gr12a.csv
│   ├── demo-data-upload-gr12b.csv
│   ├── demo-data-upload-gr8a.csv
│   └── demo-data-append.csv
│
└── 📁 target/ - Build Output (Spring)
    ├── classes/
    └── maven-status/
```

### Database Schema

TriLearn uses **Supabase PostgreSQL**. Key tables include:

- `auth.users` - Managed by Supabase Auth
- `classes` - Classroom information
- `students` - Student-class relationships  
- `teachers` - Teacher information
- `assignments` - Assignment details
- `submissions` - Student submissions
- `marks` - Grade records
- `attendance` - Attendance records
- `messages` - Messaging system
- `notifications` - Push notifications

For complete schema, see `backend/src/main/resources/schema.sql`.

### Environment Variables

#### Frontend (.env.local)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=http://localhost:3000
```

#### Backend (Spring Boot)
```
SPRING_DATASOURCE_URL=postgresql://host:port/database
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=password
JWT_SECRET=your-jwt-secret
```
### Available Scripts

**Frontend**
```bash
npm run dev       # Start Vite dev server
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

**Backend**
```bash
cd backend
mvn spring-boot:run   # Start Spring Boot
mvn clean package     # Build JAR
```

### Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| **Frontend State** | React Context, Tanstack Query |
| **Backend (Auth)** | Node.js, Express, TypeScript |
| **Backend (Main)** | Spring Boot 3.3, Java 21 |
| **Database** | Supabase PostgreSQL |
| **Authentication** | Supabase Auth (JWT) |
| **UI Components** | shadcn/ui (50+ Radix components) |
| **Styling** | Tailwind CSS + CSS-in-JS |
| **Infrastructure** | Terraform (optional) |

### Getting Help

📖 **Documentation**
- [Supabase Setup Guide](docs/SUPABASE_SETUP.md)
- [Architecture Overview](docs/architecture.md)
- [API Specification](docs/api-spec.md)
- [Development Guide](docs/development.md)

🔗 **External Resources**
- [Supabase Docs](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [Spring Boot Docs](https://spring.io/projects/spring-boot)
- [Tailwind CSS](https://tailwindcss.com)

### License

MIT License - See LICENSE file for details

### Contributors

SMAXIS Pty Ltd - Education Technology Team