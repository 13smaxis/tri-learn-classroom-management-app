# API Specification

## Base URL
- **Development**: `http://localhost:3000/api`
- **Production**: `https://api.schoolapp.com`

## Authentication

All authenticated endpoints require an `Authorization` header:
```
Authorization: Bearer <JWT_TOKEN>
```

## Response Format

### Success Response (200, 201)
```json
{
  "success": true,
  "data": { /* response data */ },
  "timestamp": "2024-01-29T10:30:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": { /* optional */ }
  },
  "timestamp": "2024-01-29T10:30:00Z"
}
```

---

## Authentication Endpoints

### Register User
```
POST /auth/register
Content-Type: application/json

{
  "email": "teacher@example.com",
  "password": "secure_password",
  "firstName": "John",
  "lastName": "Doe",
  "role": "teacher" | "parent" | "learner"
}

Response: 201 Created
{
  "success": true,
  "data": {
    "userId": "user-id",
    "email": "teacher@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "teacher",
    "token": "jwt-token"
  }
}
```

### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "teacher@example.com",
  "password": "secure_password"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "user": { /* user object */ },
    "token": "jwt-token",
    "expiresIn": 86400
  }
}
```

### Get Current User
```
GET /auth/me
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": { /* user object */ }
}
```

### Logout
```
POST /auth/logout
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Refresh Token
```
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "refresh-token"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "token": "new-jwt-token",
    "expiresIn": 86400
  }
}
```

---

## Class Management Endpoints

### Create Class (Teacher)
```
POST /class/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Mathematics 101",
  "grade": "Grade 10",
  "subject": "Mathematics",
  "tools": [
    {"name": "attendance", "enabled": true},
    {"name": "homework", "enabled": true},
    {"name": "assignments", "enabled": true},
    {"name": "marks", "enabled": true},
    {"name": "monitor", "enabled": true}
  ]
}

Response: 201 Created
{
  "success": true,
  "data": {
    "classId": "class-id",
    "name": "Mathematics 101",
    "grade": "Grade 10",
    "subject": "Mathematics",
    "parentInviteToken": "parent-invite-token",
    "learnerInviteToken": "learner-invite-token",
    "parentInviteLink": "https://schoolapp.com/join/parent/...",
    "learnerInviteLink": "https://schoolapp.com/join/learner/...",
    "createdAt": "2024-01-29T10:30:00Z"
  }
}
```

### Get Class Details
```
GET /class/:classId
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "classId": "class-id",
    "name": "Mathematics 101",
    "grade": "Grade 10",
    "subject": "Mathematics",
    "teacherId": "teacher-id",
    "studentCount": 30,
    "passRate": 85,
    "classAverage": 72.5,
    "tools": [ /* enabled tools */ ],
    "createdAt": "2024-01-29T10:30:00Z"
  }
}
```

### Update Class
```
PUT /class/:classId
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Advanced Mathematics",
  "tools": [
    {"name": "attendance", "enabled": true},
    /* ... other tools */
  ]
}

Response: 200 OK
{
  "success": true,
  "data": { /* updated class object */ }
}
```

### List Class Students
```
GET /class/:classId/students
Authorization: Bearer <token>

Query Parameters:
- page: number (default: 1)
- limit: number (default: 20)
- search: string (optional)

Response: 200 OK
{
  "success": true,
  "data": {
    "students": [
      {
        "learnerId": "learner-id",
        "firstName": "Jane",
        "lastName": "Doe",
        "email": "jane@example.com",
        "joinedAt": "2024-01-29T10:30:00Z"
      }
      /* ... more students */
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 30
    }
  }
}
```

### Join Class (Parent/Learner)
```
POST /class/join
Authorization: Bearer <token>
Content-Type: application/json

{
  "inviteToken": "invite-token"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "classId": "class-id",
    "name": "Mathematics 101",
    "grade": "Grade 10",
    "subject": "Mathematics"
  }
}
```

---

## Marks Management Endpoints

### Record Marks
```
POST /marks/record
Authorization: Bearer <token>
Content-Type: application/json

{
  "classId": "class-id",
  "learnerId": "learner-id",
  "classWorks": [15, 18, 16],  // Multiple class work marks (out of 20)
  "assignment1": 18,            // out of 20
  "assignment2": 19,            // out of 20
  "exam": 75                     // out of 100
}

Response: 201 Created
{
  "success": true,
  "data": {
    "markId": "mark-id",
    "classId": "class-id",
    "learnerId": "learner-id",
    "classWorks": [15, 18, 16],
    "assignment1": 18,
    "assignment2": 19,
    "exam": 75,
    "finalMark": 72.1,  // Calculated: (17 * 0.1) + (18 * 0.25) + (19 * 0.25) + (75 * 0.4)
    "recordedAt": "2024-01-29T10:30:00Z"
  }
}
```

