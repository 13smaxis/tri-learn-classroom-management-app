# Architecture Overview

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                Frontend (PWA)                            │
│  React + Vite + Tailwind CSS                            │
│  Responsive (Mobile, Tablet, Laptop)                    │
│  Hosted on AWS S3 + CloudFront                          │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS
                     ↓
┌─────────────────────────────────────────────────────────┐
│         API Gateway (AWS)                                │
│  Request routing, authentication, throttling            │
└────────────┬─────────────────────────────────┬──────────┘
             │                                 │
             ↓                                 ↓
    ┌─────────────────────┐        ┌─────────────────────┐
    │  Lambda Functions   │        │  Authentication     │
    │  (Microservices)    │        │  (AWS Cognito)      │
    │                     │        │                     │
    │ - Auth Service      │        │ - User Pools        │
    │ - Class Service     │        │ - RBAC              │
    │ - Marks Service     │        │ - Tokens            │
    │ - Messaging Service │        │                     │
    │ - Notification Srvc │        └─────────────────────┘
    └────────┬────────────┘
             │
      ┌──────┴──────┐
      ↓             ↓
┌──────────────┐ ┌──────────────────┐
│  Database    │ │  Storage         │
│              │ │                  │
│ DynamoDB/RDS │ │ S3 Bucket        │
│  - Users     │ │  - Documents     │
│  - Classes   │ │  - Images        │
│  - Marks     │ │  - Assignments   │
│  - Messages  │ │                  │
└──────────────┘ └──────────────────┘

             ↓
┌──────────────────────────────────┐
│  Notifications & Messaging       │
│  - SNS (Email, SMS)              │
│  - SES (Email)                   │
│  - WebSocket/Real-time (SQS)     │
└──────────────────────────────────┘
```

## Component Architecture

### Frontend Structure
```
src/
├── components/          # Reusable UI components
│   ├── DashboardLayout  # Main dashboard wrapper
│   ├── Sidebar          # Navigation sidebar
│   ├── TopBar           # Header with notifications
│   ├── Cards            # Card components
│   ├── Forms            # Form components
│   └── ...
│
├── pages/               # Full page components
│   ├── LoginPage        # Authentication page
│   ├── teacher/         # Teacher role pages
│   │   ├── Dashboard
│   │   ├── ClassSetup
│   │   ├── MarkEntry
│   │   └── ...
│   ├── parent/          # Parent role pages
│   ├── learner/         # Learner role pages
│   └── ...
│
├── context/             # Global state management
│   ├── AuthContext      # User authentication state
│   ├── UserContext      # User data
│   └── NotificationContext
│
├── hooks/               # Custom React hooks
│   ├── useAuth          # Authentication hook
│   ├── useClass         # Class management
│   └── ...
│
├── services/            # API service layer
│   ├── api.ts           # Axios instance
│   ├── auth.ts          # Auth API calls
│   ├── class.ts         # Class API calls
│   └── ...
│
├── utils/               # Utility functions
│   ├── pwa.ts           # PWA utilities
│   ├── format.ts        # Formatting helpers
│   └── ...
│
└── styles/              # CSS and Tailwind config
    └── index.css        # Global styles
```

### Backend Services Structure
```
backend/
├── services/
│   ├── auth-service/
│   │   └── src/
│   │       ├── index.ts         # Express app setup
│   │       ├── service.ts       # Business logic
│   │       ├── routes.ts        # API routes
│   │       └── controller.ts    # Request handlers
│   │
│   ├── class-service/
│   │   └── src/
│   │       ├── index.ts
│   │       ├── service.ts
│   │       ├── routes.ts
│   │       └── controller.ts
│   │
│   ├── marks-service/
│   ├── messaging-service/
│   └── notification-service/
│
├── shared/
│   ├── models/          # Data models/interfaces
│   ├── middleware/      # Express middleware
│   └── utils/           # Shared utilities
│
└── infra/               # Infrastructure as Code
    ├── terraform/       # Terraform configs
    └── cloudformation/  # CloudFormation templates
```

## Data Flow

### User Registration Flow
```
User (Frontend)
     ↓
[Register Form]
     ↓
API POST /auth/register
     ↓
[Auth Service]
     ↓
AWS Cognito (Create User Pool)
     ↓
DynamoDB (Store User Record)
     ↓
Return JWT Token + User Data
     ↓
[Store in LocalStorage]
     ↓
