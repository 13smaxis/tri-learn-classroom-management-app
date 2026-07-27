import { Router, Response } from 'express';
import { authMiddleware, requireRole, type AuthenticatedRequest } from '../middleware/auth.js';
import * as supabaseService from '../services/supabase.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// All teacher endpoints require authentication and teacher role
router.use(authMiddleware);
router.use(requireRole('teacher'));

/**
 * GET /teacher/classes
 * Get all classes for authenticated teacher
 */
router.get('/classes', async (req: AuthenticatedRequest, res: Response) => {
  try {
    logger.info(`Fetching classes for teacher ${req.userId}`);

    const classes = await supabaseService.getTeacherClasses(req.userId!);

    return res.json({ data: classes, total: classes.length });
  } catch (error) {
    logger.error('Error fetching classes', error);
    return res.status(500).json({ error: 'Server error', message: 'Failed to fetch classes' });
  }
});

/**
 * GET /teacher/classes/:classId
 * Get specific class details
 */
router.get('/classes/:classId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const classId = req.params.classId;
    logger.info(`Fetching class ${classId}`);

    const classData = await supabaseService.getClass(classId);

    if (!classData) {
      return res.status(404).json({ error: 'Not found', message: 'Class not found' });
    }

    // Verify teacher owns this class
    if (classData.teacher_id !== req.userId) {
      return res.status(403).json({ error: 'Forbidden', message: 'You do not own this class' });
    }

    const members = await supabaseService.getClassMembers(classId);

    return res.json({ class: classData, members, memberCount: members.length });
  } catch (error) {
    logger.error('Error fetching class', error);
    return res.status(500).json({ error: 'Server error', message: 'Failed to fetch class' });
  }
});

/**
 * POST /teacher/classes
 * Create new class
 */
router.post('/classes', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, grade, description, room_number } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Bad request', message: 'Class name is required' });
    }

    logger.info(`Creating class "${name}" for teacher ${req.userId}`);

    const classData = {
      id: uuidv4(),
      teacher_id: req.userId,
      school_id: req.schoolId,
      name,
      grade: grade || null,
      description: description || null,
      room_number: room_number || null,
      invite_code: generateInviteCode(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const created = await supabaseService.createClass(classData);

    return res.status(201).json(created);
  } catch (error) {
    logger.error('Error creating class', error);
    return res.status(500).json({ error: 'Server error', message: 'Failed to create class' });
  }
});

/**
 * PUT /teacher/classes/:classId
 * Update class details
 */
router.put('/classes/:classId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const classId = req.params.classId;
    const { name, grade, description, room_number } = req.body;

    logger.info(`Updating class ${classId}`);

    // Verify teacher owns this class
    const classData = await supabaseService.getClass(classId);
    if (!classData || classData.teacher_id !== req.userId) {
      return res.status(403).json({ error: 'Forbidden', message: 'You do not own this class' });
    }

    const updateData = {
      ...(name && { name }),
      ...(grade !== undefined && { grade }),
      ...(description !== undefined && { description }),
      ...(room_number !== undefined && { room_number }),
      updated_at: new Date().toISOString(),
    };

    const updated = await supabaseService.updateClass(classId, updateData);

    return res.json(updated);
  } catch (error) {
    logger.error('Error updating class', error);
    return res.status(500).json({ error: 'Server error', message: 'Failed to update class' });
  }
});

/**
 * POST /teacher/marks
 * Record marks for a learner
 */
router.post('/marks', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { learner_id, class_id, subject, mark, total_mark, feedback } = req.body;

    if (!learner_id || !class_id || mark === undefined || !total_mark) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Missing required fields: learner_id, class_id, mark, total_mark',
      });
    }

    // Verify teacher owns the class
    const classData = await supabaseService.getClass(class_id);
    if (!classData || classData.teacher_id !== req.userId) {
      return res.status(403).json({ error: 'Forbidden', message: 'You do not own this class' });
    }

    logger.info(`Recording marks for learner ${learner_id} in class ${class_id}`);

    const percentage = (mark / total_mark) * 100;

    const marksData = {
      id: uuidv4(),
      learner_id,
      class_id,
      subject: subject || null,
      mark,
      total_mark,
      percentage: Math.round(percentage * 100) / 100,
      feedback: feedback || null,
      recorded_by: req.userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const created = await supabaseService.recordMarks(marksData);

    return res.status(201).json(created);
  } catch (error) {
    logger.error('Error recording marks', error);
    return res.status(500).json({ error: 'Server error', message: 'Failed to record marks' });
  }
});

/**
 * POST /teacher/attendance
 * Record attendance
 */
router.post('/attendance', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { learner_id, class_id, date, status, remarks } = req.body;

    if (!learner_id || !class_id || !date || !status) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Missing required fields: learner_id, class_id, date, status',
      });
    }

    if (!['present', 'absent', 'late', 'excused'].includes(status)) {
      return res
        .status(400)
        .json({ error: 'Bad request', message: 'Invalid status. Must be: present, absent, late, or excused' });
    }

    // Verify teacher owns the class
    const classData = await supabaseService.getClass(class_id);
    if (!classData || classData.teacher_id !== req.userId) {
      return res.status(403).json({ error: 'Forbidden', message: 'You do not own this class' });
    }

    logger.info(`Recording attendance for learner ${learner_id} in class ${class_id}`);

    const attendanceData = {
      id: uuidv4(),
      learner_id,
      class_id,
      date,
      status,
      remarks: remarks || null,
      recorded_by: req.userId,
      recorded_at: new Date().toISOString(),
    };

    const created = await supabaseService.recordAttendance(attendanceData);

    return res.status(201).json(created);
  } catch (error) {
    logger.error('Error recording attendance', error);
    return res.status(500).json({ error: 'Server error', message: 'Failed to record attendance' });
  }
});

/**
 * GET /teacher/classes/:classId/marks
 * Get all marks for a class
 */
router.get('/classes/:classId/marks', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const classId = req.params.classId;

    // Verify teacher owns the class
    const classData = await supabaseService.getClass(classId);
    if (!classData || classData.teacher_id !== req.userId) {
      return res.status(403).json({ error: 'Forbidden', message: 'You do not own this class' });
    }

    logger.info(`Fetching marks for class ${classId}`);

    // Get marks from Supabase directly
    const { data, error } = await supabaseService.supabase
      .from('marks')
      .select('*')
      .eq('class_id', classId);

    if (error) {
      logger.error('Failed to fetch marks', error);
      return res.status(500).json({ error: 'Server error', message: 'Failed to fetch marks' });
    }

    return res.json({ data: data || [], total: data?.length || 0 });
  } catch (error) {
    logger.error('Error fetching marks', error);
    return res.status(500).json({ error: 'Server error', message: 'Failed to fetch marks' });
  }
});

/**
 * Helper: Generate unique invite code for class
 */
function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default router;
