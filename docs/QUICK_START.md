# QUICK START GUIDE

## 🚀 Get Up and Running in 5 Minutes

### Step 1: Install Dependencies (2 min)
```bash
cd school-app
npm install
```

### Step 2: Setup Environment (1 min)
```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your AWS credentials (if you have them)
# For now, you can skip this - defaults will work for local development
```

### Step 3: Start Frontend (1 min - Terminal 1)
```bash
cd frontend
npm run dev
```
✅ Frontend ready at: http://localhost:5173

### Step 4: Start Backend (1 min - Terminal 2)
```bash
cd backend
npm run dev
```
✅ Backend ready at: http://localhost:3000

---

## 🎯 What You Can Do Now

### Test the Login Page
Visit http://localhost:5173 and see the responsive login/register page

### Explore the Code
- **Frontend**: `frontend/src/` - React components
- **Backend**: `backend/services/` - API services
- **Models**: `backend/shared/models/index.ts` - Data structures
- **Docs**: `docs/` - Full documentation

### Try the API
```bash
# Health check
curl http://localhost:3000/health

# API info
curl http://localhost:3000/api
```

---

## 📖 Important Documentation

Read these in order:

1. **PROJECT_SETUP.md** (this file) - Overview
2. **docs/architecture.md** - System design
3. **docs/api-spec.md** - API endpoints
4. **docs/development.md** - Development workflow
5. **docs/deployment.md** - AWS deployment

---

## 🔑 Key Files to Know

**Frontend**
- `frontend/src/App.tsx` - Main app & routing
- `frontend/src/pages/LoginPage.tsx` - Login UI
- `frontend/src/components/DashboardLayout.tsx` - Dashboard layout
- `frontend/vite.config.ts` - Vite & PWA config

**Backend**
- `backend/services/auth-service/src/index.ts` - API server
- `backend/shared/models/index.ts` - Data models
- `backend/shared/middleware/index.ts` - Auth & error handling

**Infrastructure**
- `infra/terraform/main.tf` - AWS infrastructure

**Documentation**
- `docs/api-spec.md` - Complete API documentation
- `docs/architecture.md` - System architecture
- `docs/deployment.md` - AWS deployment guide

---

## 🏗️ Architecture Quick View

```
Your App
    ├─ Frontend (React + PWA)
    │  └─ http://localhost:5173
    │
    └─ Backend (Node.js + Express)
       ├─ Auth Service
       ├─ Class Service
       ├─ Marks Service
       ├─ Messaging Service
       └─ Notification Service
       └─ http://localhost:3000
```

---

## 🔐 Three User Roles

### 1. **Teacher** 👨‍🏫
- Register and set up classes
- Manage students
- Record marks (10% + 25% + 25% + 40% formula)
- Track attendance
- Assign homework/assignments
- Monitor class performance
- Communicate with parents & learners

### 2. **Parent** 👨‍👩‍👧
- Join child's class via link
- View child's progress
- See marks and assignments
- Communicate with teacher
- Get notifications

### 3. **Learner** 👨‍🎓
- Join class via link
- View assignments
- Submit work
- Check marks
- Communicate with teacher
- Download resources

---

## 📚 Project Structure

```
school-app/
│
├── frontend/              # React PWA
│   ├── src/
│   │   ├── App.tsx        # Main component
│   │   ├── components/    # UI components
│   │   ├── pages/         # Pages
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API services
│   │   └── styles/        # CSS & Tailwind
│   ├── vite.config.ts     # Vite config
│   └── package.json
│
├── backend/               # Node.js services
│   ├── services/          # Microservices
│   │   ├── auth-service/
│   │   ├── class-service/
│   │   ├── marks-service/
│   │   └── ... (more services)
│   ├── shared/            # Shared code
│   │   ├── models/        # TypeScript interfaces
│   │   ├── middleware/    # Auth, errors
│   │   └── utils/         # Helpers
│   └── package.json
│
├── docs/                  # Documentation
│   ├── architecture.md    # System design
│   ├── api-spec.md        # API docs
│   ├── deployment.md      # AWS setup
│   └── development.md     # Dev workflow
│
├── infra/                 # Infrastructure
│   └── terraform/         # AWS IaC
│
└── README.md              # Project overview
```

---

## 🛠️ Common Commands

**Frontend**
```bash
cd frontend
npm run dev      # Start dev server
npm run build    # Build for production
npm test         # Run tests
npm run lint     # Check code style
```

**Backend**
```bash
cd backend
npm run dev      # Start dev server
npm run build    # Build for production
npm test         # Run tests
npm run lint     # Check code style
```

---

## 🌐 Next Steps

### Immediate (Next Hour)
- [ ] Explore the codebase
- [ ] Read `docs/architecture.md`
- [ ] Review `docs/api-spec.md`

### Short Term (This Week)
- [ ] Set up AWS account if needed
- [ ] Configure AWS credentials
- [ ] Integrate AWS Cognito
- [ ] Implement login functionality

### Medium Term (This Month)
- [ ] Deploy infrastructure with Terraform
- [ ] Implement core API endpoints
- [ ] Build teacher dashboard
- [ ] Build parent/learner dashboards
- [ ] Create mark entry system

### Long Term (This Quarter)
- [ ] Full feature implementation
- [ ] Comprehensive testing
- [ ] Performance optimization
- [ ] Security hardening
- [ ] Production deployment

---

## 💡 Tips for Success

1. **Read the Docs** - Everything you need is documented
2. **Follow the Architecture** - It's designed for scalability
3. **Use TypeScript** - Catch errors early with types
4. **Test as You Build** - Prevents issues later
5. **Keep Services Separate** - Each service has one job
6. **Start Small** - Implement one feature at a time

---

## 🤔 FAQ

**Q: Do I need AWS now?**
A: No, development works locally. AWS is for production deployment.

**Q: Where's the database?**
A: DynamoDB is configured in Terraform. Use DynamoDB Local for development.

**Q: How do I add a new feature?**
A: See `docs/development.md` for detailed workflow.

**Q: What about authentication?**
A: Cognito integration instructions are in `docs/deployment.md`.

**Q: Can I customize the mark calculation?**
A: Yes! Edit the formula in `backend/shared/utils/index.ts`

---

## 📞 Need Help?

1. **Architecture Questions**: Read `docs/architecture.md`
2. **API Questions**: Check `docs/api-spec.md`
3. **Deployment Questions**: See `docs/deployment.md`
4. **Development Questions**: Visit `docs/development.md`
5. **Code Questions**: Check the TypeScript interfaces in `backend/shared/models/`

---

## 🎯 Your Next Action

**Choose one:**

### Option A: Learn the Architecture
```bash
# Open and read the architecture document
# It explains how everything works
docs/architecture.md
```

### Option B: Start Coding
```bash
# Pick a feature and start implementing
# Frontend: Create a new page in src/pages/
# Backend: Add an endpoint in services/
```

### Option C: Deploy Infrastructure
```bash
# Set up AWS resources
cd infra/terraform
terraform init
terraform plan
```

---

## ✨ You're All Set!

Your school app is ready for development. Everything is structured, documented, and ready to scale.

**Start with**: Read `docs/development.md` for the full workflow.

Happy coding! 🚀

---

**Questions?** Check the docs folder for detailed answers.
**Ready to code?** Start with the development guide.
**Need AWS?** Follow the deployment guide.
