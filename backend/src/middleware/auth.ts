import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../services/supabase.js';
import { logger } from '../utils/logger.js';
import { normalizeInviteCode, inviteCodesMatch } from '../utils/inviteCode.js';
import type { SignupRequest, AuthRequest, AuthResponse, UserInfo } from '../types/index.js';

const router = Router();

export interface AuthenticatedRequest extends Request {
  userId?: string;
  schoolId?: string;
  role?: UserInfo['role'];
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: 'Unauthorized', message: 'Missing auth token' });
    return;
  }

  try {
    const secret = process.env.JWT_SECRET || 'development-secret';
    const decoded = jwt.verify(token, secret) as { userId?: string; schoolId?: string; role?: UserInfo['role'] };
    req.userId = decoded.userId;
    req.schoolId = decoded.schoolId;
    req.role = decoded.role;
    next();
  } catch (error) {
    logger.warn('Invalid auth token', error);
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid auth token' });
  }
}

export function requireRole(role: UserInfo['role']) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (req.role !== role) {
      res.status(403).json({ error: 'Forbidden', message: `Role ${role} required` });
      return;
    }
    next();
  };
}

export function createToken(
  userId: string,
  schoolId: string,
  role: UserInfo['role'],
  email?: string
): string {
  const secret = process.env.JWT_SECRET || 'development-secret';
  return jwt.sign({ userId, schoolId, role, email }, secret, { expiresIn: '8h' });
}

/**
 * GET /auth/validate-invite/:code
 * Validate school invite code and get school info
 */
router.get('/validate-invite/:code', async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { code } = req.params;

    if (!code || code.trim().length === 0) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Invite code is required',
      });
    }

    logger.info(`Validating invite code: ${code}`);

    const normalizedInviteCode = normalizeInviteCode(code);
    const { data: schools, error } = await supabase
      .from('schools')
      .select('id, name, invite_code, district_number');

    if (error) {
      logger.error('Failed to query schools for invite validation', error);
      return res.status(500).json({
        error: 'Server error',
        message: 'Failed to validate invite code',
      });
    }

    const school = (schools ?? []).find((candidate: { invite_code?: string | null }) =>
      inviteCodesMatch(normalizedInviteCode, candidate.invite_code ?? '')
    );

    if (!school) {
      logger.warn(`Invalid invite code: ${code}`);
      return res.status(404).json({
        error: 'Not found',
        message: 'Invalid invite code',
      });
    }

    logger.info(`Invite code validated for school: ${school.name}`);

    res.json({
      id: school.id,
      name: school.name,
      invite_code: school.invite_code,
      district_number: school.district_number,
    });
  } catch (error) {
    logger.error('Error validating invite code', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to validate invite code',
    });
  }
});

/**
 * POST /auth/signup
 * Register new user
 */
router.post('/signup', async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { email, password, firstName, lastName, role, inviteCode, title, phone, teacherGrade } = req.body as SignupRequest;

    if (!email || !password || !firstName || !lastName || !role || !inviteCode) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Missing required fields',
      });
    }

    if (!['teacher', 'parent', 'learner'].includes(role)) {
      return res.status(400).json({ error: 'Bad request', message: 'Invalid role' });
    }

    logger.info(`Signup attempt for ${email} with role ${role}`);

    // Validate invite code
    const normalizedInviteCode = normalizeInviteCode(inviteCode);
    const { data: schools, error: schoolError } = await supabase
      .from('schools')
      .select('id, name, invite_code');

    if (schoolError) {
      logger.error('Failed to query schools during signup', schoolError);
      return res.status(500).json({
        error: 'Server error',
        message: 'Failed to validate invite code',
      });
    }

    const school = (schools ?? []).find((candidate: { invite_code?: string | null }) =>
      inviteCodesMatch(normalizedInviteCode, candidate.invite_code ?? '')
    );

    if (!school) {
      logger.warn(`Invalid invite code during signup: ${inviteCode}`);
      return res.status(400).json({
        error: 'Bad request',
        message: 'Invalid school invite code',
      });
    }

    const schoolId = school.id;

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      logger.error('Supabase auth signup failed', authError);
      return res.status(400).json({
        error: 'Signup failed',
        message: authError?.message || 'Unknown error',
      });
    }

    const userId = authData.user.id;

    // Create profile
    const { error: profileError } = await supabase.from('profiles').insert([
      {
        id: userId,
        email,
        first_name: firstName,
        last_name: lastName,
        role,
        school_id: schoolId,
      },
    ]);

    if (profileError) {
      logger.error('Failed to create profile', profileError);
      return res.status(400).json({
        error: 'Signup failed',
        message: 'Failed to create user profile',
      });
    }

    const roleTable = role === 'teacher' ? 'teachers' : role === 'parent' ? 'parents' : 'learners';
    const roleRecordPayload = {
      id: userId,
      school_id: schoolId,
      email,
      first_name: firstName,
      last_name: lastName,
      title: title || null,
      phone: phone || null,
      ...(role === 'teacher' && teacherGrade ? { teacher_grade: teacherGrade } : {}),
    };

    const { error: roleRecordError } = await supabase.from(roleTable).insert([roleRecordPayload]);

    if (roleRecordError) {
      logger.error(`Failed to create ${role} record`, roleRecordError);
      return res.status(400).json({
        error: 'Signup failed',
        message: `Failed to create ${role} record`,
      });
    }

    const token = createToken(userId, schoolId, role, email);

    const userInfo: UserInfo = {
      id: userId,
      email,
      firstName,
      lastName,
      role: role as any,
      schoolId,
    };

    logger.info(`Signup successful for user ${userId}`);

    const response: AuthResponse = { token, user: userInfo };
    res.status(201).json(response);
  } catch (error) {
    logger.error('Signup error', error);
    res.status(500).json({ error: 'Server error', message: 'Internal server error' });
  }
});

/**
 * POST /auth/login
 * Login with email and password
 */
router.post('/login', async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { email, password } = req.body as AuthRequest;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Missing required fields: email, password',
      });
    }

    logger.info(`Login attempt for ${email}`);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      logger.warn(`Login failed for ${email}`);
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
    }

    const userId = authData.user.id;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      logger.error('Failed to get user profile', profileError);
      return res.status(400).json({
        error: 'Login failed',
        message: 'User profile not found',
      });
    }

    const token = createToken(userId, profile.school_id || '', profile.role, email);

    const userInfo: UserInfo = {
      id: userId,
      email: profile.email,
      firstName: profile.first_name,
      lastName: profile.last_name,
      role: profile.role,
      schoolId: profile.school_id,
    };

    logger.info(`Login successful for user ${userId}`);

    const response: AuthResponse = { token, user: userInfo };
    res.json(response);
  } catch (error) {
    logger.error('Login error', error);
    res.status(500).json({ error: 'Server error', message: 'Internal server error' });
  }
});

/**
 * POST /auth/reset-password
 */
router.post('/reset-password', async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Email is required',
      });
    }

    logger.info(`Password reset requested for ${email}`);

    await supabase.auth.resetPasswordForEmail(email);

    res.json({ message: 'If email exists, password reset link was sent' });
  } catch (error) {
    logger.error('Password reset error', error);
    res.status(500).json({ error: 'Server error', message: 'Internal server error' });
  }
});

/**
 * GET /auth/health
 */
router.get('/health', (_req: Request, res: Response): Response => {
  return res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;