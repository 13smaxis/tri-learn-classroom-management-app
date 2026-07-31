
import { Router, Request, Response } from 'express';
import { supabase } from '../services/supabase.js';
import { createToken } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import { normalizeInviteCode, inviteCodesMatch } from '../utils/inviteCode.js';
import { UserInfo } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/**
 * GET /auth/validate-invite/:code
 * Validate invite code and return school info
 */
router.get('/validate-invite/:code', async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { code } = req.params;

    if (!code || code.trim().length === 0) {
      return res.status(400).json({ error: 'Bad request', message: 'Invite code is required' });
    }

    logger.info(`Validating invite code: ${code}`);

    const normalizedInviteCode = normalizeInviteCode(code);
    const { data: schools, error } = await supabase
      .from('schools')
      .select('id, name, invite_code, district_number');

    if (error) {
      logger.error('Failed to query schools for invite validation', error);
      return res.status(500).json({ error: 'Server error', message: 'Failed to validate invite code' });
    }

    const school = (schools ?? []).find((candidate: { invite_code?: string | null }) =>
      inviteCodesMatch(normalizedInviteCode, candidate.invite_code ?? '')
    );

    if (!school) {
      logger.warn(`Invalid invite code: ${code}`);
      return res.status(404).json({ error: 'Not found', message: 'Invalid invite code' });
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
    res.status(500).json({ error: 'Server error', message: 'Failed to validate invite code' });
  }
});


/**
 * POST /auth/signup
 * Phone + Password signup
 */
