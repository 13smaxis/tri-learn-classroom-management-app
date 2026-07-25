# Tri-Learn Express Backend 🚀

A fast, lightweight, production-ready Express backend for multi-school classroom management with Supabase.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Create .env file
cp .env.example .env

# 3. Add Supabase credentials to .env
# Edit with your Supabase URL, keys, etc.

# 4. Start development server
npm run dev

# Server runs on http://localhost:3000
```

## Tech Stack

- **Express.js** - Fast web framework
- **TypeScript** - Type safety
- **Supabase** - PostgreSQL + Auth
- **JWT** - Secure authentication
- **Helmet** - Security headers

## Project Structure

```
src/
├── index.ts                 # Main server entry point
├── types/
│   └── index.ts            # TypeScript interfaces
├── middleware/
│   ├── auth.ts             # JWT verification + tenant context
│   └── cors.ts             # CORS configuration
├── services/
│   └── supabase.ts         # Supabase client wrapper
├── routes/
│   ├── auth.ts             # Signup/login endpoints
│   └── teacher.ts          # Teacher CRUD endpoints
└── utils/
    └── logger.ts           # Logging utility
```

## Environment Variables

```env
NODE_ENV=development
PORT=3000

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

JWT_SECRET=your-secret-key
JWT_EXPIRY=24h

CORS_ORIGINS=http://localhost:5173,http://localhost:3000
LOG_LEVEL=debug
```

## API Endpoints

### Authentication (No JWT Required)

```bash
# Signup
POST /api/auth/signup
{
  "email": "teacher@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "teacher",
  "schoolId": "550e8400-e29b-41d4-a716-446655440000"
}

# Login
POST /api/auth/login
{
  "email": "teacher@example.com",
  "password": "SecurePass123!"
}

# Password Reset
POST /api/auth/reset-password
{
  "email": "teacher@example.com"
}

# Health Check
GET /api/auth/health
```

### Teacher Module (JWT Required, role=teacher)

```bash
# Get all classes
GET /api/teacher/classes
Authorization: Bearer YOUR_TOKEN

# Get class details
GET /api/teacher/classes/:classId
Authorization: Bearer YOUR_TOKEN

# Create class
POST /api/teacher/classes
Authorization: Bearer YOUR_TOKEN
{
  "name": "Grade 8A",
  "grade": "8",
  "description": "Mathematics class",
  "room_number": "101"
}

# Update class
PUT /api/teacher/classes/:classId
Authorization: Bearer YOUR_TOKEN
{
  "name": "Grade 8A - Updated"
}

# Record marks
POST /api/teacher/marks
Authorization: Bearer YOUR_TOKEN
{
  "learner_id": "uuid",
  "class_id": "uuid",
  "subject": "Mathematics",
  "mark": 85,
  "total_mark": 100,
  "feedback": "Good work"
}

# Record attendance
POST /api/teacher/attendance
Authorization: Bearer YOUR_TOKEN
{
  "learner_id": "uuid",
  "class_id": "uuid",
  "date": "2024-01-15",
  "status": "present",
  "remarks": "Arrived late"
}

# Get class marks
GET /api/teacher/classes/:classId/marks
Authorization: Bearer YOUR_TOKEN
```

## Testing

### Test Signup

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "firstName": "Test",
    "lastName": "User",
    "role": "teacher",
    "schoolId": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

### Test Protected Endpoint

```bash
# Replace TOKEN with value from signup/login response
curl -X GET http://localhost:3000/api/teacher/classes \
  -H "Authorization: Bearer TOKEN"
```

## Development

```bash
# Development mode (hot reload)
npm run dev

# Build TypeScript
npm run build

# Build and watch
npm run build:watch

# Type checking
npm run type-check

# Linting
npm run lint

# Production run
npm start
```

## Architecture

```
React Frontend (Vite)
    ↓ HTTP + JWT Token
Express Backend (Port 3000)
    ├── Auth Middleware (validates JWT)
    ├── Routes (business logic)
    ├── Services (Supabase operations)
    └── Middleware (CORS, logging)
    ↓ Service Role Key
Supabase PostgreSQL + RLS
```

### Multi-Tenancy

Every request is scoped by `school_id`:
- **Auth Middleware** extracts `schoolId` from JWT token
- **Routes** store tenant context in `req.schoolId`
- **Services** query only current school's data
- **Supabase RLS** provides second-line defense

## Security

✅ JWT validation on all protected routes
✅ Role-based access control (RBAC)
✅ CORS configured
✅ Helmet for security headers
✅ SQL injection prevention (Supabase + parameterized queries)
✅ Input validation
✅ Service role key never exposed to frontend

## Deployment

### Vercel (Easiest)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Railway

1. Push to GitHub
2. Connect to Railway
3. Set environment variables
4. Deploy

### Render

1. Push to GitHub
2. Create new Web Service on Render
3. Connect to GitHub repo
4. Set environment variables
5. Deploy

## Common Issues

### "PORT already in use"
```bash
# Kill process on port 3000
# Mac/Linux:
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill

# Or change PORT in .env
PORT=3001
```

### "SUPABASE_URL not configured"
- Check .env file has correct Supabase URL
- Make sure you're in project root directory

### "Invalid token"
- Check JWT_SECRET matches between signup and verification
- Token may have expired (24 hour default)
- Authorization header must be: `Bearer <token>` (with space)

### "You do not own this class"
- Only teacher who created class can modify it
- Check you're using correct teacher account
- Verify classId matches your classes

## Next Steps

1. ✅ Backend running
2. ⬜ Add Parent module routes (similar to teacher)
3. ⬜ Add Learner module routes
4. ⬜ Connect frontend to backend API
5. ⬜ Add ML integration endpoints

## Contributing

This is a team project. Follow these guidelines:

- Use TypeScript (strict mode)
- Follow existing patterns
- Add logging with `logger.debug/info/warn/error`
- Test endpoints before committing
- Write meaningful commit messages

## Support

- 📧 Email: support@tri-learn.app
- 💬 Chat: [Your Slack/Discord]
- 📚 Docs: README.md in each folder

---

**Built with ❤️ by SMAXIS Pty Ltd**
