# Development Setup Guide

## Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Git**: Latest version
- **AWS CLI**: Configured with credentials
- **Docker** (optional): For local DynamoDB
- **Code Editor**: VS Code recommended

## Initial Setup

### 1. Clone & Install Dependencies

```bash
# Clone repository
git clone <repository-url>
cd school-app

# Install monorepo dependencies
npm install

# Install frontend dependencies
npm install -w frontend

# Install backend dependencies
npm install -w backend
```

### 2. Environment Variables

#### Frontend (.env.local)
```bash
cd frontend
cp .env.example .env.local
```

Edit `frontend/.env.local`:
```
VITE_API_BASE_URL=http://localhost:3000
VITE_AWS_REGION=eu-west-1
VITE_COGNITO_USER_POOL_ID=your-pool-id
VITE_COGNITO_CLIENT_ID=your-client-id
VITE_COGNITO_DOMAIN=your-domain
```

#### Backend (.env.local)
```bash
cd backend
cp .env.example .env.local
```

Edit `backend/.env.local`:
```
NODE_ENV=development
PORT=3000
AWS_REGION=eu-west-1
COGNITO_USER_POOL_ID=your-pool-id
JWT_SECRET=your-local-secret
```

### 3. Start Development Server

#### Terminal 1 - Frontend

```bash
cd frontend
npm run dev
```

Frontend will be available at: `http://localhost:5173`

#### Terminal 2 - Backend

```bash
cd backend
npm run dev
```

Backend will be available at: `http://localhost:3000`

## Project Structure Review

```
school-app/
├── frontend/                 # React PWA
│   ├── src/
│   │   ├── components/       # UI Components
│   │   ├── pages/            # Page components (auth, dashboards)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API services
│   │   ├── context/          # Global state
│   │   └── styles/           # CSS & Tailwind
│   └── vite.config.ts        # Vite configuration
│
├── backend/
│   ├── services/             # Microservices
│   │   ├── auth-service/
│   │   ├── class-service/
│   │   ├── marks-service/
│   │   ├── messaging-service/
│   │   └── notification-service/
│   ├── shared/               # Shared code
│   │   ├── models/           # Data models
│   │   ├── middleware/       # Express middleware
│   │   └── utils/            # Helper functions
│   └── package.json
│
├── docs/                     # Documentation
├── infra/                    # Infrastructure as Code
└── README.md
```

## Development Workflow

### Creating a Feature

1. **Create feature branch**
```bash
git checkout -b feature/user-registration
```

2. **Develop feature**
   - Frontend: Add components in `src/components/` or `src/pages/`
   - Backend: Add service logic and API endpoints

3. **Test locally**
```bash
# Frontend
npm run dev -w frontend

# Backend
npm run dev -w backend

# Run tests
npm test -w frontend
npm test -w backend
```

4. **Commit changes**
```bash
git add .
git commit -m "feat: add user registration flow"
```

5. **Push and create PR**
```bash
git push origin feature/user-registration
```

### Key Development Tasks

#### Adding a Frontend Component

**Example: Creating a button component**

```bash
# Create component file
touch frontend/src/components/Button.tsx
```

```typescript
// frontend/src/components/Button.tsx
interface ButtonProps {
  label: string
  onClick?: () => void
  variant?: 'primary' | 'secondary'
  disabled?: boolean
}

export default function Button({ 
  label, 
  onClick, 
  variant = 'primary', 
  disabled = false 
}: ButtonProps) {
  const baseClass = 'btn'
  const variantClass = variant === 'primary' ? 'btn-primary' : 'btn-secondary'
  
  return (
    <button 
      className={`${baseClass} ${variantClass}`}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  )
}
```

#### Adding Backend API Endpoint

**Example: Creating a class endpoint**

```typescript
// backend/services/class-service/src/routes.ts
import express from 'express'
import { classController } from './controller'
import { authMiddleware, roleMiddleware } from '../../shared/middleware'

const router = express.Router()

// Create class (teacher only)
router.post(
  '/create',
  authMiddleware,
  roleMiddleware(['teacher']),
  classController.create
)

// Get class details
router.get(
  '/:classId',
  authMiddleware,
  classController.getDetails
)

export default router
```

