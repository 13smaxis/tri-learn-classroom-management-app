
import { Router, Response } from 'express';
import { authMiddleware, requireRole, type AuthenticatedRequest } from '../middleware/auth.js';
import * as supabaseService from '../services/supabase.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// All attendance endpoints require authentication and teacher role
router.use(authMiddleware);
router.use(requireRole('teacher'));

async function resolveTeacherId(req: AuthenticatedRequest) {
  if (!req.userId) {
    return null;
  }
  return await supabaseService.getTeacherIdByUserId(req.userId);
}

function normalizeUploadLearner(learner: any) {
  const learnerNumber = learner.learnerNumber || learner.student_number || learner.phone;
  const firstName = learner.firstName || learner.first_name;
  const lastName = learner.lastName || learner.last_name;
  const rawFullName = learner.fullName || learner.full_name || '';

  if (!learnerNumber) {
    throw new Error('Each learner must include learnerNumber or student_number');
  }

  if (!rawFullName && (!firstName || !lastName)) {
    throw new Error('Each learner must include fullName or both firstName and lastName');
  }

  const nameParts = rawFullName.trim().split(/\s+/).filter(Boolean);
  const normalizedFirstName = (firstName && String(firstName).trim()) || nameParts.shift() || '';
  const normalizedLastName = (lastName && String(lastName).trim()) || nameParts.join(' ');

  return {
    learnerNumber: String(learnerNumber),
    firstName: normalizedFirstName,
    lastName: normalizedLastName,
    grade: learner.grade,
  };
}

/**
 * POST /api/attendance/upload-learners
 * Upload and add learners to a class
 */
router.post('/upload-learners', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { classId, learners } = req.body;

    // Validate request
    if (!classId) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'classId is required',
      });
    }

    if (!Array.isArray(learners) || learners.length === 0) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'learners array is required and must contain at least one learner',
      });
    }

    const normalizedLearners = learners.map((learner: any) => normalizeUploadLearner(learner));

    const teacherId = await resolveTeacherId(req);
    if (!teacherId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Teacher profile not found',
      });
    }

    // Verify teacher owns this class
    const classData = await supabaseService.getClass(classId);
    if (!classData) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Class not found',
      });
    }

    if (classData.teacher_id !== teacherId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not own this class',
      });
    }

    logger.info(`Uploading ${normalizedLearners.length} learners to class ${classId}`, {
      classId,
      learnerCount: normalizedLearners.length,
    });

    // Bulk add learners
    const results = await supabaseService.bulkAddLearnersToClass(classId, normalizedLearners);

    logger.info(`Learner upload completed`, {
      classId,
      successCount: results.success.length,
      failedCount: results.failed.length,
    });

    // Determine response status
    const hasErrors = results.failed.length > 0;
    const statusCode = hasErrors && results.success.length === 0 ? 400 : 200;

    return res.status(statusCode).json({
      success: results.success.length > 0,
      data: {
        total: results.total,
        successCount: results.success.length,
        failedCount: results.failed.length,
        results,
      },
      ...(hasErrors && {
        warning: `${results.failed.length} learner(s) failed to upload`,
      }),
    });
  } catch (error: any) {
    logger.error('Error uploading learners', error);
    return res.status(500).json({
      error: 'Server error',
      message: error?.message || 'Failed to upload learners',
    });
  }
});


/**
 * GET /api/attendance/learners/:classId
 * Get all learners in a class with full details
 * (Alias for /class/:classId/learners - frontend uses this path)
 */
