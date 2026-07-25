# Supabase Setup Guide

This application is now fully configured to use **Supabase** as its database and authentication provider.

## Quick Setup Steps

### 1. Create a Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click **New Project**
3. Fill in the project details:
   - Project name: `tri-learn-classroom`
   - Database password: Create a secure password
   - Region: Choose closest to your location
4. Wait for the project to be created (usually 2-3 minutes)

### 2. Get Your Credentials

1. In your Supabase project, go to **Settings → API**
2. Copy the following values:
   - **Project URL** → `VITE_SUPABASE_URL` and `SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`
   - **Service Role Secret** → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Update Environment Variables

#### Frontend (.env.local)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_API_BASE_URL=http://localhost:3000
```

#### Backend (Environment Variables)
Set these on your system or in deployment:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
JWT_SECRET=your-jwt-secret-key
SPRING_DATASOURCE_URL=postgresql://postgres.your-project:password@aws-0-region.pooler.supabase.com:6543/postgres
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=your-database-password
```

### 4. Create Database Tables

The application uses Hibernate's `ddl-auto: update` setting, which will automatically create tables on first run. However, you should create the following base schema:

#### Users Table (handled by Supabase Auth)
Supabase Auth manages users automatically.

#### Classes Table
```sql
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID,
  name VARCHAR(255) NOT NULL,
  grade VARCHAR(50),
  teacher_id UUID,
  invite_code VARCHAR(50) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Students Table
```sql
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  class_id UUID NOT NULL REFERENCES classes(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
```

#### Marks Table
```sql
CREATE TABLE IF NOT EXISTS marks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  subject VARCHAR(100),
  mark DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id)
);
```

### 5. Verify Connection

#### Frontend
Run the development server:
```bash
npm run dev
```
The app will automatically attempt to connect to Supabase using the credentials in `.env.local`.

#### Backend (Spring)
The Spring Boot backend will use the PostgreSQL connection from Supabase.

To verify, check the console output:
```
🗄️  Database: Supabase
```

## Remove Old Database Files

Since you're now using Supabase, you can safely delete the local database files:

```bash
# Remove H2 database files
rm -rf ./data/schooldb*
```

## Migration from H2

If you have existing data in H2, you'll need to migrate it:

1. Export data from H2
2. Transform to PostgreSQL format
3. Import into Supabase

## Important Security Notes

⚠️ **Never commit `.env.local` to version control**

The `.env.local` file contains sensitive credentials. Make sure it's in `.gitignore`:

```
# .gitignore
.env.local
.env.development.local
```

## Troubleshooting

### "Missing Supabase environment variables"
- Ensure both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in `.env.local`
- Restart the development server after updating env vars

### Connection timeout
- Verify the Supabase URL and credentials are correct
- Check if your Supabase project is active (not paused)

### CORS errors
- Ensure your frontend URL is whitelisted in Supabase project settings

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
