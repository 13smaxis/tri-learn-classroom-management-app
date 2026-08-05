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
    logger.debug('Querying class_members table for class', { classId });

    const { data, error } = await supabase
      .from('class_members')
      .select('id, class_id, learner_id, joined_at, status')
      .eq('class_id', classId)
      .order('joined_at', { ascending: false });

    if (error) {
      logger.error('Failed to get class members', error, { classId });
      return [];
    }

    const members = data || [];
    logger.info('Class members fetched', { classId, memberCount: members.length });
    return members;
  } catch (error) {
    logger.error('Error fetching class members', error, { classId });
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
 * Update classwork submissions and marks
 */
export async function updateClassworkSubmissions(
  classworkId: string,
  classId: string,
  entries: { learnerId: string; submitted: boolean; mark: number | null }[],
  teacherId: string,
) {
  try {
    const results: any[] = [];

    for (const entry of entries) {
      const { learnerId, submitted, mark } = entry;
      if (!learnerId) continue;

      const { data: existingRecord, error: fetchError } = await supabase
        .from('marks')
        .select('id')
        .eq('classwork_id', classworkId)
        .eq('learner_id', learnerId)
        .maybeSingle();

      if (fetchError) {
        logger.error('Failed to fetch existing classwork mark record', fetchError, {
          classworkId,
          learnerId,
        });
        throw new Error('Failed to update classwork submissions');
      }

      if (!submitted) {
        if (existingRecord?.id) {
          const { error: deleteError } = await supabase
            .from('marks')
            .delete()
            .eq('id', existingRecord.id);

          if (deleteError) {
            logger.error('Failed to delete classwork mark record', deleteError, {
              classworkId,
              learnerId,
            });
            throw new Error('Failed to update classwork submissions');
          }
        }

        continue;
      }

      const recordData: Record<string, unknown> = {
        classwork_id: classworkId,
        class_id: classId,
        learner_id: learnerId,
        mark,
        total_mark: mark !== null ? 100 : null,
        percentage: mark !== null ? Math.round((mark / 100) * 10000) / 100 : null,
        recorded_by: teacherId,
        updated_at: new Date().toISOString(),
      };

      if (existingRecord?.id) {
        const { data, error } = await supabase
          .from('marks')
          .update(recordData)
          .eq('id', existingRecord.id)
          .select()
          .single();

        if (error) {
          logger.error('Failed to update classwork mark record', error, {
            classworkId,
            learnerId,
          });
          throw new Error('Failed to update classwork submissions');
        }

        results.push(data);
      } else {
        const insertData = {
          id: uuidv4(),
          ...recordData,
          created_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from('marks')
          .insert([insertData])
          .select()
          .single();

        if (error) {
          logger.error('Failed to insert classwork mark record', error, {
            classworkId,
            learnerId,
          });
          throw new Error('Failed to update classwork submissions');
        }

        results.push(data);
      }
    }

    return results;
  } catch (error) {
    logger.error('Error updating classwork submissions', error, {
      classworkId,
      classId,
      teacherId,
    });
    throw error;
  }
}

/**
 * Toggle a classwork star for a learner
 */
export async function toggleClassworkStar(
  classworkId: string,
  classId: string,
  learnerId: string,
  teacherId: string,
) {
  try {
    const { data: existingStar, error: fetchError } = await supabase
      .from('stars')
      .select('id')
      .eq('classwork_id', classworkId)
      .eq('class_id', classId)
      .eq('learner_id', learnerId)
      .maybeSingle();

    if (fetchError) {
      logger.error('Failed to fetch existing star record', fetchError, {
        classworkId,
        classId,
        learnerId,
      });
      throw new Error('Failed to toggle star');
    }

    if (existingStar?.id) {
      const { error: deleteError } = await supabase
        .from('stars')
        .delete()
        .eq('id', existingStar.id);

      if (deleteError) {
        logger.error('Failed to delete star record', deleteError, {
          classworkId,
          classId,
          learnerId,
        });
        throw new Error('Failed to toggle star');
      }

      return { awarded: false };
    }

    const starData = {
      id: uuidv4(),
      classwork_id: classworkId,
      class_id: classId,
      learner_id: learnerId,
      teacher_id: teacherId,
      star_count: 1,
      note: 'Classwork star',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: createdStar, error: insertError } = await supabase
      .from('stars')
      .insert([starData])
      .select()
      .single();

    if (insertError) {
      logger.error('Failed to insert star record', insertError, {
        classworkId,
        classId,
        learnerId,
      });
      throw new Error('Failed to toggle star');
    }

    return { awarded: true, star: createdStar };
  } catch (error) {
    logger.error('Error toggling classwork star', error, {
      classworkId,
      classId,
      learnerId,
      teacherId,
    });
    throw error;
  }
}

export async function createHomework(homeworkData: Record<string, unknown>) {
  try {
    const { data, error } = await supabase
      .from('homework')
      .insert([homeworkData])
      .select()
      .single();

    if (error) {
      logger.error('Failed to create homework', error);
      throw new Error(error.message || 'Failed to create homework');
    }

    return data;
  } catch (error) {
    logger.error('Error creating homework', error);
    throw error;
  }
}

export async function getHomeworkCount() {
  try {
    const { count, error } = await supabase
      .from('homework')
      .select('id', { count: 'exact', head: true });

    if (error) {
      logger.error('Failed to count homework', error);
      return 0;
    }

    return count ?? 0;
  } catch (error) {
    logger.error('Error counting homework', error);
    return 0;
  }
}

export async function getHomeworkCountForClass(classId: string) {
  try {
    const { count, error } = await supabase
      .from('homework')
      .select('id', { count: 'exact', head: true })
      .eq('class_id', classId);

    if (error) {
      logger.error('Failed to count homework for class', error, { classId });
      return 0;
    }

    return count ?? 0;
  } catch (error) {
    logger.error('Error counting homework for class', error, { classId });
    return 0;
  }
}

export async function getHomeworkByClass(classId: string) {
  try {
    const { data, error } = await supabase
      .from('homework')
      .select('*')
      .eq('class_id', classId)
      .order('due_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to get homework for class', error, { classId });
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error('Error fetching homework for class', error, { classId });
    return [];
  }
}

export async function getHomeworkById(id: string) {
  try {
    const { data, error } = await supabase
      .from('homework')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      logger.error('Failed to get homework by id', error, { id });
      return null;
    }

    return data;
  } catch (error) {
    logger.error('Error fetching homework by id', error, { id });
    return null;
  }
}

export async function getHomeworkDetail(id: string) {
  try {
    const homework = await getHomeworkById(id);
    if (!homework) return null;

    const classId = homework.class_id ?? homework.classId;
    const members = await getClassMembers(classId);
    const learnerIds = (members || []).map((m: any) => m.learner_id).filter(Boolean);

    let learnersMap: Record<string, any> = {};
    if (learnerIds.length > 0) {
      const { data: learnersData, error: learnersError } = await supabase
        .from('learners')
        .select('*')
        .in('id', learnerIds);

      if (!learnersError && Array.isArray(learnersData)) {
        learnersMap = learnersData.reduce((acc: any, l: any) => {
          acc[l.id] = l;
          return acc;
        }, {} as Record<string, any>);
      }
    }

    let submissions: any[] = [];
    const submissionTableCandidates = ['homework_submissions', 'submissions', 'class_submissions'];
    for (const tbl of submissionTableCandidates) {
      try {
        const { data, error } = await supabase
          .from(tbl)
          .select('*')
          .eq('homework_id', id);
        if (!error && Array.isArray(data) && data.length > 0) {
          submissions = data;
          break;
        }
      } catch {
        // ignore and continue
      }
    }

    let marksForHomework: any[] = [];
    try {
      const { data: marksData, error: marksError } = await supabase
        .from('marks')
        .select('*')
        .eq('homework_id', id);
      if (!marksError && Array.isArray(marksData) && marksData.length > 0) {
        marksForHomework = marksData;
      }
    } catch {
      // ignore
    }

    let stars: any[] = [];
    const starTableCandidates = ['homework_stars', 'stars', 'awards'];
    for (const tbl of starTableCandidates) {
      try {
        const { data, error } = await supabase
          .from(tbl)
          .select('*')
          .eq('homework_id', id);
        if (!error && Array.isArray(data) && data.length > 0) {
          stars = data;
          break;
        }
      } catch {
        // ignore
      }
    }

    const submissionsByLearner: Record<string, any> = {};
    for (const s of submissions) {
      if (s.learner_id) submissionsByLearner[s.learner_id] = s;
    }
    for (const m of marksForHomework) {
      if (m.learner_id && !submissionsByLearner[m.learner_id]) submissionsByLearner[m.learner_id] = m;
    }

    const starsByLearner: Record<string, any> = {};
    for (const s of stars) {
      if (!s.learner_id) continue;
      if (!starsByLearner[s.learner_id]) starsByLearner[s.learner_id] = [];
      starsByLearner[s.learner_id].push(s);
    }

    let submittedCount = 0;
    let passCount = 0;
    const passMark = (homework.pass_mark ?? homework.passMark ?? 50);

    const learnerRows = (members || []).map((member: any) => {
      const learner = learnersMap[member.learner_id] || null;
      const submission = submissionsByLearner[member.learner_id] || null;
      const mark = submission && (submission.mark ?? submission.score ?? submission.points ?? null);
      const submitted = Boolean(submission);
      const passed = typeof mark === 'number' ? mark >= passMark : false;

      if (submitted) submittedCount += 1;
      if (passed) passCount += 1;

      const starList = starsByLearner[member.learner_id] || [];

      return {
        learnerId: member.learner_id,
        classMemberId: member.id,
        firstName: learner?.first_name ?? learner?.firstName ?? null,
        lastName: learner?.last_name ?? learner?.lastName ?? null,
        fullName: [learner?.first_name, learner?.last_name].filter(Boolean).join(' ') || learner?.full_name || null,
        studentNumber: learner?.student_number ?? learner?.phone ?? learner?.phone_number ?? null,
        submitted,
        submissionId: submission?.id ?? null,
        mark: typeof mark === 'number' ? mark : null,
        passed,
        totalStars: Array.isArray(starList) ? starList.length : 0,
        homeworkStarAwarded: (starList || []).some((s: any) => s.homework_id === id),
      };
    });

    const totalLearners = learnerIds.length;
    const submissionRate = totalLearners > 0 ? Math.round((submittedCount / totalLearners) * 100) : 0;
    const passRate = totalLearners > 0 ? Math.round((passCount / totalLearners) * 100) : 0;
    const topLearners = learnerRows
      .filter((r: any) => typeof r.mark === 'number')
      .sort((a: any, b: any) => b.mark - a.mark)
      .slice(0, 5)
      .map((r: any) => ({ learnerId: r.learnerId, fullName: r.fullName, mark: r.mark }));

    return {
      id: homework.id,
      title: homework.title,
      description: homework.description ?? homework.body ?? null,
      classId,
      teacherId: homework.teacher_id ?? homework.teacherId ?? null,
      lessonDate: homework.lesson_date ?? homework.lessonDate ?? null,
      dueDate: homework.due_date ?? homework.dueDate ?? null,
      createdAt: homework.created_at ?? homework.createdAt ?? null,
      updatedAt: homework.updated_at ?? homework.updatedAt ?? null,
      totalLearners,
      submittedCount,
      submissionRate,
      passCount,
      passRate,
      learnerRows,
      topLearners,
      raw: homework,
    };
  } catch (error) {
    logger.error('Error building homework detail', error, { id });
    return null;
  }
}

export async function updateHomeworkSubmissions(
  homeworkId: string,
  classId: string,
  entries: { learnerId: string; submitted: boolean; mark: number | null }[],
  teacherId: string,
) {
  try {
    const results: any[] = [];

    for (const entry of entries) {
      const { learnerId, submitted, mark } = entry;
      if (!learnerId) continue;

      const { data: existingRecord, error: fetchError } = await supabase
        .from('marks')
        .select('id')
        .eq('homework_id', homeworkId)
        .eq('learner_id', learnerId)
        .maybeSingle();

      if (fetchError) {
        logger.error('Failed to fetch existing homework mark record', fetchError, {
          homeworkId,
          learnerId,
        });
        throw new Error('Failed to update homework submissions');
      }

      if (!submitted) {
        if (existingRecord?.id) {
          const { error: deleteError } = await supabase
            .from('marks')
            .delete()
            .eq('id', existingRecord.id);

          if (deleteError) {
            logger.error('Failed to delete homework mark record', deleteError, {
              homeworkId,
              learnerId,
            });
            throw new Error('Failed to update homework submissions');
          }
        }

        continue;
      }

      const recordData: Record<string, unknown> = {
        homework_id: homeworkId,
        class_id: classId,
        learner_id: learnerId,
        mark,
        total_mark: mark !== null ? 100 : null,
        percentage: mark !== null ? Math.round((mark / 100) * 10000) / 100 : null,
        recorded_by: teacherId,
        updated_at: new Date().toISOString(),
      };

      if (existingRecord?.id) {
        const { data, error } = await supabase
          .from('marks')
          .update(recordData)
          .eq('id', existingRecord.id)
          .select()
          .single();

        if (error) {
          logger.error('Failed to update homework mark record', error, {
            homeworkId,
            learnerId,
          });
          throw new Error('Failed to update homework submissions');
        }

        results.push(data);
      } else {
        const insertData = {
          id: uuidv4(),
          ...recordData,
          created_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from('marks')
          .insert([insertData])
          .select()
          .single();

        if (error) {
          logger.error('Failed to insert homework mark record', error, {
            homeworkId,
            learnerId,
          });
          throw new Error('Failed to update homework submissions');
        }

        results.push(data);
      }
    }

    return results;
  } catch (error) {
    logger.error('Error updating homework submissions', error, {
      homeworkId,
      classId,
      teacherId,
    });
    throw error;
  }
}

export async function toggleHomeworkStar(
  homeworkId: string,
  classId: string,
  learnerId: string,
  teacherId: string,
) {
  try {
    const { data: existingStar, error: fetchError } = await supabase
      .from('stars')
      .select('id')
      .eq('homework_id', homeworkId)
      .eq('class_id', classId)
      .eq('learner_id', learnerId)
      .maybeSingle();

    if (fetchError) {
      logger.error('Failed to fetch existing homework star record', fetchError, {
        homeworkId,
        classId,
        learnerId,
      });
      throw new Error('Failed to toggle homework star');
    }

    if (existingStar?.id) {
      const { error: deleteError } = await supabase
        .from('stars')
        .delete()
        .eq('id', existingStar.id);

      if (deleteError) {
        logger.error('Failed to delete homework star record', deleteError, {
          homeworkId,
          classId,
          learnerId,
        });
        throw new Error('Failed to toggle homework star');
      }

      return { awarded: false };
    }

    const starData = {
      id: uuidv4(),
      homework_id: homeworkId,
      class_id: classId,
      learner_id: learnerId,
      teacher_id: teacherId,
      star_count: 1,
      note: 'Homework star',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: createdStar, error: insertError } = await supabase
      .from('stars')
      .insert([starData])
      .select()
      .single();

    if (insertError) {
      logger.error('Failed to insert homework star record', insertError, {
        homeworkId,
        classId,
        learnerId,
      });
      throw new Error('Failed to toggle homework star');
    }

    return { awarded: true, star: createdStar };
  } catch (error) {
    logger.error('Error toggling homework star', error, {
      homeworkId,
      classId,
      learnerId,
      teacherId,
    });
    throw error;
  }
}

export async function createAssignment(assignmentData: Record<string, unknown>) {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .insert([assignmentData])
      .select()
      .single();

    if (error) {
      logger.error('Failed to create assignment', error);
      throw new Error(error.message || 'Failed to create assignment');
    }

    return data;
  } catch (error) {
    logger.error('Error creating assignment', error);
    throw error;
  }
}

export async function getAssignmentCount() {
  try {
    const { count, error } = await supabase
      .from('assignments')
      .select('id', { count: 'exact', head: true });

    if (error) {
      logger.error('Failed to count assignments', error);
      return 0;
    }

    return count ?? 0;
  } catch (error) {
    logger.error('Error counting assignments', error);
    return 0;
  }
}

export async function getAssignmentCountForClass(classId: string) {
  try {
    const { count, error } = await supabase
      .from('assignments')
      .select('id', { count: 'exact', head: true })
      .eq('class_id', classId);

    if (error) {
      logger.error('Failed to count assignments for class', error, { classId });
      return 0;
    }

    return count ?? 0;
  } catch (error) {
    logger.error('Error counting assignments for class', error, { classId });
    return 0;
  }
}

export async function getAssignmentsByClass(classId: string) {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('class_id', classId)
      .order('due_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to get assignments for class', error, { classId });
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error('Error fetching assignments for class', error, { classId });
    return [];
  }
}