Redirect to Role-Based Dashboard
```

### Class Creation Flow (Teacher)
```
Teacher
     ↓
[Class Setup Form]
     ↓
API POST /class/create
     ↓
[Class Service]
     ↓
DynamoDB (Create Class Record)
     ↓
Generate Invite Tokens
     ↓
S3 (Store Class Documents)
     ↓
Return Class Data + Invite Links
     ↓
Teacher shares links with Parents/Learners
```

### Mark Entry Flow
```
Teacher
     ↓
[Mark Entry Form]
     ↓
API POST /marks/record
     ↓
[Marks Service]
     ↓
Validate Mark Components
     ↓
Calculate Final Mark (10% + 25% + 25% + 40%)
     ↓
DynamoDB (Store Marks)
     ↓
Calculate Pass Rate & Class Average
     ↓
Trigger Notification (SNS)
     ↓
Notify Parent & Learner
```

## Database Schema (DynamoDB)

### Users Table
```
PK: userId
SK: email
Attributes:
  - firstName, lastName
  - role (teacher|parent|learner)
  - linkedClassIds (list)
  - linkedLearnerId (for parents)
  - createdAt, updatedAt
```

### Classes Table
```
PK: classId
SK: teacherId
Attributes:
  - name, subject, grade
  - studentCount
  - parentInviteToken, learnerInviteToken
  - tools (array of enabled tools)
  - passRate, classAverage
  - createdAt, updatedAt
```

### Marks Table
```
PK: classId
SK: learnerId#date
Attributes:
  - classWorks (array)
  - assignment1, assignment2
  - exam
  - finalMark (calculated)
  - recordedAt
```

### Messages Table
```
PK: classId
SK: messageId
Attributes:
  - senderId, content
  - recipients (list)
  - attachments
  - readBy (set)
  - createdAt
```

## API Endpoints (Overview)

### Authentication Service
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout user
- `GET /auth/me` - Get current user
- `POST /auth/refresh` - Refresh JWT token

### Class Service
- `POST /class/create` - Create new class
- `GET /class/:classId` - Get class details
- `PUT /class/:classId` - Update class
- `GET /class/:classId/students` - List class students
- `POST /class/:classId/join` - Join class (with invite token)

### Marks Service
- `POST /marks/record` - Record marks for student
- `GET /marks/:classId` - Get class marks report
- `GET /marks/:classId/:learnerId` - Get student marks
- `PUT /marks/:markId` - Update marks

### Messaging Service
- `POST /messages/send` - Send message
- `GET /messages/:classId` - Get class messages
- `PUT /messages/:messageId/read` - Mark message as read

### Notification Service
- `GET /notifications/:userId` - Get user notifications
- `PUT /notifications/:notificationId/read` - Mark as read

## Deployment Architecture

### Development
- Local frontend: http://localhost:5173
- Local backend: http://localhost:3000
- Local database: DynamoDB Local

### Production (AWS)
```
Route 53 (DNS)
    ↓
CloudFront (CDN)
    ↓
S3 (Static hosting)
    ↓
CloudFront → API Gateway
            ↓
        Lambda Functions
            ↓
        DynamoDB, RDS
```

## Security

### Authentication
- AWS Cognito with JWT tokens
- Token stored in secure localStorage
- Automatic token refresh

### Authorization
- Role-based access control (RBAC)
- Middleware-level permission checks
- Database-level ownership validation

### Data Protection
- HTTPS/TLS for all communications
- Encryption at rest (DynamoDB, S3)
- CORS policy enforcement
- API rate limiting (API Gateway)

### Input Validation
- Zod schema validation on backend
- Client-side validation (React)
- SQL injection prevention (DynamoDB, ORM)

## Scaling Considerations

1. **Frontend**: CloudFront caching, lazy loading, code splitting
2. **Backend**: Lambda auto-scaling, API Gateway throttling
3. **Database**: DynamoDB on-demand billing, read replicas for RDS
4. **Storage**: S3 lifecycle policies, CloudFront caching
5. **Messaging**: SNS/SQS for async processing

## Monitoring & Logging

- CloudWatch Logs for all services
- CloudWatch Metrics for performance
- X-Ray for distributed tracing
- Application Insights for errors

## Future Enhancements

1. Real-time messaging with WebSocket (API Gateway + Lambda)
2. Advanced analytics and reporting (QuickSight)
3. Video streaming for classes (CloudFront + Lambda@Edge)
4. Integration with external LMS systems
5. Mobile app (React Native)