### Get Class Marks Report
```
GET /class/:classId/marks
Authorization: Bearer <token>

Query Parameters:
- sortBy: "finalMark" | "classWorks" (default: "finalMark")
- order: "asc" | "desc" (default: "desc")

Response: 200 OK
{
  "success": true,
  "data": {
    "classId": "class-id",
    "classAverage": 72.5,
    "passRate": 85,
    "atRiskLearners": [
      {
        "learnerId": "learner-id",
        "firstName": "Jane",
        "lastName": "Doe",
        "finalMark": 45
      }
    ],
    "marks": [
      {
        "learnerId": "learner-id",
        "firstName": "John",
        "lastName": "Smith",
        "finalMark": 82.3,
        /* ... other mark components */
      }
      /* ... more learners */
    ]
  }
}
```

### Get Student Marks
```
GET /class/:classId/marks/:learnerId
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "learnerId": "learner-id",
    "firstName": "John",
    "lastName": "Smith",
    "marks": [
      {
        "recordDate": "2024-01-15",
        "classWorks": [15, 18, 16],
        "assignment1": 18,
        "assignment2": 19,
        "exam": 75,
        "finalMark": 72.1
      },
      /* ... more records */
    ],
    "trend": "improving" | "stable" | "declining"
  }
}
```

### Update Marks
```
PUT /marks/:markId
Authorization: Bearer <token>
Content-Type: application/json

{
  "classWorks": [16, 18, 17],
  "assignment1": 19,
  "assignment2": 20,
  "exam": 78
}

Response: 200 OK
{
  "success": true,
  "data": { /* updated marks object */ }
}
```

---

## Messaging Endpoints

### Send Message
```
POST /messages/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "classId": "class-id",
  "content": "Hello everyone!",
  "recipients": ["all"] | ["parents"] | ["learners"] | ["learner-id", "parent-id"]
}

Response: 201 Created
{
  "success": true,
  "data": {
    "messageId": "message-id",
    "senderId": "sender-id",
    "classId": "class-id",
    "content": "Hello everyone!",
    "recipients": ["all"],
    "createdAt": "2024-01-29T10:30:00Z"
  }
}
```

### Get Class Messages
```
GET /class/:classId/messages
Authorization: Bearer <token>

Query Parameters:
- page: number (default: 1)
- limit: number (default: 50)

Response: 200 OK
{
  "success": true,
  "data": {
    "messages": [
      {
        "messageId": "message-id",
        "senderId": "sender-id",
        "senderName": "John Doe",
        "content": "Hello everyone!",
        "createdAt": "2024-01-29T10:30:00Z",
        "readBy": ["user-id-1", "user-id-2"]
      }
      /* ... more messages */
    ],
    "pagination": { /* ... */ }
  }
}
```

### Mark Message as Read
```
PUT /messages/:messageId/read
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "messageId": "message-id",
    "readBy": ["user-id-1", "user-id-2"]
  }
}
```

---

## Notification Endpoints

### Get User Notifications
```
GET /notifications
Authorization: Bearer <token>

Query Parameters:
- page: number (default: 1)
- limit: number (default: 20)
- unreadOnly: boolean (default: false)

Response: 200 OK
{
  "success": true,
  "data": {
    "notifications": [
      {
        "notificationId": "notif-id",
        "title": "New Mark Recorded",
        "message": "Your marks for Assignment 1 have been recorded",
        "type": "info",
        "read": false,
        "actionUrl": "/class/class-id/marks",
        "createdAt": "2024-01-29T10:30:00Z"
      }
      /* ... more notifications */
    ],
    "unreadCount": 5,
    "pagination": { /* ... */ }
  }
}
```

### Mark Notification as Read
```
PUT /notifications/:notificationId/read
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "notificationId": "notif-id",
    "read": true
  }
}
```

---

## Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `INVALID_CREDENTIALS` | 401 | Email or password is incorrect |
| `UNAUTHORIZED` | 401 | No valid authentication token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `DUPLICATE_EMAIL` | 409 | Email already exists |
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Rate Limiting

- **General**: 100 requests per minute per IP
- **Auth endpoints**: 10 requests per minute per IP
- **File upload**: 50 MB per request, 5 GB per day per user

---

## Pagination

Endpoints with list responses support pagination:

```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

Query with pagination:
```
GET /api/endpoint?page=2&limit=50
```
