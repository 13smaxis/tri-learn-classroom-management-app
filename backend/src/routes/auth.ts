import { Router, Request, Response } from 'express';
import { supabase } from '../services/supabase.js';
import { createToken } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import { UserInfo } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/**
 * GET /auth/validate-invite/:code
 */
router.get('/validate-invite/:code', async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { code } = req.params;

    if (!code || code.trim().length === 0) {
      return res.status(400).json({ error: 'Bad request', message: 'Invite code is required' });
    }

    logger.info(`Validating invite code: ${code}`);

    const { data: school, error } = await supabase
      .from('schools')
      .select('id, name, invite_code, district_number, location')
      .eq('invite_code', code.toUpperCase())
      .single();

    if (error || !school) {
      logger.warn(`Invalid invite code: ${code}`);
      return res.status(404).json({ error: 'Not found', message: 'Invalid invite code' });
    }

    logger.info(`Invite code validated for school: ${school.name}`);
    res.json({
      id: school.id,
      name: school.name,
      invite_code: school.invite_code,
      district_number: school.district_number,
      location: school.location,
    });
  } catch (error) {
    logger.error('Error validating invite code', error);
    res.status(500).json({ error: 'Server error', message: 'Failed to validate invite code' });
  }
});

/**
 * POST /auth/signup
 * Phone + Password signup
 */
router.post('/signup', async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { phone, password, firstName, lastName, role, inviteCode, title, email } = req.body as {
      phone?: string;
      password?: string;
      firstName?: string;
      lastName?: string;
      role?: string;
      inviteCode?: string;
      title?: string;
      email?: string;
    };

    // Validate required fields
    if (!phone || !password || !firstName || !lastName || !role || !inviteCode) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Missing required fields: phone, password, firstName, lastName, role, inviteCode',
      });
    }

    if (!['teacher', 'parent', 'learner'].includes(role)) {
      return res.status(400).json({ error: 'Bad request', message: 'Invalid role' });
    }

    logger.info(`Signup: ${phone} - role: ${role}`);

    // Validate invite code
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('id, name')
      .eq('invite_code', inviteCode.toUpperCase())
      .single();

    if (schoolError || !school) {
      logger.warn(`Invalid invite code: ${inviteCode}`);
      return res.status(400).json({ error: 'Bad request', message: 'Invalid school invite code' });
    }

    const schoolId = school.id;

    // Check if phone already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', phone)
      .single();

    if (existingUser) {
      logger.warn(`Phone already registered: ${phone}`);
      return res.status(400).json({ error: 'Bad request', message: 'Phone number already registered' });
    }

    // Generate email from phone for Supabase Auth
    const generatedEmail = `${phone}@${schoolId}.school`;

    // Create auth user with generated email
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: generatedEmail,
      password,
    });

    if (authError || !authData.user) {
      logger.error('Auth signup failed', authError);
      return res.status(400).json({ error: 'Signup failed', message: authError?.message || 'Unknown error' });
    }

    const userId = authData.user.id;

    // Create profile with phone
    const { error: profileError } = await supabase.from('profiles').insert([
      {
        id: userId,
        phone,
        email: email || null,
        first_name: firstName,
        last_name: lastName,
        role,
        school_id: schoolId,
      },
    ]);

    if (profileError) {
      logger.error('Profile creation failed', profileError);
      return res.status(400).json({ error: 'Signup failed', message: 'Failed to create profile' });
    }

    // Create role-specific record
    try {
      if (role === 'teacher') {
        await supabase.from('teachers').insert([
          {
            id: uuidv4(),
            user_id: userId,
            first_name: firstName,
            last_name: lastName,
            phone,
            title: title || null,
            school_id: schoolId,
          },
        ]);
      } else if (role === 'parent') {
        await supabase.from('parents').insert([
          {
            id: uuidv4(),
            user_id: userId,
            first_name: firstName,
            last_name: lastName,
            phone,
            school_id: schoolId,
          },
        ]);
      } else if (role === 'learner') {
        await supabase.from('learners').insert([
          {
            id: uuidv4(),
            user_id: userId,
            first_name: firstName,
            last_name: lastName,
            phone,
            school_id: schoolId,
          },
        ]);
      }
    } catch (err: unknown) {
      logger.warn('Role record creation non-critical error', err);
    }

    // Create token
    const token = createToken(userId, schoolId, role as 'teacher' | 'parent' | 'learner', phone);

    const userInfo: UserInfo = {
      id: userId,
      email: phone,
      firstName,
      lastName,
      role: role as any,
      schoolId,
    };

    logger.info(`Signup successful: ${userId}`);
    res.status(201).json({ token, user: userInfo });
  } catch (error) {
    logger.error('Signup error', error);
    res.status(500).json({ error: 'Server error', message: 'Internal server error' });
  }
});

/**
 * POST /auth/login
 * Phone OR Email + Password login
 */
router.post('/login', async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { credential, password } = req.body; // credential = phone OR email

    if (!credential || !password) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Missing phone/email or password',
      });
    }

    logger.info(`Login attempt: ${credential}`);

    // Determine if credential is phone or email
    const isPhone = credential.match(/^\d{10}$/) || credential.match(/^0[0-9]{9}$/);
    let generatedEmail = credential;

    if (isPhone) {
      // Find user by phone
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone', credential)
        .single();

      if (profileError || !profile) {
        logger.warn(`Phone not found: ${credential}`);
        return res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials' });
      }

      // Reconstruct email from phone and school_id
      generatedEmail = `${credential}@${profile.school_id}.school`;
    }

    // Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: generatedEmail,
      password,
    });

    if (authError || !authData.user) {
      logger.warn(`Login failed: ${credential}`);
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials' });
    }

    const userId = authData.user.id;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      logger.error('Profile not found', profileError);
      return res.status(400).json({ error: 'Login failed', message: 'Profile not found' });
    }

    const token = createToken(userId, profile.school_id || '', profile.role, profile.phone || generatedEmail);

    const userInfo: UserInfo = {
      id: userId,
      email: profile.phone || profile.email || generatedEmail,
      firstName: profile.first_name,
      lastName: profile.last_name,
      role: profile.role,
      schoolId: profile.school_id,
    };

    logger.info(`Login successful: ${userId}`);
    res.json({ token, user: userInfo });
  } catch (error) {
    logger.error('Login error', error);
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