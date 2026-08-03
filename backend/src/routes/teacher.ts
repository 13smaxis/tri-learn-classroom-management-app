import { Router, Response } from 'express';
import { authMiddleware, requireRole, type AuthenticatedRequest } from '../middleware/auth.js';
import * as supabaseService from '../services/supabase.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// All teacher endpoints require authentication and teacher role
router.use(authMiddleware);
router.use(requireRole('teacher'));

async function resolveTeacherId(req: AuthenticatedRequest) {
  if (!req.userId) {
    return null;
  }
  return await supabaseService.getTeacherIdByUserId(req.userId);
}

/**
 * GET /teacher/classes
 * Get all classes for authenticated teacher
 */
router.get('/classes', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const teacherId = await resolveTeacherId(req);
    if (!teacherId) {
      return res.status(403).json({ error: 'Forbidden', message: 'Teacher profile not found' });
    }

    logger.info(`Fetching classes for teacher ${teacherId}`);

    const classes = await supabaseService.getTeacherClasses(teacherId);

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

    const teacherId = await resolveTeacherId(req);
    if (!teacherId) {
      return res.status(403).json({ error: 'Forbidden', message: 'Teacher profile not found' });
    }

    const classData = await supabaseService.getClass(classId);

    if (!classData) {
      return res.status(404).json({ error: 'Not found', message: 'Class not found' });
    }

    // Verify teacher owns this class
    if (classData.teacher_id !== teacherId) {
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
 * GET /teacher/classes/:classId/members
 * List learners in a class
 */
router.get('/classes/:classId/members', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const classId = req.params.classId;
    const teacherId = await resolveTeacherId(req);
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
    return res.json({ data: members, total: members.length });
  } catch (error) {
    logger.error('Error fetching class members', error);
    return res.status(500).json({ error: 'Server error', message: 'Failed to fetch class members' });
  }
});

/**
 * POST /teacher/classes/:classId/members
 * Add learner to class
 */
router.post('/classes/:classId/members', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const classId = req.params.classId;
    const { learner_id, learnerId, status } = req.body;
    const targetLearnerId = learner_id ?? learnerId;

    if (!targetLearnerId) {
      return res.status(400).json({ error: 'Bad request', message: 'learner_id is required' });
    }

    const teacherId = await resolveTeacherId(req);
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

    const member = await supabaseService.addClassMember(classId, targetLearnerId, status ?? 'active');
    return res.status(201).json({ data: member });
  } catch (error: any) {
    logger.error('Error adding learner to class', error);
    return res.status(400).json({
      error: 'Bad request',
      message: error?.message || 'Failed to add learner to class',
    });
  }
});

/**
 * PATCH /teacher/classes/:classId/members/:learnerId/status
 * Update learner's membership status
 */
router.patch('/classes/:classId/members/:learnerId/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { classId, learnerId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Bad request', message: 'status is required' });
    }

    const teacherId = await resolveTeacherId(req);
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

    const member = await supabaseService.updateClassMemberStatus(classId, learnerId, status);
    return res.json({ data: member });
  } catch (error: any) {
    logger.error('Error updating class member status', error);
    return res.status(400).json({
      error: 'Bad request',
      message: error?.message || 'Failed to update class member status',
    });
  }
});

/**
 * DELETE /teacher/classes/:classId/members/:learnerId
 * Remove learner from class
 */
router.delete('/classes/:classId/members/:learnerId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { classId, learnerId } = req.params;

    const teacherId = await resolveTeacherId(req);
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

    await supabaseService.removeClassMember(classId, learnerId);
    return res.json({ success: true, message: 'Learner removed from class' });
  } catch (error: any) {
    logger.error('Error removing learner from class', error);
    return res.status(400).json({
      error: 'Bad request',
      message: error?.message || 'Failed to remove learner from class',
    });
  }
});

/**
 * POST /teacher/classes
 * Create new class
 */
router.post('/classes', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      name,
      grade,
      description,
      room_number,
      roomNumber,
      subject,
      academic_year,
      academicYear,
      max_students,
      maxStudents,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Bad request', message: 'Class name is required' });
    }

    const teacherId = await resolveTeacherId(req);
    if (!teacherId) {
      return res.status(403).json({ error: 'Forbidden', message: 'Teacher profile not found' });
    }

    logger.info(`Creating class "${name}" for teacher ${teacherId}`);

    const inviteCode = generateInviteCode();

    const classData = {
      id: uuidv4(),
      teacher_id: teacherId,
      school_id: req.schoolId || null,
      name,
      grade: grade || null,
      description: description || null,
      room_number: room_number || roomNumber || null,
      subject: subject || null,
      academic_year: academic_year || academicYear || null,
      max_students: max_students ?? maxStudents ?? null,
      invite_code: inviteCode,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const created = await supabaseService.createClass(classData);

    logger.info('Class created successfully', {
      teacherId,
      classId: classData.id,
      className: name,
      grade: grade || null,
      subject: subject || null,
      inviteCode,
    });

    return res.status(201).json({
      success: true,
      data: {
        ...created,
        inviteToken: created?.invite_code || created?.inviteToken || null,
      },
    });
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

    const teacherId = await resolveTeacherId(req);
    if (!teacherId) {
      return res.status(403).json({ error: 'Forbidden', message: 'Teacher profile not found' });
    }

    // Verify teacher owns this class
    const classData = await supabaseService.getClass(classId);
    if (!classData || classData.teacher_id !== teacherId) {
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

    const teacherId = await resolveTeacherId(req);
    if (!teacherId) {
      return res.status(403).json({ error: 'Forbidden', message: 'Teacher profile not found' });
    }

    // Verify teacher owns the class
    const classData = await supabaseService.getClass(class_id);
    if (!classData || classData.teacher_id !== teacherId) {
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

    const teacherId = await resolveTeacherId(req);
    if (!teacherId) {
      return res.status(403).json({ error: 'Forbidden', message: 'Teacher profile not found' });
    }

    // Verify teacher owns the class
    const classData = await supabaseService.getClass(class_id);
    if (!classData || classData.teacher_id !== teacherId) {
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

    const teacherId = await resolveTeacherId(req);
    if (!teacherId) {
      return res.status(403).json({ error: 'Forbidden', message: 'Teacher profile not found' });
    }

    // Verify teacher owns the class
    const classData = await supabaseService.getClass(classId);
    if (!classData || classData.teacher_id !== teacherId) {
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