router.get('/learners/:classId', async (req: AuthenticatedRequest, res: Response) => {
  console.log('[LEARNERS ENDPOINT] Called with classId:', req.params.classId);
  console.log('[LEARNERS ENDPOINT] User ID:', req.userId);

  try {
    const { classId } = req.params;
    console.log('[LEARNERS ENDPOINT] Proceeding with classId:', classId);

    const teacherId = await resolveTeacherId(req);
    if (!teacherId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Teacher profile not found',
      });
    }

    // Verify teacher owns this class
    const classData = await supabaseService.getClass(classId);
    if (!classData) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Class not found',
      });
    }

    if (classData.teacher_id !== teacherId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not own this class',
      });
    }

    const requestId = uuidv4();
    logger.info('Fetching learners for class', { requestId, classId, teacherId });

    // Get class members
    const members = await supabaseService.getClassMembers(classId);
    logger.info('Resolved class members', { requestId, classId, memberCount: members.length });

    // Fetch learner details for each member
    const learnersData = await Promise.all(
      members.map(async (member) => {
        const learner = await supabaseService.getLearnerById(member.learner_id);
        if (!learner) {
          logger.warn('Missing learner record for class member', {
            requestId,
            classId,
            classMemberId: member.id,
            learnerId: member.learner_id,
          });
        }

        const fullName = learner?.fullName || [learner?.first_name, learner?.last_name].filter(Boolean).join(' ');
        const learnerNumber = learner?.learnerNumber || learner?.student_number || learner?.phone || '';

        return {
          classMemberId: member.id,
          learnerId: member.learner_id,
          status: member.status,
          joinedAt: member.joined_at,
          ...learner,
          fullName,
          learnerNumber,
        };
      })
    );

    const missingRecords = learnersData.filter((item) => !item.id).length;
    logger.info('Completed learner detail resolution', {
      requestId,
      classId,
      totalMembers: members.length,
      returnedLearners: learnersData.length,
      missingLearnerRecords: missingRecords,
    });

    return res.json({
      data: learnersData,
      total: learnersData.length,
    });
  } catch (error: any) {
    logger.error('Error fetching class learners', error);
    return res.status(500).json({
      error: 'Server error',
      message: error?.message || 'Failed to fetch learners',
    });
  }
});


/**
 * GET /api/attendance/records/:classId/:date
 * Get attendance records for a class on a specific date
 * Date format: YYYY-MM-DD
 */
router.get('/records/:classId/:date', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { classId, date } = req.params;

    const teacherId = await resolveTeacherId(req);
    if (!teacherId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Teacher profile not found',
      });
    }

    // Verify teacher owns this class
    const classData = await supabaseService.getClass(classId);
    if (!classData) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Class not found',
      });
    }

    if (classData.teacher_id !== teacherId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not own this class',
      });
    }

    logger.info(`Fetching attendance records for class ${classId} on ${date}`);

    // Get attendance records for this class and date
    const { data: records, error } = await supabaseService.supabase
      .from('attendance')
      .select('*')
      .eq('class_id', classId)
      .eq('date', date)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('Failed to fetch attendance records', error);
      return res.status(500).json({
        error: 'Server error',
        message: 'Failed to fetch attendance records',
      });
    }

    const attendanceMap = (records || []).reduce<Record<string, string>>((acc, record: any) => {
      const learnerId = record.learner_id || record.learnerId;
      if (learnerId) {
        acc[String(learnerId)] = String(record.status ?? '');
      }
      return acc;
    }, {});

    return res.json({
      data: attendanceMap,
      total: Object.keys(attendanceMap).length,
    });
  } catch (error: any) {
    logger.error('Error fetching attendance records', error);
    return res.status(500).json({
      error: 'Server error',
      message: error?.message || 'Failed to fetch attendance records',
    });
  }
});


/**
 * GET /api/attendance/learner/:learnerId
 * Get learner details
 */
router.get('/learner/:learnerId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { learnerId } = req.params;

    const teacherId = await resolveTeacherId(req);
    if (!teacherId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Teacher profile not found',
      });
    }

    logger.info(`Fetching learner ${learnerId}`);

    const learner = await supabaseService.getLearnerById(learnerId);
    if (!learner) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Learner not found',
      });
    }

    return res.json({ data: learner });
  } catch (error: any) {
    logger.error('Error fetching learner', error);
    return res.status(500).json({
      error: 'Server error',
      message: error?.message || 'Failed to fetch learner',
    });
  }
});

/**
 * PUT /api/attendance/learner/:learnerId
 * Update learner details
 */
