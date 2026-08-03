
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

/*import path from 'node:path';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import { corsMiddleware } from './middleware/cors.js';
import { authMiddleware, requireRole, type AuthenticatedRequest } from './middleware/auth.js';
import { logger } from './utils/logger.js';
import authRoutes from './routes/auth.js';
import teacherRoutes from './routes/teacher.js';
import * as supabaseService from './services/supabase.js';
import { v4 as uuidv4 } from 'uuid';


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

app.post('/api/attendance/upload-learners', authMiddleware, requireRole('teacher'), async (req: AuthenticatedRequest, res) => {
  logger.info('Upload learners request received', {
    userId: req.userId,
    classId: req.body?.classId,
    learnerCount: Array.isArray(req.body?.learners) ? req.body.learners.length : 0,
  });

  try {
    const { classId, learners } = req.body as { classId?: string; learners?: Array<{ learnerNumber?: string; fullName?: string }> };

    if (!classId || !Array.isArray(learners) || learners.length === 0) {
      logger.warn('Upload learners rejected: missing classId or learners payload', { classId, learnerCount: learners?.length || 0 });
      return res.status(400).json({ error: 'Bad request', message: 'classId and learners are required' });
    }

    logger.info('Looking up teacher profile for upload', { userId: req.userId });
    const teacherId = req.userId ? await supabaseService.getTeacherIdByUserId(req.userId) : null;
    logger.info('Teacher lookup result', { teacherId });
    if (!teacherId) {
      logger.warn('Upload learners rejected: teacher profile not found', { userId: req.userId });
      return res.status(403).json({ error: 'Forbidden', message: 'Teacher profile not found' });
    }

    logger.info('Looking up class for upload', { classId });
    const classData = await supabaseService.getClass(classId);
    logger.info('Class lookup result', { classId, classData: classData ? { id: classData.id, teacher_id: classData.teacher_id, school_id: classData.school_id } : null });
    if (!classData) {
      logger.warn('Upload learners rejected: class not found', { classId });
      return res.status(404).json({ error: 'Not found', message: 'Class not found' });
    }

    if (classData.teacher_id !== teacherId) {
      logger.warn('Upload learners rejected: teacher does not own class', { classId, teacherId, classTeacherId: classData.teacher_id });
      return res.status(403).json({ error: 'Forbidden', message: 'You do not own this class' });
    }

    const createdMembers = [] as Array<Record<string, unknown>>;

    for (let index = 0; index < learners.length; index += 1) {
      const learner = learners[index];
      const fullName = (learner.fullName || '').trim();
      if (!fullName) {
        logger.warn('Skipping blank learner entry', { index });
        continue;
      }

      const parts = fullName.split(/\s+/).filter(Boolean);
      const firstName = parts.shift() || 'Learner';
      const lastName = parts.join(' ') || '';
      const learnerNumber = learner.learnerNumber || `${Date.now()}${Math.random().toString().slice(2, 6)}`;

      logger.info('Creating learner record', { index, fullName, learnerNumber });
      try {
        const createdLearner = await supabaseService.createLearnerRecord({
          id: uuidv4(),
          user_id: null,
          first_name: firstName,
          last_name: lastName,
          phone: learnerNumber,
          school_id: classData.school_id,
        });

        logger.info('Created learner record', { index, learnerId: createdLearner.id });

        logger.info('Adding learner to class_members', { index, classId, learnerId: createdLearner.id });
        const member = await supabaseService.addClassMember(classId, createdLearner.id, 'active');
        logger.info('Added class member', { index, memberId: member.id });

        createdMembers.push({
          id: member.id,
          learnerId: createdLearner.id,
          fullName,
          learnerNumber,
        });
      } catch (learnerError: any) {
        logger.error(`Failed to upload learner at index ${index}`, learnerError);
        throw learnerError;
      }
    }

    logger.info('Upload learners completed', { classId, createdCount: createdMembers.length });
    return res.status(201).json({ data: createdMembers, total: createdMembers.length });
  } catch (error: any) {
    logger.error('Error uploading learners', error);
    return res.status(500).json({ error: 'Server error', message: error?.message || 'Failed to upload learners' });
  }
});

app.get('/api/attendance/learners/:classId', authMiddleware, requireRole('teacher'), async (req: AuthenticatedRequest, res) => {
  try {
    const classId = req.params.classId;
    const teacherId = req.userId ? await supabaseService.getTeacherIdByUserId(req.userId) : null;
    if (!teacherId) {
      return res.status(403).json({ error: 'Forbidden', message: 'Teacher profile not found' });
    }

    const classData = await supabaseService.getClass(classId);
    if (!classData) {
      return res.status(404).json({ error: 'Not found', message: 'Class not found' });
    }

    if (classData.teacher_id !== teacherId) {
      return res.status(403).json({ error: 'Forbidden', message: 'You do not own this class' });
    }

    const members = await supabaseService.getClassMembers(classId);
    const mapped = [] as Array<Record<string, unknown>>;

    for (const member of members) {
      const learnerId = member.learner_id as string;
      const { data: learner } = await supabaseService.supabase
        .from('learners')
        .select('id, first_name, last_name, phone')
        .eq('id', learnerId)
        .maybeSingle();

      const fullName = [learner?.first_name, learner?.last_name].filter(Boolean).join(' ').trim();
      mapped.push({
        id: learnerId,
        fullName: fullName || 'Learner',
        learnerNumber: learner?.phone || '',
      });
    }

    return res.json({ data: mapped });
  } catch (error: any) {
    logger.error('Error fetching uploaded learners', error);
    return res.status(500).json({ error: 'Server error', message: error?.message || 'Failed to fetch learners' });
  }
});

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

app.listen(port, () => {
  logger.info(`🚀 Express backend listening on http://localhost:${port}`);
  logger.info(`📚 API: http://localhost:${port}/api`);
  logger.info(`🔐 Auth: http://localhost:${port}/api/auth`);
  logger.info(`👨‍🏫 Teacher: http://localhost:${port}/api/teacher`);
});*/