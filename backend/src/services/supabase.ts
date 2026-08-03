import path from 'node:path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
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
export async function createClass(classData: Record<string, unknown>) {
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
 * Class member status values
 */
export type ClassMemberStatus = 'active' | 'inactive' | 'dropped';

const VALID_CLASS_MEMBER_STATUS: ClassMemberStatus[] = ['active', 'inactive', 'dropped'];

function validateClassMemberStatus(status?: string): ClassMemberStatus {
  if (!status) {
    return 'active';
  }

  const normalized = status.toLowerCase();
  if (VALID_CLASS_MEMBER_STATUS.includes(normalized as ClassMemberStatus)) {
    return normalized as ClassMemberStatus;
  }

  throw new Error(`Invalid class member status: ${status}`);
}

/**
 * Get class members (learners in a class)
 */
export async function getClassMembers(classId: string) {
  try {
    const { data, error } = await supabase
      .from('class_members')
      .select('id, class_id, learner_id, joined_at, status')
      .eq('class_id', classId)
      .order('joined_at', { ascending: false });

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

export function buildLearnerRecordPayload(learnerData: Record<string, unknown>) {
  const rawFullName = typeof learnerData.fullName === 'string'
    ? learnerData.fullName
    : typeof learnerData.full_name === 'string'
      ? learnerData.full_name
      : '';

  const trimmedFullName = rawFullName.trim();
  const nameParts = trimmedFullName.split(/\s+/).filter(Boolean);

  const firstName = typeof learnerData.first_name === 'string' && learnerData.first_name.trim()
    ? learnerData.first_name.trim()
    : typeof learnerData.firstName === 'string' && learnerData.firstName.trim()
      ? learnerData.firstName.trim()
      : nameParts.shift() || '';

  const lastName = typeof learnerData.last_name === 'string' && learnerData.last_name.trim()
    ? learnerData.last_name.trim()
    : typeof learnerData.lastName === 'string' && learnerData.lastName.trim()
      ? learnerData.lastName.trim()
      : nameParts.join(' ');

  const learnerNumber = typeof learnerData.learnerNumber === 'string'
    ? learnerData.learnerNumber
    : typeof learnerData.phone === 'string'
      ? learnerData.phone
      : typeof learnerData.student_number === 'string'
        ? learnerData.student_number
        : '';

  const payload: Record<string, unknown> = {
    ...learnerData,
    first_name: firstName,
    last_name: lastName,
    phone: learnerNumber || null,
    grade: learnerData.grade ?? null,
    enrollment_date: learnerData.enrollment_date ?? new Date().toISOString().split('T')[0],
    user_id: learnerData.user_id ?? null,
    created_at: learnerData.created_at ?? new Date().toISOString(),
    updated_at: learnerData.updated_at ?? new Date().toISOString(),
  };

  delete payload.full_name;
  delete payload.fullName;
  delete payload.firstName;
  delete payload.lastName;
  delete payload.learnerNumber;
  delete payload.student_number;

  return payload;
}

/**
 * Create a learner record (simple - no auth)
 * Auth user is created during learner onboarding
 */
export async function createLearnerRecord(learnerData: Record<string, unknown>) {
  try {
    const payload = buildLearnerRecordPayload(learnerData);

    // Ensure ID is generated
    const dataWithId = {
      id: uuidv4(),
      ...payload,
    };

    const { data, error } = await supabase
      .from('learners')
      .insert([dataWithId])
      .select()
      .single();

    if (error) {
      logger.error('Failed to create learner record', error);
      throw new Error(error.message || 'Failed to create learner record');
    }

    return data;
  } catch (error) {
    logger.error('Error creating learner record', error);
    throw error;
  }
}

/**
 * Add learner to a class
 */
export async function addClassMember(classId: string, learnerId: string, status: ClassMemberStatus = 'active') {
  const validStatus = validateClassMemberStatus(status);

  try {
    const { data, error } = await supabase
      .from('class_members')
      .insert([
        {
          class_id: classId,
          learner_id: learnerId,
          status: validStatus,
        },
      ])
      .select()
      .single();

    if (error) {
      logger.error('Failed to add learner to class', error);
      throw new Error(error.message || 'Failed to add learner to class');
    }

    return data;
  } catch (error) {
    logger.error('Error adding learner to class', error);
    throw error;
  }
}

/**
 * Update a learner's membership status in a class
 */
export async function updateClassMemberStatus(classId: string, learnerId: string, status: ClassMemberStatus) {
  const validStatus = validateClassMemberStatus(status);

  try {
    const { data, error } = await supabase
      .from('class_members')
      .update({ status: validStatus })
      .eq('class_id', classId)
      .eq('learner_id', learnerId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update class member status', error);
      throw new Error(error.message || 'Failed to update class member status');
    }

    return data;
  } catch (error) {
    logger.error('Error updating class member status', error);
    throw error;
  }
}

/**
 * Remove learner from a class
 */
export async function removeClassMember(classId: string, learnerId: string) {
  try {
    const { error } = await supabase
      .from('class_members')
      .delete()
      .eq('class_id', classId)
      .eq('learner_id', learnerId);

    if (error) {
      logger.error('Failed to remove learner from class', error);
      throw new Error(error.message || 'Failed to remove learner from class');
    }

    return true;
  } catch (error) {
    logger.error('Error removing learner from class', error);
    throw error;
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

/**
 * Get learner by student number
 */
export async function getLearnerByStudentNumber(studentNumber: string) {
  try {
    const normalizedStudentNumber = studentNumber.trim().toLowerCase();
    const { data, error } = await supabase
      .from('learners')
      .select('*')
      .limit(200);

    if (error) {
      logger.error('Failed to get learner by student number', error);
      throw new Error(error.message || 'Failed to get learner');
    }

    const learner = (data ?? []).find((candidate: Record<string, unknown>) => {
      const candidateValues = [
        candidate.student_number,
        candidate.phone,
        candidate.phone_number,
      ];

      return candidateValues.some((value) => {
        if (typeof value !== 'string') {
          return false;
        }

        return value.trim().toLowerCase() === normalizedStudentNumber;
      });
    });

    return learner ?? null;
  } catch (error) {
    logger.error('Error fetching learner by student number', error);
    throw error;
  }
}

/**
 * Get learner by ID with full details
 */
export async function getLearnerById(learnerId: string) {
  try {
    const { data, error } = await supabase
      .from('learners')
      .select('*')
      .eq('id', learnerId)
      .single();

    if (error) {
      logger.error('Failed to get learner by id', error);
      return null;
    }

    return data;
  } catch (error) {
    logger.error('Error fetching learner by id', error);
    return null;
  }
}

/**
 * Update learner record
 */
export async function updateLearnerRecord(learnerId: string, data: Record<string, unknown>) {
  try {
    const { data: updated, error } = await supabase
      .from('learners')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', learnerId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update learner record', error);
      throw new Error(error.message || 'Failed to update learner');
    }

    return updated;
  } catch (error) {
    logger.error('Error updating learner record', error);
    throw error;
  }
}

/**
 * Bulk add learners to class
 * Simply creates learner records and adds them to the class
 * Auth user is created during learner onboarding
 */
export async function bulkAddLearnersToClass(
  classId: string,
  learnersData: Array<{ learnerNumber: string; fullName: string; grade?: string }>
) {
  const results = {
    success: [] as any[],
    failed: [] as Array<{ learnerNumber: string; fullName: string; error: string }>,
    total: learnersData.length,
  };

  for (const learner of learnersData) {
    try {
      // Check if learner already exists
      const existing = await getLearnerByStudentNumber(learner.learnerNumber);
      
      let learnerRecord;
      if (existing) {
        logger.info(`Learner already exists: ${learner.learnerNumber}`);
        learnerRecord = existing;
      } else {
        // Create new learner record (simple - no auth)
        learnerRecord = await createLearnerRecord({
          student_number: learner.learnerNumber,
          full_name: learner.fullName,
          grade: learner.grade || null,
          enrollment_date: new Date().toISOString().split('T')[0],
          user_id: null, // Will be filled during onboarding
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        logger.info(`Learner created: ${learner.learnerNumber} - ${learner.fullName}`, {
          learnerId: learnerRecord.id,
        });
      }

      // Add to class
      const classMember = await addClassMember(classId, learnerRecord.id, 'active');

      results.success.push({
        learnerNumber: learner.learnerNumber,
        fullName: learner.fullName,
        learnerId: learnerRecord.id,
        classMemberId: classMember.id,
      });

      logger.info(`Added learner to class: ${learner.learnerNumber}`, {
        learnerId: learnerRecord.id,
        classId,
      });
    } catch (error: any) {
      logger.error(`Failed to add learner ${learner.learnerNumber}`, error);

      results.failed.push({
        learnerNumber: learner.learnerNumber,
        fullName: learner.fullName,
        error: error?.message || 'Unknown error',
      });
    }
  }

  return results;
}