router.put('/learner/:learnerId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { learnerId } = req.params;
    const { full_name, fullName, grade, date_of_birth, dateOfBirth, enrollment_date, enrollmentDate } = req.body;

    const teacherId = await resolveTeacherId(req);
    if (!teacherId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Teacher profile not found',
      });
    }

    logger.info(`Updating learner ${learnerId}`);

    // Build update data (support both snake_case and camelCase)
    const updateData = {
      ...(full_name && { full_name }),
      ...(fullName && { full_name: fullName }),
      ...(grade && { grade }),
      ...(date_of_birth && { date_of_birth }),
      ...(dateOfBirth && { date_of_birth: dateOfBirth }),
      ...(enrollment_date && { enrollment_date }),
      ...(enrollmentDate && { enrollment_date: enrollmentDate }),
    };

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'No valid fields to update',
      });
    }

    const updated = await supabaseService.updateLearnerRecord(learnerId, updateData);

    logger.info(`Learner updated: ${learnerId}`, { updateData });

    return res.json({ data: updated });
  } catch (error: any) {
    logger.error('Error updating learner', error);
    return res.status(400).json({
      error: 'Bad request',
      message: error?.message || 'Failed to update learner',
    });
  }
});

/**
 * DELETE /api/attendance/class/:classId/learner/:learnerId
 * Remove learner from class
 */
router.delete('/class/:classId/learner/:learnerId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { classId, learnerId } = req.params;

    const teacherId = await resolveTeacherId(req);
    if (!teacherId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Teacher profile not found',
      });
    }

    // Verify teacher owns this class
    const classData = await supabaseService.getClass(classId);
    if (!classData) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Class not found',
      });
    }

    if (classData.teacher_id !== teacherId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not own this class',
      });
    }

    logger.info(`Removing learner ${learnerId} from class ${classId}`);

    await supabaseService.removeClassMember(classId, learnerId);

    return res.json({
      success: true,
      message: 'Learner removed from class',
    });
  } catch (error: any) {
    logger.error('Error removing learner from class', error);
    return res.status(400).json({
      error: 'Bad request',
      message: error?.message || 'Failed to remove learner from class',
    });
  }
});

/**
 * PATCH /api/attendance/class/:classId/learner/:learnerId/status
 * Update learner's status in class (active, inactive, dropped)
 */
router.patch('/class/:classId/learner/:learnerId/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { classId, learnerId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'status is required',
      });
    }

    const validStatuses = ['active', 'inactive', 'dropped'];
    if (!validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({
        error: 'Bad request',
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const teacherId = await resolveTeacherId(req);
    if (!teacherId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Teacher profile not found',
      });
    }

    // Verify teacher owns this class
    const classData = await supabaseService.getClass(classId);
    if (!classData) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Class not found',
      });
    }

    if (classData.teacher_id !== teacherId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not own this class',
      });
    }

    logger.info(`Updating learner ${learnerId} status to ${status} in class ${classId}`);

    const updated = await supabaseService.updateClassMemberStatus(classId, learnerId, status);

    return res.json({ data: updated });
  } catch (error: any) {
    logger.error('Error updating learner status', error);
    return res.status(400).json({
      error: 'Bad request',
      message: error?.message || 'Failed to update learner status',
    });
  }
});

/**
 * POST /api/attendance/save
 * Save attendance records for a class and date
 */
router.post('/save', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { classId, date, attendance } = req.body;

    if (!classId || !date || !attendance) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'classId, date, and attendance are required',
      });
    }

    const teacherId = await resolveTeacherId(req);
    if (!teacherId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Teacher profile not found',
      });
    }

    // Verify teacher owns this class
    const classData = await supabaseService.getClass(classId);
    if (!classData) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Class not found',
      });
    }

    if (classData.teacher_id !== teacherId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not own this class',
      });
    }

    logger.info(`Saving attendance for class ${classId} on ${date}`, {
      classId,
      date,
      recordCount: Object.keys(attendance).length,
    });

    // Save each attendance record
    const records = Object.entries(attendance).map(([learnerId, status]) => ({
      class_id: classId,
      learner_id: learnerId,
      date,
      status,
      recorded_at: new Date().toISOString(),
    }));

    const { error } = await supabaseService.supabase
      .from('attendance')
      .upsert(records, { onConflict: 'class_id,learner_id,date' });

    if (error) {
      logger.error('Failed to save attendance', error);
      return res.status(500).json({
        error: 'Server error',
        message: 'Failed to save attendance',
      });
    }

    logger.info(`Attendance saved successfully for class ${classId} on ${date}`);

    return res.json({ success: true, message: 'Attendance saved' });
  } catch (error: any) {
    logger.error('Error saving attendance', error);
    return res.status(500).json({
      error: 'Server error',
      message: error?.message || 'Failed to save attendance',
    });
  }
});

export default router;