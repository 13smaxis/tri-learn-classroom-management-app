# Fix for 403 Forbidden Error in Homework Module

## Problem
When clicking on the homework tile in the dashboard or navigating to the homework view, users were getting a "Request failed with status 403 Failed to load homework details" error.

## Root Cause
Spring Security was returning 403 (Forbidden) responses with empty body text, making it impossible for the frontend to display meaningful error messages or determine the actual cause of the authentication failure.

## Solutions Implemented

### 1. Backend: Enhanced Security Exception Handling
**File:** `backend/spring-backend/src/main/java/com/schoolapp/config/SecurityConfig.java`

- Added `authenticationEntryPoint` to handle 401 responses with proper JSON body
- Added `accessDeniedHandler` to handle 403 responses with proper JSON body
- Now returns meaningful error messages instead of empty responses:
  - 401: "Authentication required – please log in again"
  - 403: "Access denied – insufficient permissions"

**Impact:** Frontend can now display actual error messages and determine if the issue is authentication or authorization.

### 2. Backend: Enhanced JWT Filter Logging
**File:** `backend/spring-backend/src/main/java/com/schoolapp/security/JwtAuthFilter.java`

Added comprehensive debug logging:
- Logs successful JWT authentication
- Logs when JWT token is invalid or expired
- Logs when user from token is not found in database
- Logs when no Bearer token is provided
- Includes request URI for context

**Impact:** Server logs now show exactly what's happening during authentication, enabling easier debugging.

### 3. Backend: Enabled Security Debug Logging
**File:** `backend/spring-backend/src/main/resources/application.yml`

Added logging configuration:
```yaml
logging:
  level:
    com.schoolapp.security: DEBUG
```

**Impact:** Debug messages from JWT filter are now visible in application logs.

### 4. Frontend: Improved API Error Handling
**File:** `src/lib/api.ts`

Enhancements to the `request()` function:
- Explicit handling of 401 responses: auto-clears auth token
- Extracts error messages from JSON response body
- Shows meaningful error text to user instead of generic messages
- Only sends `Content-Type: application/json` header when there's a request body (prevents unnecessary CORS preflight for GET requests)

**Impact:** Frontend can show users exactly what went wrong and auto-logout on expired tokens.

### 5. Frontend: Better Error Display in Homework View
**File:** `src/components/teacher/HomeworkView.tsx`

Changed error display:
- Instead of static "Failed to load homework details."
- Now shows the actual error message from the API
- This provides users with meaningful feedback

**Impact:** Users see the real problem (e.g., session expired) instead of generic error text.

## Steps to Apply the Fix

### 1. Restart Spring Backend
Since Java files were modified, the backend must be restarted:
- Stop the running Spring application in IntelliJ
- Go to Build > Rebuild Project
- Start the Spring backend again

### 2. Clear Browser Storage
Old invalid tokens might be cached:
- Press F12 to open Developer Tools
- Go to Application → Local Storage
- Delete the `authToken` entry
- Refresh the page

### 3. Test the Fix
1. Log in with valid credentials
2. Navigate to the Homework view
3. Select a class and try to view homework
4. If errors occur, they should now display meaningful messages

## Expected Error Messages After Fix

If authentication fails, you'll now see one of:
- "Session expired – please log in again" (expired or invalid token)
- "Access denied – insufficient permissions" (valid user but no permission for this resource)
- More specific error message from the API

## Server Log Examples

When debugging, check the Spring Boot logs for messages like:
```
DEBUG com.schoolapp.security.JwtAuthFilter - JWT auth success for user abc123 on /homework/count
DEBUG com.schoolapp.security.JwtAuthFilter - JWT token invalid/expired for /homework/count
WARN com.schoolapp.security.JwtAuthFilter - JWT valid but user not found: abc123 for /homework/count
```

## Additional Notes

- The Vite dev server proxy (`:5173` → `localhost:3000`) continues to work correctly
- CORS configuration allows requests from the frontend on localhost:5173
- JWT token expiration is set to 24 hours (`expiration-seconds: 86400`)
- Database is using H2 (file-based at `./data/schooldb.mv.db`)

## If Issues Persist

1. Check Spring Boot server logs for DEBUG messages from `com.schoolapp.security`
2. Open browser DevTools (F12) → Network tab → check request headers
3. Verify the Authorization header is being sent: `Authorization: Bearer <token>`
4. Ensure the JWT secret in `application.yml` matches between login and authenticated requests
5. Check that the user ID in the token exists in the database (verify via H2 console at `/api/h2-console`)