## Common Development Commands

### Frontend Commands

```bash
# Start development server
npm run dev -w frontend

# Build for production
npm run build -w frontend

# Run tests
npm test -w frontend

# Lint code
npm run lint -w frontend

# Type check
npm run type-check -w frontend
```

### Backend Commands

```bash
# Start development server
npm run dev -w backend

# Build for production
npm run build -w backend

# Run tests
npm test -w backend

# Lint code
npm run lint -w backend
```

## Database Setup (Local Development)

### Using DynamoDB Local

```bash
# Install DynamoDB Local
npm install -g dynamodb-local

# Start DynamoDB Local
dynamodb-local -sharedDb

# Verify it's running
curl http://localhost:8000
```

### Using Docker

```bash
# Pull DynamoDB Docker image
docker pull amazon/dynamodb-local

# Start container
docker run -p 8000:8000 amazon/dynamodb-local

# Create tables
npm run db:init
```

## Testing

### Frontend Testing

```bash
# Run all tests
npm test -w frontend

# Run tests in watch mode
npm test -w frontend -- --watch

# Generate coverage report
npm test -w frontend -- --coverage
```

### Backend Testing

```bash
# Run all tests
npm test -w backend

# Run specific test file
npm test -w backend -- src/auth.test.ts

# Run with coverage
npm test -w backend -- --coverage
```

## Debugging

### Frontend Debugging

1. **React DevTools Browser Extension**
   - Install React DevTools for Chrome/Firefox
   - Debug component state and props

2. **VS Code Debugger**
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/frontend"
    }
  ]
}
```

### Backend Debugging

```bash
# Start with debugging enabled
node --inspect-brk node_modules/.bin/tsx src/index.ts

# Then open: chrome://inspect
```

## Code Style & Standards

### ESLint Configuration

Both frontend and backend use ESLint:

```bash
# Check code style
npm run lint -w frontend
npm run lint -w backend

# Auto-fix issues
npx eslint --fix src/
```

### Prettier (Optional)

```bash
npm install -D prettier

# Format code
npx prettier --write src/
```

## Troubleshooting

### Port Already in Use

```bash
# Windows - Find and kill process
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :5173
kill -9 <PID>
```

### Module Not Found

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### AWS Credentials Issues

```bash
# Configure AWS CLI
aws configure

# Verify credentials
aws sts get-caller-identity

# Set environment variables
export AWS_ACCESS_KEY_ID=your-key
export AWS_SECRET_ACCESS_KEY=your-secret
export AWS_REGION=eu-west-1
```

## Git Workflow

### Branch Naming Convention

- `feature/description` - New features
- `bugfix/description` - Bug fixes
- `refactor/description` - Code refactoring
- `docs/description` - Documentation updates

### Commit Message Convention

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat` - Feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Code style
- `refactor` - Refactoring
- `test` - Tests
- `chore` - Build/tooling

**Example:**
```
feat(auth): implement JWT token validation

Add JWT validation middleware to protect API routes.
Integrate with AWS Cognito for token verification.

Closes #123
```

## Performance Optimization Tips

### Frontend

- ✅ Code splitting with React.lazy()
- ✅ Image optimization with next-gen formats
- ✅ PWA caching strategies
- ✅ Lazy load components
- ✅ Monitor bundle size: `npm run build:analyze`

### Backend

- ✅ Use connection pooling for databases
- ✅ Implement caching strategies
- ✅ Optimize database queries
- ✅ Use async/await for I/O operations
- ✅ Monitor Lambda cold starts

## Documentation

When adding new features, update:
- Code comments for complex logic
- API documentation in `docs/api-spec.md`
- Architecture diagrams if applicable
- README section for new features

## Getting Help

- **Documentation**: Check `docs/` folder
- **API Specs**: See `docs/api-spec.md`
- **Architecture**: See `docs/architecture.md`
- **Slack**: #school-app-dev
- **Issues**: GitHub Issues

## Next Steps

1. Run the development servers
2. Explore the project structure
3. Review the API specification
4. Check the architecture documentation
5. Create your first feature branch

Happy coding! 🚀
