import path from 'node:path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger.js';

const repoRoot = path.resolve(process.cwd(), '..');
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(repoRoot, '.env') });
dotenv.config({ path: path.resolve(repoRoot, '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

// Create Supabase client with service role key (bypasses RLS for backend)
export const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Get user profile from Supabase
 */
export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      logger.error('Failed to get user profile', error);
      return null;
    }

    return data;
  } catch (error) {
    logger.error('Error fetching user profile', error);
    return null;
  }
}

/**
 * Create user profile
 */
export async function createUserProfile(userId: string, data: Record<string, unknown>) {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .insert([{ id: userId, ...data }])
      .select()
      .single();

    if (error) {
      logger.error('Failed to create user profile', error);
      throw new Error('Failed to create user profile');
    }

    return profile;
  } catch (error) {
    logger.error('Error creating user profile', error);
    throw error;
  }
}

/**
 * Get classes for a teacher
 */
export async function getTeacherClasses(teacherId: string) {
  try {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to get teacher classes', error);
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error('Error fetching teacher classes', error);
    return [];
  }
}

/**
 * Get single class
 */
export async function getClass(classId: string) {
  try {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('id', classId)
      .single();

    if (error) {
      logger.error('Failed to get class', error);
      return null;
    }

    return data;
  } catch (error) {
    logger.error('Error fetching class', error);
    return null;
  }
}

/**
 * Get teacher record ID by auth user ID
 */
export async function getTeacherIdByUserId(userId: string) {
  try {
    const { data, error } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (error) {
      logger.error('Failed to get teacher id by user id', error);
      return null;
    }

    return data?.id ?? null;
  } catch (error) {
    logger.error('Error fetching teacher id', error);
    return null;
  }
}

/**
 * Create class
 */
export async function createClass(classData: Record<string, unknown>) 
{
  try {
    const { data, error } = await supabase
      .from('classes')
      .insert([classData])
      .select()
      .single();

    if (error) {
      logger.error('Failed to create class', error);
      throw new Error('Failed to create class');
    }

    return data;
  } catch (error) {
    logger.error('Error creating class', error);
    throw error;
  }
}

/**
 * Update class
 */
export async function updateClass(classId: string, data: Record<string, unknown>) {
  try {
    const { data: updated, error } = await supabase
      .from('classes')
      .update(data)
      .eq('id', classId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update class', error);
      throw new Error('Failed to update class');
    }

    return updated;
  } catch (error) {
    logger.error('Error updating class', error);
    throw error;
  }
}

/**
 * Get class members (learners in a class)
 */
export async function getClassMembers(classId: string) {
  try {
    const { data, error } = await supabase
      .from('class_members')
      .select('*, learners(*)')
      .eq('class_id', classId);

    if (error) {
      logger.error('Failed to get class members', error);
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error('Error fetching class members', error);
    return [];
  }
}

/**
 * Record marks
 */
export async function recordMarks(marksData: Record<string, unknown>) {
  try {
    const { data, error } = await supabase
      .from('marks')
      .insert([marksData])
      .select()
      .single();

    if (error) {
      logger.error('Failed to record marks', error);
      throw new Error('Failed to record marks');
    }

    return data;
  } catch (error) {
    logger.error('Error recording marks', error);
    throw error;
  }
}

/**
 * Record attendance
 */
export async function recordAttendance(attendanceData: Record<string, unknown>) {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .insert([attendanceData])
      .select()
      .single();

    if (error) {
      logger.error('Failed to record attendance', error);
      throw new Error('Failed to record attendance');
    }

    return data;
  } catch (error) {
    logger.error('Error recording attendance', error);
    throw error;
  }
}

/**
 * Get learner marks for a class
 */
export async function getLearnerMarks(learnerId: string, classId: string) {
  try {
    const { data, error } = await supabase
      .from('marks')
      .select('*')
      .eq('learner_id', learnerId)
      .eq('class_id', classId);

    if (error) {
      logger.error('Failed to get learner marks', error);
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error('Error fetching learner marks', error);
    return [];
  }
}

/**
 * Delete item by ID
 */
export async function deleteItem(table: string, id: string) {
  try {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);

    if (error) {
      logger.error(`Failed to delete from ${table}`, error);
      throw new Error(`Failed to delete from ${table}`);
    }

    return true;
  } catch (error) {
    logger.error(`Error deleting from ${table}`, error);
    throw error;
  }
}
