import { Router, Response } from 'express';
import { authMiddleware, requireRole, type AuthenticatedRequest } from '../middleware/auth.js';
import * as supabaseService from '../services/supabase.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.use(authMiddleware);
router.use(requireRole('teacher'));

async function resolveTeacherId(req: AuthenticatedRequest) {
  if (!req.userId) {
    return null;
  }
  return await supabaseService.getTeacherIdByUserId(req.userId);
}

router.post('/create', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { classId, title, description, dueDate, attachmentUrls } = req.body;

    if (!classId || !title) {
      return res.status(400).json({ error: 'Bad request', message: 'classId and title are required' });
    }

    const teacherId = await resolveTeacherId(req);
    if (!teacherId) {
      return res.status(403).json({ error: 'Forbidden', message: 'Teacher profile not found' });
    }

    const classData = await supabaseService.getClass(classId);
    if (!classData || classData.teacher_id !== teacherId) {
      return res.status(403).json({ error: 'Forbidden', message: 'You do not own this class' });
    }

    const assignmentData = {
      id: uuidv4(),
      class_id: classId,
      teacher_id: teacherId,
      title,
      description: description || null,
      due_date: dueDate || null,
      attachment_urls: Array.isArray(attachmentUrls) ? attachmentUrls : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const created = await supabaseService.createAssignment(assignmentData);
    return res.status(201).json({ data: created });
  } catch (error: any) {
    logger.error('Error creating assignment', error);
    return res.status(500).json({ error: 'Server error', message: error?.message || 'Failed to create assignment' });
  }
});

router.get('/count', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const count = await supabaseService.getAssignmentCount();
    return res.json({ data: count });
  } catch (error: any) {
    logger.error('Error counting assignments', error);
    return res.status(500).json({ error: 'Server error', message: error?.message || 'Failed to count assignments' });
  }
});

router.get('/count/:classId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { classId } = req.params;
    const teacherId = await resolveTeacherId(req);
    if (!teacherId) {
      return res.status(403).json({ error: 'Forbidden', message: 'Teacher profile not found' });
    }

    const classData = await supabaseService.getClass(classId);
    if (!classData || classData.teacher_id !== teacherId) {
      return res.status(403).json({ error: 'Forbidden', message: 'You do not own this class' });
    }

    const count = await supabaseService.getAssignmentCountForClass(classId);
    return res.json({ data: count });
  } catch (error: any) {
    logger.error('Error counting assignments by class', error);
    return res.status(500).json({ error: 'Server error', message: error?.message || 'Failed to count assignments for class' });
  }
});

router.get('/list/:classId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { classId } = req.params;
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

    const assignments = await supabaseService.getAssignmentsByClass(classId);
    return res.json({ data: assignments, total: assignments.length });
  } catch (error: any) {
    logger.error('Error fetching assignment list', error);
    return res.status(500).json({ error: 'Server error', message: error?.message || 'Failed to fetch assignment list' });
  }
});

router.get('/detail/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const teacherId = await resolveTeacherId(req);
    if (!teacherId) {
      return res.status(403).json({ error: 'Forbidden', message: 'Teacher profile not found' });
    }

    const detail = await supabaseService.getAssignmentDetail(id);
    if (!detail) {
      return res.status(404).json({ error: 'Not found', message: 'Assignment not found' });
    }

    if (detail.teacherId !== teacherId) {
      return res.status(403).json({ error: 'Forbidden', message: 'You do not own this assignment' });
    }

    return res.json({ data: detail });
  } catch (error: any) {
    logger.error('Error fetching assignment detail', error);
    return res.status(500).json({ error: 'Server error', message: error?.message || 'Failed to fetch assignment detail' });
  }
});

router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const teacherId = await resolveTeacherId(req);
    if (!teacherId) {
      return res.status(403).json({ error: 'Forbidden', message: 'Teacher profile not found' });
    }

    const assignment = await supabaseService.getAssignmentById(id);
    if (!assignment) {
      return res.status(404).json({ error: 'Not found', message: 'Assignment not found' });
    }

    if (assignment.teacher_id !== teacherId) {
      return res.status(403).json({ error: 'Forbidden', message: 'You do not own this assignment' });
    }

    await supabaseService.deleteItem('assignment', id);
    return res.json({ success: true, message: 'Assignment deleted' });
  } catch (error: any) {
    logger.error('Error deleting assignment', error);
    return res.status(500).json({ error: 'Server error', message: error?.message || 'Failed to delete assignment' });
  }
});

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

    const assignment = await supabaseService.getAssignmentById(id);
    if (!assignment) {
      return res.status(404).json({ error: 'Not found', message: 'Assignment not found' });
    }

    if (assignment.teacher_id !== teacherId) {
      return res.status(403).json({ error: 'Forbidden', message: 'You do not own this assignment' });
    }

    const classId = assignment.class_id ?? assignment.classId;
    const updated = await supabaseService.updateAssignmentSubmissions(id, classId, entries, teacherId);
    return res.json({ success: true, data: updated, total: updated.length });
  } catch (error: any) {
    logger.error('Error updating assignment submissions', error);
    return res.status(500).json({ error: 'Server error', message: error?.message || 'Failed to update assignment submissions' });
  }
});

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

    const assignment = await supabaseService.getAssignmentById(id);
    if (!assignment) {
      return res.status(404).json({ error: 'Not found', message: 'Assignment not found' });
    }

    const resolvedClassId = assignment.class_id ?? assignment.classId;
    if (resolvedClassId !== classId) {
      return res.status(400).json({ error: 'Bad request', message: 'Class ID does not match assignment' });
    }

    if (assignment.teacher_id !== teacherId) {
      return res.status(403).json({ error: 'Forbidden', message: 'You do not own this assignment' });
    }

    const result = await supabaseService.toggleAssignmentStar(id, classId, learnerId, teacherId);
    return res.json({ success: true, awarded: result.awarded });
  } catch (error: any) {
    logger.error('Error toggling assignment star', error);
    return res.status(500).json({ error: 'Server error', message: error?.message || 'Failed to toggle assignment star' });
  }
});

export default router;