export async function getAssignmentById(id: string) {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      logger.error('Failed to get assignment by id', error, { id });
      return null;
    }

    return data;
  } catch (error) {
    logger.error('Error fetching assignment by id', error, { id });
    return null;
  }
}

export async function getAssignmentDetail(id: string) {
  try {
    const assignment = await getAssignmentById(id);
    if (!assignment) return null;

    const classId = assignment.class_id ?? assignment.classId;
    const members = await getClassMembers(classId);
    const learnerIds = (members || []).map((m: any) => m.learner_id).filter(Boolean);

    let learnersMap: Record<string, any> = {};
    if (learnerIds.length > 0) {
      const { data: learnersData, error: learnersError } = await supabase
        .from('learners')
        .select('*')
        .in('id', learnerIds);

      if (!learnersError && Array.isArray(learnersData)) {
        learnersMap = learnersData.reduce((acc: any, l: any) => {
          acc[l.id] = l;
          return acc;
        }, {} as Record<string, any>);
      }
    }

    let submissions: any[] = [];
    const submissionTableCandidates = ['assignment_submissions', 'submissions', 'class_submissions'];
    for (const tbl of submissionTableCandidates) {
      try {
        const { data, error } = await supabase
          .from(tbl)
          .select('*')
          .eq('assignment_id', id);
        if (!error && Array.isArray(data) && data.length > 0) {
          submissions = data;
          break;
        }
      } catch {
        // ignore
      }
    }

    let marksForAssignment: any[] = [];
    try {
      const { data: marksData, error: marksError } = await supabase
        .from('marks')
        .select('*')
        .eq('assignment_id', id);
      if (!marksError && Array.isArray(marksData) && marksData.length > 0) {
        marksForAssignment = marksData;
      }
    } catch {
      // ignore
    }

    let stars: any[] = [];
    const starTableCandidates = ['assignment_stars', 'stars', 'awards'];
    for (const tbl of starTableCandidates) {
      try {
        const { data, error } = await supabase
          .from(tbl)
          .select('*')
          .eq('assignment_id', id);
        if (!error && Array.isArray(data) && data.length > 0) {
          stars = data;
          break;
        }
      } catch {
        // ignore
      }
    }

    const submissionsByLearner: Record<string, any> = {};
    for (const s of submissions) {
      if (s.learner_id) submissionsByLearner[s.learner_id] = s;
    }
    for (const m of marksForAssignment) {
      if (m.learner_id && !submissionsByLearner[m.learner_id]) submissionsByLearner[m.learner_id] = m;
    }

    const starsByLearner: Record<string, any> = {};
    for (const s of stars) {
      if (!s.learner_id) continue;
      if (!starsByLearner[s.learner_id]) starsByLearner[s.learner_id] = [];
      starsByLearner[s.learner_id].push(s);
    }

    let submittedCount = 0;
    let passCount = 0;
    const passMark = (assignment.pass_mark ?? assignment.passMark ?? 50);

    const learnerRows = (members || []).map((member: any) => {
      const learner = learnersMap[member.learner_id] || null;
      const submission = submissionsByLearner[member.learner_id] || null;
      const mark = submission && (submission.mark ?? submission.score ?? submission.points ?? null);
      const submitted = Boolean(submission);
      const passed = typeof mark === 'number' ? mark >= passMark : false;

      if (submitted) submittedCount += 1;
      if (passed) passCount += 1;

      const starList = starsByLearner[member.learner_id] || [];

      return {
        learnerId: member.learner_id,
        classMemberId: member.id,
        firstName: learner?.first_name ?? learner?.firstName ?? null,
        lastName: learner?.last_name ?? learner?.lastName ?? null,
        fullName: [learner?.first_name, learner?.last_name].filter(Boolean).join(' ') || learner?.full_name || null,
        studentNumber: learner?.student_number ?? learner?.phone ?? learner?.phone_number ?? null,
        submitted,
        submissionId: submission?.id ?? null,
        mark: typeof mark === 'number' ? mark : null,
        passed,
        totalStars: Array.isArray(starList) ? starList.length : 0,
        assignmentStarAwarded: (starList || []).some((s: any) => s.assignment_id === id),
      };
    });

    const totalLearners = learnerIds.length;
    const submissionRate = totalLearners > 0 ? Math.round((submittedCount / totalLearners) * 100) : 0;
    const passRate = totalLearners > 0 ? Math.round((passCount / totalLearners) * 100) : 0;
    const topLearners = learnerRows
      .filter((r: any) => typeof r.mark === 'number')
      .sort((a: any, b: any) => b.mark - a.mark)
      .slice(0, 5)
      .map((r: any) => ({ learnerId: r.learnerId, fullName: r.fullName, mark: r.mark }));

    return {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description ?? assignment.body ?? null,
      classId,
      teacherId: assignment.teacher_id ?? assignment.teacherId ?? null,
      lessonDate: assignment.lesson_date ?? assignment.lessonDate ?? null,
      dueDate: assignment.due_date ?? assignment.dueDate ?? null,
      createdAt: assignment.created_at ?? assignment.createdAt ?? null,
      updatedAt: assignment.updated_at ?? assignment.updatedAt ?? null,
      totalLearners,
      submittedCount,
      submissionRate,
      passCount,
      passRate,
      learnerRows,
      topLearners,
      raw: assignment,
    };
  } catch (error) {
    logger.error('Error building assignment detail', error, { id });
    return null;
  }
}

