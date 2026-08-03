
import { Router, Response } from 'express';
import { authMiddleware, requireRole, type AuthenticatedRequest } from '../middleware/auth.js';
import * as supabaseService from '../services/supabase.js';
import { logger } from '../utils/logger.js';

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

    // Validate learner objects
    for (const learner of learners) {
      if (!learner.learnerNumber || !learner.fullName) {
        return res.status(400).json({
          error: 'Bad request',
          message: 'Each learner must have learnerNumber and fullName',
        });
      }
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

    logger.info(`Uploading ${learners.length} learners to class ${classId}`, {
      classId,
      learnerCount: learners.length,
    });

    // Bulk add learners
    const results = await supabaseService.bulkAddLearnersToClass(classId, learners);

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
 * GET /api/attendance/class/:classId/learners
 * Get all learners in a class with full details
 */
router.get('/class/:classId/learners', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { classId } = req.params;

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

    logger.info(`Fetching learners for class ${classId}`);

    // Get class members
    const members = await supabaseService.getClassMembers(classId);

    // Fetch learner details for each member
    const learnersData = await Promise.all(
      members.map(async (member) => {
        const learner = await supabaseService.getLearnerById(member.learner_id);
        return {
          classMemberId: member.id,
          learnerId: member.learner_id,
          status: member.status,
          joinedAt: member.joined_at,
          ...learner,
        };
      })
    );

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

export default router;