router.post('/signup', async (req: Request, res: Response): Promise<Response | void> => {
  try {
      const { phone, email, password, firstName, lastName, role, inviteCode, teacherGrade } = req.body;                           //- Step 1: Extract required fields from request body

      if (!phone || !email || !password || !firstName || !lastName || !role || !inviteCode)                                       //- Check for missing required fields
      {
        return res.status(400).json({
          error: 'Bad request',
          message: 'Missing required: phone, email, password, firstName, lastName, role, inviteCode',
        });
      }

      if (!['teacher', 'parent', 'learner'].includes(role))                                                                       //- Check if role is valid
      {
        return res.status(400).json({ error: 'Bad request', message: 'Invalid role' });
      }

      logger.info(`Signup: ${phone} - ${email} - role: ${role}`);                                                                 //- Log signup attempt

      const normalizedInviteCode = normalizeInviteCode(inviteCode);                                                               //- Normalize invite code for comparison
      const { data: schools, error: schoolError } = await supabase                                                                //- Step 2: Query schools table to validate invite code
        .from('schools')
        .select('id, name, invite_code');

      if (schoolError)                                                                                                            //- Check for errors in querying schools table 
      {
        logger.error('Failed to query schools during signup', schoolError);
        return res.status(500).json({ error: 'Server error', message: 'Failed to validate invite code' });
      }

      const school = (schools ?? []).find((candidate: { invite_code?: string | null }) =>
        inviteCodesMatch(normalizedInviteCode, candidate.invite_code ?? '')
      );                                                                                                                          //- Find the school that matches the normalized invite code

      if (!school)                                                                                                                //- If no matching school is found, return an error
      {
        logger.warn(`Invalid invite code: ${inviteCode}`);
        return res.status(400).json({ error: 'Bad request', message: 'Invalid school invite code' });
      }

      const schoolId = school.id;                                                                                                 //- Extract the school ID from the matched school record


      const { data: existingPhone } = await supabase                                                                              //- Step 3: Check if phone number already exists in profiles table
        .from('profiles')
        .select('id')
        .eq('phone', phone)
        .maybeSingle();

      if (existingPhone)                                                                                                          //- If phone number already exists, return an error
      {
        logger.warn(`Phone already registered: ${phone}`);
        return res.status(400).json({
          error: 'Bad request',
          message: 'Phone number already registered'
        });
      }

      const { data: existingEmail } = await supabase                                                                              //- Step 4: Check if email already exists in profiles table
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (existingEmail)                                                                                                          //- If email already exists, return an error
      {
        logger.warn(`Email already registered: ${email}`);
        return res.status(400).json({
          error: 'Bad request',
          message: 'Email already registered'
        });
      }

     
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,                                                                                                                    // ← USE THE EMAIL FROM FRONTEND
        password,
      });                                                                                                                         //- Step 5: Create auth user with email and password

      if (authError || !authData.user)                                                                                            //- If auth user creation fails, log the error and return a response
      {
        logger.error('Auth signup failed', authError);
        return res.status(400).json({
          error: 'Signup failed',
          message: authError?.message || 'Unknown error'
        });
      }

      const userId = authData.user.id;                                                                                            //- Extract the user ID from the auth user creation response
      logger.info(`Auth user created: ${userId}`);                                                                                //- Log successful auth user creation


      const { error: profileError } = await supabase.from('profiles').insert([
        {
          id: userId,
          phone,
          email,
          first_name: firstName,
          last_name: lastName,
          role,
          school_id: schoolId,
        },
      ]);                                                                                                                         //- Step 6: Create profile with phone, email, and other details

      if (profileError)                                                                                                           //- If profile creation fails, log the error and return a response
      {
        logger.error('Profile creation failed', profileError);
        return res.status(400).json({ error: 'Signup failed', message: 'Failed to create profile' });
      }

      logger.info('Creating role-specific record for signup', { role, userId, schoolId });

      try {
        if (role === 'teacher') 
        {
          logger.info('Attempting to create teacher record...'); 
          const { data: teacherData, error: teacherError } = await supabase.from('teachers').insert([
            {
              id: uuidv4(),
              user_id: userId,
              first_name: firstName,
              last_name: lastName,
              phone,
              school_id: schoolId,
              grade_taught: teacherGrade || null,
              subject_specialization: null,
              employment_number: null,
              bio: null,
              department: null,
              subjects: null,
              avatar_url: null,
              emergency_contact: null,
              qualifications: null,
              availability_calendar: null,
            },
          ]).select().single();

          logger.info('Teacher insert response', { teacherData, teacherError });

          if (teacherError) {
            logger.error('Teacher creation failed', teacherError);
            throw new Error(`Teacher insert failed: ${teacherError.message}`);
          }

          logger.info(`Created teacher record for user ${userId} in school ${schoolId}`, { recordId: teacherData?.id });

        } else if (role === 'parent') {
          logger.info('Attempting to create parent record...');
          const { data: parentData, error: parentError } = await supabase.from('parents').insert([
            {
              id: uuidv4(),
              user_id: userId,
              first_name: firstName,
              last_name: lastName,
              phone,
              school_id: schoolId,
            },
          ]).select().single();

          logger.info('Parent insert response', { parentData, parentError });

          if (parentError) {
            logger.error('Parent creation failed', parentError);
            throw new Error(`Parent insert failed: ${parentError.message}`);
          }

          logger.info(`Created parent record for user ${userId} in school ${schoolId}`, { recordId: parentData?.id });
          
        } else if (role === 'learner') {
          logger.info('Attempting to create learner record...');
          const { data: learnerData, error: learnerError } = await supabase.from('learners').insert([
            {
              id: uuidv4(),
              user_id: userId,
              first_name: firstName,
              last_name: lastName,
              phone,
              school_id: schoolId,
            },
          ]).select().single();

          logger.info('Learner insert response', { learnerData, learnerError });

          if (learnerError) {
            logger.error('Learner creation failed', learnerError);
            throw new Error(`Learner insert failed: ${learnerError.message}`);
          }

          logger.info(`Created learner record for user ${userId} in school ${schoolId}`, { recordId: learnerData?.id });
        }
      } catch (err) {
        logger.error('Role record creation failed', err);
        return res.status(500).json({ error: 'Signup failed', message: 'Failed to create role-specific record' });
      }

      // Create token
      const token = createToken(userId, schoolId, role, phone);

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
 * POST /auth/signup
 * Phone + Password signup
 *
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
    const normalizedInviteCode = normalizeInviteCode(inviteCode);
    const { data: schools, error: schoolError } = await supabase
      .from('schools')
      .select('id, name, invite_code');

    if (schoolError) {
      logger.error('Failed to query schools during signup', schoolError);
      return res.status(500).json({ error: 'Server error', message: 'Failed to validate invite code' });
    }

    const school = (schools ?? []).find((candidate: { invite_code?: string | null }) =>
      inviteCodesMatch(normalizedInviteCode, candidate.invite_code ?? '')
    );

    if (!school) {
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
});*/

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