export async function updateAssignmentSubmissions(
  assignmentId: string,
  classId: string,
  entries: { learnerId: string; submitted: boolean; mark: number | null }[],
  teacherId: string,
) {
  try {
    const results: any[] = [];

    for (const entry of entries) {
      const { learnerId, submitted, mark } = entry;
      if (!learnerId) continue;

      const { data: existingRecord, error: fetchError } = await supabase
        .from('marks')
        .select('id')
        .eq('assignment_id', assignmentId)
        .eq('learner_id', learnerId)
        .maybeSingle();

      if (fetchError) {
        logger.error('Failed to fetch existing assignment mark record', fetchError, {
          assignmentId,
          learnerId,
        });
        throw new Error('Failed to update assignment submissions');
      }

      if (!submitted) {
        if (existingRecord?.id) {
          const { error: deleteError } = await supabase
            .from('marks')
            .delete()
            .eq('id', existingRecord.id);

          if (deleteError) {
            logger.error('Failed to delete assignment mark record', deleteError, {
              assignmentId,
              learnerId,
            });
            throw new Error('Failed to update assignment submissions');
          }
        }

        continue;
      }

      const recordData: Record<string, unknown> = {
        assignment_id: assignmentId,
        class_id: classId,
        learner_id: learnerId,
        mark,
        total_mark: mark !== null ? 100 : null,
        percentage: mark !== null ? Math.round((mark / 100) * 10000) / 100 : null,
        recorded_by: teacherId,
        updated_at: new Date().toISOString(),
      };

      if (existingRecord?.id) {
        const { data, error } = await supabase
          .from('marks')
          .update(recordData)
          .eq('id', existingRecord.id)
          .select()
          .single();

        if (error) {
          logger.error('Failed to update assignment mark record', error, {
            assignmentId,
            learnerId,
          });
          throw new Error('Failed to update assignment submissions');
        }

        results.push(data);
      } else {
        const insertData = {
          id: uuidv4(),
          ...recordData,
          created_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from('marks')
          .insert([insertData])
          .select()
          .single();

        if (error) {
          logger.error('Failed to insert assignment mark record', error, {
            assignmentId,
            learnerId,
          });
          throw new Error('Failed to update assignment submissions');
        }

        results.push(data);
      }
    }

    return results;
  } catch (error) {
    logger.error('Error updating assignment submissions', error, {
      assignmentId,
      classId,
      teacherId,
    });
    throw error;
  }
}

export async function toggleAssignmentStar(
  assignmentId: string,
  classId: string,
  learnerId: string,
  teacherId: string,
) {
  try {
    const { data: existingStar, error: fetchError } = await supabase
      .from('stars')
      .select('id')
      .eq('assignment_id', assignmentId)
      .eq('class_id', classId)
      .eq('learner_id', learnerId)
      .maybeSingle();

    if (fetchError) {
      logger.error('Failed to fetch existing assignment star record', fetchError, {
        assignmentId,
        classId,
        learnerId,
      });
      throw new Error('Failed to toggle assignment star');
    }

    if (existingStar?.id) {
      const { error: deleteError } = await supabase
        .from('stars')
        .delete()
        .eq('id', existingStar.id);

      if (deleteError) {
        logger.error('Failed to delete assignment star record', deleteError, {
          assignmentId,
          classId,
          learnerId,
        });
        throw new Error('Failed to toggle assignment star');
      }

      return { awarded: false };
    }

    const starData = {
      id: uuidv4(),
      assignment_id: assignmentId,
      class_id: classId,
      learner_id: learnerId,
      teacher_id: teacherId,
      star_count: 1,
      note: 'Assignment star',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: createdStar, error: insertError } = await supabase
      .from('stars')
      .insert([starData])
      .select()
      .single();

    if (insertError) {
      logger.error('Failed to insert assignment star record', insertError, {
        assignmentId,
        classId,
        learnerId,
      });
      throw new Error('Failed to toggle assignment star');
    }

    return { awarded: true, star: createdStar };
  } catch (error) {
    logger.error('Error toggling assignment star', error, {
      assignmentId,
      classId,
      learnerId,
      teacherId,
    });
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
    logger.debug('Querying learners table by id', { learnerId });

    const { data, error } = await supabase
      .from('learners')
      .select('*')
      .eq('id', learnerId)
      .single();

    if (error) {
      logger.error('Failed to get learner by id', error, { learnerId });
      return null;
    }

    if (!data) {
      logger.warn('Learner record not found', { learnerId });
      return null;
    }

    logger.info('Learner record fetched', {
      learnerId,
      learnerName: [data.first_name, data.last_name].filter(Boolean).join(' ') || data.fullName || null,
    });
    return data;
  } catch (error) {
    logger.error('Error fetching learner by id', error, { learnerId });
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
  learnersData: Array<{ learnerNumber: string; firstName: string; lastName: string; grade?: string }>
) {
  const results = {
    success: [] as any[],
    failed: [] as Array<{ learnerNumber: string; firstName: string; lastName: string; error: string }>,
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
          first_name: learner.firstName,
          last_name: learner.lastName,
          grade: learner.grade || null,
          enrollment_date: new Date().toISOString().split('T')[0],
          user_id: null, // Will be filled during onboarding
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        logger.info(`Learner created: ${learner.learnerNumber} - ${learner.firstName} ${learner.lastName}`, {
          learnerId: learnerRecord.id,
        });
      }

      // Add to class
      const classMember = await addClassMember(classId, learnerRecord.id, 'active');

      results.success.push({
        learnerNumber: learner.learnerNumber,
        firstName: learner.firstName,
        lastName: learner.lastName,
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
        firstName: learner.firstName,
        lastName: learner.lastName,
        error: error?.message || 'Unknown error',
      });
    }
  }

  return results;
}

