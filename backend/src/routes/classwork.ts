import { Router, Response } from 'express';
import { authMiddleware, requireRole, type AuthenticatedRequest } from '../middleware/auth.js';
import * as supabaseService from '../services/supabase.js';
import { logger } from '../utils/logger.js';

const router = Router();

// All classwork endpoints require authentication and teacher role
router.use(authMiddleware);
router.use(requireRole('teacher'));

async function resolveTeacherId(req: AuthenticatedRequest) {
  if (!req.userId) {
    return null;
  }
  return await supabaseService.getTeacherIdByUserId(req.userId);
}

/**
 * GET /api/classwork/list/:classId
 * Return all classwork items for a class (ordered by lesson_date desc)
 */
router.get('/list/:classId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { classId } = req.params;

    const teacherId = await resolveTeacherId(req);
    if (!teacherId) {
      return res.status(403).json({ error: 'Forbidden', message: 'Teacher profile not found' });
    }

    // Verify teacher owns this class
    const classData = await supabaseService.getClass(classId);
    if (!classData) {
      return res.status(404).json({ error: 'Not found', message: 'Class not found' });
    }

    if (classData.teacher_id !== teacherId) {
      return res.status(403).json({ error: 'Forbidden', message: 'You do not own this class' });
    }

    const requestId = Date.now().toString();
    logger.info('Fetching classwork for class', { requestId, classId, teacherId });

    const classwork = await supabaseService.getClassworkByClass(classId);

    return res.json({ data: classwork, total: classwork.length });
  } catch (error: any) {
    logger.error('Error fetching classwork for class', error);
    return res.status(500).json({ error: 'Server error', message: error?.message || 'Failed to fetch classwork' });
  }
});

/**
 * GET /api/classwork/detail/:id
 * Return a single classwork item by id
 */
router.get('/detail/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const teacherId = await resolveTeacherId(req);
    if (!teacherId) {
      return res.status(403).json({ error: 'Forbidden', message: 'Teacher profile not found' });
    }

    const detail = await supabaseService.getClassworkDetail(id);
    if (!detail) {
      return res.status(404).json({ error: 'Not found', message: 'Classwork not found' });
    }

    // Verify teacher owns this classwork (teacher_id on classwork)
    if (detail.teacherId !== teacherId) {
      return res.status(403).json({ error: 'Forbidden', message: 'You do not own this classwork' });
    }

    return res.json({ data: detail });
  } catch (error: any) {
    logger.error('Error fetching classwork detail', error);
    return res.status(500).json({ error: 'Server error', message: error?.message || 'Failed to fetch classwork detail' });
  }
});

/**
 * POST /api/classwork/:id/bulk-submissions
 * Update submission state and marks for multiple learners
 */
router.post('/:id/bulk-submissions', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { entries } = req.body;

    if (!Array.isArray(entries) || entries.some((entry: any) => typeof entry.learnerId !== 'string')) {
      return res.status(400).json({ error: 'Bad request', message: 'Entries must be an array of { learnerId, submitted, mark } objects' });
    }

    const teacherId = await resolveTeacherId(req);
    if (!teacherId) {
      return res.status(403).json({ error: 'Forbidden', message: 'Teacher profile not found' });
    }

    const classwork = await supabaseService.getClassworkById(id);
    if (!classwork) {
      return res.status(404).json({ error: 'Not found', message: 'Classwork not found' });
    }

    if (classwork.teacher_id !== teacherId) {
      return res.status(403).json({ error: 'Forbidden', message: 'You do not own this classwork' });
    }

    const classId = classwork.class_id ?? classwork.classId;
    const updated = await supabaseService.updateClassworkSubmissions(id, classId, entries, teacherId);

    return res.json({ success: true, data: updated, total: updated.length });
  } catch (error: any) {
    logger.error('Error updating classwork submissions', error);
    return res.status(500).json({ error: 'Server error', message: error?.message || 'Failed to update classwork submissions' });
  }
});

/**
 * POST /api/classwork/:id/toggle-star
 * Toggle a star for a learner on this classwork item
 */
router.post('/:id/toggle-star', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { learnerId, classId } = req.body;

    if (typeof learnerId !== 'string' || typeof classId !== 'string') {
      return res.status(400).json({ error: 'Bad request', message: 'learnerId and classId are required' });
    }

    const teacherId = await resolveTeacherId(req);
    if (!teacherId) {
      return res.status(403).json({ error: 'Forbidden', message: 'Teacher profile not found' });
    }

    const classwork = await supabaseService.getClassworkById(id);
    if (!classwork) {
      return res.status(404).json({ error: 'Not found', message: 'Classwork not found' });
    }

    const resolvedClassId = classwork.class_id ?? classwork.classId;
    if (resolvedClassId !== classId) {
      return res.status(400).json({ error: 'Bad request', message: 'Class ID does not match classwork' });
    }

    if (classwork.teacher_id !== teacherId) {
      return res.status(403).json({ error: 'Forbidden', message: 'You do not own this classwork' });
    }

    const result = await supabaseService.toggleClassworkStar(id, classId, learnerId, teacherId);
    return res.json({ success: true, awarded: result.awarded });
  } catch (error: any) {
    logger.error('Error toggling classwork star', error);
    return res.status(500).json({ error: 'Server error', message: error?.message || 'Failed to toggle classwork star' });
  }
});

export default router;
