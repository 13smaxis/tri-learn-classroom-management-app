# Testing the Attendance System

## Current Status
✅ Backend database tables created successfully:
- `learners` table with foreign key to `school_classes`
- `attendance_records` table with foreign keys to `learners` and `school_classes`
- Unique constraints properly configured
- CORS configuration updated to allow credentials

✅ Backend is running on port 3000

## Testing Steps

### 1. Test Learner Upload
1. Login as a teacher
2. Navigate to **Attendance → Class Register**
3. Select a class from the dropdown
4. Click **"Choose File"** and upload a CSV with this format:
   ```csv
   Student ID,Student Name,Student Surname
   001,John,Doe
   002,Jane,Smith
   003,Bob,Johnson
   ```
5. The learners should be uploaded to the database
6. Check for success message: "Learners uploaded successfully!"

### 2. Test Attendance Marking
1. After uploading learners, you should see the list of learners
2. For each learner, click one of the attendance buttons:
   - **Present** (green)
   - **Absent** (red)
   - **Late** (orange)
   - **Excused** (yellow)
   - **Bunking** (dark red)
   - **Sick** (blue)
3. You can also click **"Mark All Present"** to mark everyone present
4. Click **"Save Attendance"** button
5. Check for success message: "Attendance register for [date] has been saved to database."

### 3. Test Data Persistence
1. After saving attendance, refresh the page
2. Select the same class again
3. The learners should be loaded from the database
4. The attendance for the current date should be loaded automatically
5. Change the date to verify attendance is loaded correctly for different dates

### 4. Verify in H2 Console
1. Navigate to `http://localhost:3000/api/h2-console`
2. Use JDBC URL: `jdbc:h2:file:./data/schooldb`
3. Username: `sa`
4. Password: (leave blank)
5. Run queries to verify data:
   ```sql
   -- Check learners
   SELECT * FROM learners;
   
   -- Check attendance records
   SELECT * FROM attendance_records;
   
   -- Join query to see learner names with attendance
   SELECT l.full_name, l.learner_number, a.attendance_date, a.status
   FROM attendance_records a
   JOIN learners l ON a.learner_id = l.id
   ORDER BY a.attendance_date DESC;
   ```

## Expected Backend Endpoints

All endpoints require authentication (JWT token in Authorization header):

### Learner Management
- `POST /api/attendance/upload-learners` - Upload learners for a class
- `GET /api/attendance/learners/{classId}` - Get all learners for a class

### Attendance Management
- `POST /api/attendance/save` - Save attendance records
- `GET /api/attendance/records/{classId}/{date}` - Get attendance for a specific date
- `GET /api/attendance/records/{classId}?startDate=X&endDate=Y` - Get attendance range
- `GET /api/attendance/learner/{learnerId}` - Get all attendance for a learner

## Troubleshooting

### 403 Forbidden Error
✅ **FIXED**: Updated CORS configuration to allow credentials with pattern matching

### Port 3000 Already in Use
The backend is already running. No need to restart.

### Data Not Persisting
- Verify the H2 database file exists at: `backend/spring-backend/data/schooldb.mv.db`
- Check that `spring.jpa.hibernate.ddl-auto=update` in `application.yml`

### Learners Not Showing After Upload
- Check browser console for errors
- Verify the API response in Network tab
- Confirm authentication token is being sent in headers

## Database Schema

```sql
-- Learners Table
CREATE TABLE learners (
    id VARCHAR(255) PRIMARY KEY,
    learner_number VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    class_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES school_classes(id),
    UNIQUE (learner_number, class_id)
);

-- Attendance Records Table
CREATE TABLE attendance_records (
    id VARCHAR(255) PRIMARY KEY,
    learner_id VARCHAR(255) NOT NULL,
    class_id VARCHAR(255) NOT NULL,
    attendance_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL,  -- PRESENT, ABSENT, LATE, EXCUSED, BUNKING, SICK
    notes VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (learner_id) REFERENCES learners(id),
    FOREIGN KEY (class_id) REFERENCES school_classes(id),
    UNIQUE (learner_id, attendance_date)
);
```

## Next Steps

After successful testing:
1. Implement attendance reports (daily, weekly, monthly)
2. Add export functionality (PDF, Excel)
3. Create parent view to see child's attendance
4. Add notifications for poor attendance
5. Generate attendance statistics and charts