/**
 * Get classwork items for a class
 */
export async function getClassworkByClass(classId: string) {
  try {
    logger.debug('Querying classwork table for class', { classId });

    const { data, error } = await supabase
      .from('classwork')
      .select('*')
      .eq('class_id', classId)
      .order('lesson_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to get classwork for class', error, { classId });
      return [];
    }

    const items = data || [];
    logger.info('Classwork fetched', { classId, itemCount: items.length });
    return items;
  } catch (error) {
    logger.error('Error fetching classwork for class', error, { classId });
    return [];
  }
}

/**
 * Get classwork item by id
 */
export async function getClassworkById(id: string) {
  try {
    logger.debug('Querying classwork table by id', { id });

    const { data, error } = await supabase
      .from('classwork')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      logger.error('Failed to get classwork by id', error, { id });
      return null;
    }

    if (!data) {
      logger.warn('Classwork record not found', { id });
      return null;
    }

    logger.info('Classwork record fetched', { id, title: data.title });
    return data;
  } catch (error) {
    logger.error('Error fetching classwork by id', error, { id });
    return null;
  }
}

/**
 * Get aggregated classwork detail suitable for frontend consumption
 */
export async function getClassworkDetail(id: string) {
  try {
    const classwork = await getClassworkById(id);
    if (!classwork) return null;

    const classId = classwork.class_id ?? classwork.classId;

    // Get class members
    const members = await getClassMembers(classId);

    const learnerIds = (members || []).map((m: any) => m.learner_id).filter(Boolean);

    // Bulk fetch learners
    let learnersMap: Record<string, any> = {};
    if (learnerIds.length > 0) {
      try {
        const { data: learnersData, error: learnersError } = await supabase
          .from('learners')
          .select('*')
          .in('id', learnerIds);

        if (!learnersError && Array.isArray(learnersData)) {
          learnersMap = (learnersData || []).reduce((acc: any, l: any) => {
            acc[l.id] = l;
            return acc;
          }, {} as Record<string, any>);
        }
      } catch (err) {
        logger.warn('Failed to bulk fetch learners', err);
      }
    }

    // Try to fetch submissions (several possible table names)
    let submissions: any[] = [];
    const submissionTableCandidates = ['classwork_submissions', 'submissions', 'class_submissions'];
    for (const tbl of submissionTableCandidates) {
      try {
        const { data, error } = await supabase
          .from(tbl)
          .select('*')
          .eq('classwork_id', id);
        if (!error && Array.isArray(data) && data.length > 0) {
          submissions = data;
          break;
        }
      } catch (err) {
        // ignore and try next
      }
    }

    // Fallback: try marks table to infer submissions by classwork reference
    let marksForClasswork: any[] = [];
    try {
      const { data: marksData, error: marksError } = await supabase
        .from('marks')
        .select('*')
        .eq('classwork_id', id);
      if (!marksError && Array.isArray(marksData) && marksData.length > 0) {
        marksForClasswork = marksData;
      }
    } catch (err) {
      // ignore
    }

    // Try to fetch stars/awards for this classwork
    let stars: any[] = [];
    const starTableCandidates = ['classwork_stars', 'stars', 'awards'];
    for (const tbl of starTableCandidates) {
      try {
        const { data, error } = await supabase
          .from(tbl)
          .select('*')
          .eq('classwork_id', id);
        if (!error && Array.isArray(data) && data.length > 0) {
          stars = data;
          break;
        }
      } catch (err) {
        // ignore
      }
    }

    // Build lookup maps
    const submissionsByLearner: Record<string, any> = {};
    for (const s of submissions) {
      if (s.learner_id) submissionsByLearner[s.learner_id] = s;
    }
    for (const m of marksForClasswork) {
      if (m.learner_id && !submissionsByLearner[m.learner_id]) submissionsByLearner[m.learner_id] = m;
    }

    const starsByLearner: Record<string, any> = {};
    for (const s of stars) {
      if (!s.learner_id) continue;
      if (!starsByLearner[s.learner_id]) starsByLearner[s.learner_id] = [];
      starsByLearner[s.learner_id].push(s);
    }

    const totalLearners = learnerIds.length;
    let submittedCount = 0;
    let passCount = 0;

    const passMark = (classwork.pass_mark ?? classwork.passMark ?? 50);

    const learnerRows = (members || []).map((member: any) => {
      const learner = learnersMap[member.learner_id] || null;
      const submission = submissionsByLearner[member.learner_id] || null;

      const mark = submission && (submission.mark ?? submission.score ?? submission.points ?? null);
      const submitted = Boolean(submission);
      const passed = typeof mark === 'number' ? mark >= passMark : false;

      if (submitted) submittedCount += 1;
      if (passed) passCount += 1;

      const starList = starsByLearner[member.learner_id] || [];

      return {
        learnerId: member.learner_id,
        classMemberId: member.id,
        firstName: learner?.first_name ?? learner?.firstName ?? null,
        lastName: learner?.last_name ?? learner?.lastName ?? null,
        fullName: [learner?.first_name, learner?.last_name].filter(Boolean).join(' ') || learner?.full_name || null,
        studentNumber: learner?.student_number ?? learner?.phone ?? learner?.phone_number ?? null,
        submitted,
        submissionId: submission?.id ?? null,
        mark: typeof mark === 'number' ? mark : null,
        passed,
        totalStars: Array.isArray(starList) ? starList.length : 0,
        classworkStarAwarded: (starList || []).some((s: any) => s.classwork_id === id),
      };
    });

    const submissionRate = totalLearners > 0 ? Math.round((submittedCount / totalLearners) * 100) : 0;
    const passRate = totalLearners > 0 ? Math.round((passCount / totalLearners) * 100) : 0;

    // Top learners by mark (use marksForClasswork + submissions if available)
    const scoredRows = learnerRows.filter((r: any) => typeof r.mark === 'number');
    const topLearners = scoredRows.sort((a: any, b: any) => (b.mark - a.mark)).slice(0, 5).map((r: any) => ({
      learnerId: r.learnerId,
      fullName: r.fullName,
      mark: r.mark,
    }));

    // Map classwork record to camelCase DTO
    const dto: Record<string, any> = {
      id: classwork.id,
      title: classwork.title,
      description: classwork.description ?? classwork.body ?? null,
      classId,
      teacherId: classwork.teacher_id ?? classwork.teacherId ?? null,
      lessonDate: classwork.lesson_date ?? classwork.lessonDate ?? null,
      dueDate: classwork.due_date ?? classwork.dueDate ?? null,
      createdAt: classwork.created_at ?? classwork.createdAt ?? null,
      updatedAt: classwork.updated_at ?? classwork.updatedAt ?? null,
      totalLearners,
      submittedCount,
      submissionRate,
      passCount,
      passRate,
      learnerRows,
      topLearners,
      raw: classwork,
    };

    return dto;
  } catch (error) {
    logger.error('Error building classwork detail', error, { id });
    return null;
  }
}