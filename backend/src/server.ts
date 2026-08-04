
import path from 'node:path';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import { corsMiddleware } from './middleware/cors.js';
import { logger } from './utils/logger.js';
import authRoutes from './routes/auth.js';
import teacherRoutes from './routes/teacher.js';
import attendanceRoutes from './routes/attendance.js';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from './services/supabase.js';


const repoRoot = path.resolve(process.cwd(), '..');
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(repoRoot, '.env') });
dotenv.config({ path: path.resolve(repoRoot, '.env.local') });

const app = express();
const port = Number(process.env.PORT || 3000);

// Middleware
app.use(helmet());
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log requests
app.use((req, _res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/attendance', attendanceRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'tri-learn-express-backend',
    supabaseConfigured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY)
  });
});

// Root
app.get('/', (_req, res) => {
  res.json({ message: 'TriLearn Express backend is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `${req.method} ${req.path} not found`,
  });
});

/**
 * Create a learner record
 */
export async function createLearnerRecord(learnerData: Record<string, unknown>) {
  try {
    // Generate ID if not provided
    const dataWithId = {
      id: uuidv4(),
      ...learnerData,
    };

    const { data, error } = await supabase
      .from('learners')
      .insert([dataWithId])
      .select()
      .single();

    if (error) {
      logger.error('Failed to create learner record', error);
      throw new Error(error.message || 'Failed to create learner record');
    }

    return data;
  } catch (error) {
    logger.error('Error creating learner record', error);
    throw error;
  }
}

app.listen(port, () => {
  logger.info(`🚀 Express backend listening on http://localhost:${port}`);
  logger.info(`📚 API: http://localhost:${port}/api`);
  logger.info(`🔐 Auth: http://localhost:${port}/api/auth`);
  logger.info(`👨‍🏫 Teacher: http://localhost:${port}/api/teacher`);
  logger.info(`📋 Attendance: http://localhost:${port}/api/attendance`);
});