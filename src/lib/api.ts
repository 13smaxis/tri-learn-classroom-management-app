
// ── API BASE + REQUEST ──
const API_BASE = '/api';
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('authToken');
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  // Only add Content-Type if there's a body
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    cache: 'no-store',
  });
  const text = await res.text();

  // Handle 401 – token expired / missing → soft-expire so user can re-auth without losing work
  if (res.status === 401) {
    localStorage.removeItem('authToken');
    window.dispatchEvent(new Event('session-expired'));
    let msg = 'Session expired – please log in again';
    try { const j = JSON.parse(text); msg = j.error?.message || msg; } catch { /* use default */ }
    throw new Error(msg);
  }

  if (!text) {
    if (!res.ok) {
      throw new Error(`Request failed with status ${res.status}`);
    }
    return undefined as T;
  }
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON response (status ${res.status}): ${text.substring(0, 200)}`);
  }
  if (!res.ok) {
    throw new Error(json.error?.message || json.message || `Request failed (${res.status})`);
  }
  if (json && typeof json === 'object' && 'success' in json && json.success === false) {
    throw new Error(json.error?.message || json.message || `Request failed (${res.status})`);
  }
  if (json && typeof json === 'object' && 'data' in json) {
    return json.data as T;
  }
  return json as T;
}

// ── INTERFACES ──
export interface UserResponse {
  userId: string;
  email: string;
  fullName: string;
  title?: string;
  role: string;
  avatarUrl?: string;
  teacherInviteCode?: string;
  teacherGrade?: string;
  token?: string;
  createdAt?: string;
}
export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  role: string;
  title?: string;
  phone?: string;
  teacherGrade?: string;
  schoolInviteCode?: string;
}
export interface LoginPayload {
  phone: string;
  password: string;
}

export const api = {
  // Homework
  createHomework: (data: { classId: string; title: string; description: string; dueDate: string; attachmentUrls: string[] }) =>
    request<any>('/homework/create', { method: 'POST', body: JSON.stringify(data) }),
  getHomeworkList: (classId: string) =>
    request<any[]>(`/homework/list/${classId}`),
  getHomeworkCount: () =>
    request<number>('/homework/count'),
  getHomeworkCountForClass: (classId: string) =>
    request<number>(`/homework/count/${classId}`),
  deleteHomework: (homeworkId: string) =>
    request<string>(`/homework/${homeworkId}`, { method: 'DELETE' }),

  // Homework Detail Dashboard
  getHomeworkDetail: (homeworkId: string) =>
    request<any>(`/homework/detail/${homeworkId}`),

  submitHomeworkEntries: (homeworkId: string, entries: { learnerId: string; submitted: boolean; mark: number | null }[]) =>
    request<any>(`/homework/${homeworkId}/bulk-submissions`, {
      method: 'POST',
      body: JSON.stringify({ entries }),
    }),

  captureHomeworkMark: (homeworkId: string, learnerId: string, mark: number | null) =>
    request<any>(`/homework/${homeworkId}/mark`, { method: 'POST', body: JSON.stringify({ learnerId, mark }) }),

  toggleHomeworkSubmission: (homeworkId: string, learnerId: string, submitted: boolean) =>
    request<any>(`/homework/${homeworkId}/toggle-submission`, { method: 'POST', body: JSON.stringify({ learnerId, submitted }) }),

  awardHomeworkStar: (homeworkId: string, learnerId: string, classId: string, starCount?: number, note?: string) =>
    request<any>(`/homework/${homeworkId}/award-star`, { method: 'POST', body: JSON.stringify({ learnerId, classId, starCount: starCount || 1, note: note || 'Homework star' }) }),

  toggleHomeworkStar: (homeworkId: string, learnerId: string, classId: string) =>
    request<{ awarded: boolean }>(`/homework/${homeworkId}/toggle-star`, {
      method: 'POST',
      body: JSON.stringify({ learnerId, classId }),
    }),

  // Classwork
  createClasswork: (data: { classId: string; title: string; description: string; dueDate: string; attachmentUrls: string[] }) =>
    request<any>('/classwork/create', { method: 'POST', body: JSON.stringify(data) }),
  getClassworkList: (classId: string) =>
    request<any[]>(`/classwork/list/${classId}`),
  getClassworkCount: () =>
    request<number>('/classwork/count'),
  getClassworkCountForClass: (classId: string) =>
    request<number>(`/classwork/count/${classId}`),
  deleteClasswork: (classworkId: string) =>
    request<string>(`/classwork/${classworkId}`, { method: 'DELETE' }),
  getClassworkDetail: (classworkId: string) =>
    request<any>(`/classwork/detail/${classworkId}`),
  submitClassworkEntries: (classworkId: string, entries: { learnerId: string; submitted: boolean; mark: number | null }[]) =>
    request<any>(`/classwork/${classworkId}/bulk-submissions`, {
      method: 'POST',
      body: JSON.stringify({ entries }),
    }),
  captureClassworkMark: (classworkId: string, learnerId: string, mark: number | null) =>
    request<any>(`/classwork/${classworkId}/mark`, { method: 'POST', body: JSON.stringify({ learnerId, mark }) }),
  toggleClassworkSubmission: (classworkId: string, learnerId: string, submitted: boolean) =>
    request<any>(`/classwork/${classworkId}/toggle-submission`, { method: 'POST', body: JSON.stringify({ learnerId, submitted }) }),
  awardClassworkStar: (classworkId: string, learnerId: string, classId: string, starCount?: number, note?: string) =>
    request<any>(`/classwork/${classworkId}/award-star`, { method: 'POST', body: JSON.stringify({ learnerId, classId, starCount: starCount || 1, note: note || 'Classwork star' }) }),
  toggleClassworkStar: (classworkId: string, learnerId: string, classId: string) =>
    request<{ awarded: boolean }>(`/classwork/${classworkId}/toggle-star`, {
      method: 'POST',
      body: JSON.stringify({ learnerId, classId }),
    }),

  // Test
  createTest: (data: { classId: string; title: string; description: string; dueDate: string; attachmentUrls: string[] }) =>
    request<any>('/test/create', { method: 'POST', body: JSON.stringify(data) }),
  getTestList: (classId: string) =>
    request<any[]>(`/test/list/${classId}`),
  getTestCount: () =>
    request<number>('/test/count'),
  getTestCountForClass: (classId: string) =>
    request<number>(`/test/count/${classId}`),
  deleteTest: (testId: string) =>
    request<string>(`/test/${testId}`, { method: 'DELETE' }),
  getTestDetail: (testId: string) =>
    request<any>(`/test/detail/${testId}`),
  submitTestEntries: (testId: string, entries: { learnerId: string; submitted: boolean; mark: number | null }[]) =>
    request<any>(`/test/${testId}/bulk-submissions`, {
      method: 'POST',
      body: JSON.stringify({ entries }),
    }),
  captureTestMark: (testId: string, learnerId: string, mark: number | null) =>
    request<any>(`/test/${testId}/mark`, { method: 'POST', body: JSON.stringify({ learnerId, mark }) }),
  toggleTestSubmission: (testId: string, learnerId: string, submitted: boolean) =>
    request<any>(`/test/${testId}/toggle-submission`, { method: 'POST', body: JSON.stringify({ learnerId, submitted }) }),
  awardTestStar: (testId: string, learnerId: string, classId: string, starCount?: number, note?: string) =>
    request<any>(`/test/${testId}/award-star`, { method: 'POST', body: JSON.stringify({ learnerId, classId, starCount: starCount || 1, note: note || 'Test star' }) }),
  toggleTestStar: (testId: string, learnerId: string, classId: string) =>
    request<{ awarded: boolean }>(`/test/${testId}/toggle-star`, {
      method: 'POST',
      body: JSON.stringify({ learnerId, classId }),
    }),

  // Assignment
  createAssignment: (data: { classId: string; title: string; description: string; dueDate: string; attachmentUrls: string[] }) =>
    request<any>('/assignment/create', { method: 'POST', body: JSON.stringify(data) }),
  getAssignmentList: (classId: string) =>
    request<any[]>(`/assignment/list/${classId}`),
  getAssignmentCount: () =>
    request<number>('/assignment/count'),
  getAssignmentCountForClass: (classId: string) =>
    request<number>(`/assignment/count/${classId}`),
  deleteAssignment: (assignmentId: string) =>
    request<string>(`/assignment/${assignmentId}`, { method: 'DELETE' }),
  getAssignmentDetail: (assignmentId: string) =>
    request<any>(`/assignment/detail/${assignmentId}`),
  submitAssignmentEntries: (assignmentId: string, entries: { learnerId: string; submitted: boolean; mark: number | null }[]) =>
    request<any>(`/assignment/${assignmentId}/bulk-submissions`, {
      method: 'POST',
      body: JSON.stringify({ entries }),
    }),
  toggleAssignmentStar: (assignmentId: string, learnerId: string, classId: string) =>
    request<{ awarded: boolean }>(`/assignment/${assignmentId}/toggle-star`, {
      method: 'POST',
      body: JSON.stringify({ learnerId, classId }),
    }),

  // Auth
  register: (data: RegisterPayload) =>
    request<UserResponse>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: LoginPayload) =>
    request<UserResponse>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  me: () =>
    request<UserResponse>('/auth/me'),

  logout: () =>
    request<void>('/auth/logout', { method: 'POST' }),

  // Classes
  createClass: (data: { name: string; grade: string; subject: string; academicYear?: string; description?: string; roomNumber?: string; maxStudents?: number }) =>
    request<any>('/teacher/classes', {
      method: 'POST',
      body: JSON.stringify({
        name: data.name,
        grade: data.grade,
        subject: data.subject,
        academic_year: data.academicYear ?? null,
        description: data.description ?? null,
        room_number: data.roomNumber ?? null,
        max_students: data.maxStudents ?? null,
      }),
    }),

  getMyClasses: () =>
    request<any[]>('/teacher/classes'),

  getClass: (classId: string) =>
    request<any>(`/class/${classId}`),

  getClassStudents: (classId: string) =>
    request<any[]>(`/class/${classId}/students`),

  getClassPerformanceSummary: (classId: string) =>
    request<any>(`/class/${classId}/performance-summary`),

  validateInviteCode: (code: string) =>
    request<{ classId: string; name: string; grade: string; subject: string; teacherName: string }>(`/class/validate-invite?code=${encodeURIComponent(code)}`),

  joinClass: (inviteToken: string, linkedLearnerId?: string) =>
    request<any>('/class/join', {
      method: 'POST',
      body: JSON.stringify({ inviteToken, linkedLearnerId }),
    }),

  // Users (debug)
  getAllUsers: () =>
    request<any[]>('/users'),

  // Attendance
  uploadLearners: (data: { classId: string; learners: { learnerNumber: string; fullName: string }[] }) =>
    request<any[]>('/attendance/upload-learners', { method: 'POST', body: JSON.stringify(data) }),

  getLearners: (classId: string) =>
    request<any[]>(`/attendance/learners/${classId}`),

  saveAttendance: (data: { classId: string; date: string; attendance: Record<string, string> }) =>
    request<string>('/attendance/save', { method: 'POST', body: JSON.stringify(data) }),

  getAttendanceForDate: (classId: string, date: string) =>
    request<Record<string, string>>(`/attendance/records/${classId}/${date}`),

  getAttendanceForDateRange: (classId: string, startDate: string, endDate: string) =>
    request<any[]>(`/attendance/records/${classId}?startDate=${startDate}&endDate=${endDate}`),

  getAttendanceForLearner: (learnerId: string) =>
    request<any[]>(`/attendance/learner/${learnerId}`),

  // Learners (new controller)
  getAllLearners: () =>
    request<any[]>('/learners'),

  getLearnerById: (id: string) =>
    request<any>(`/learners/${id}`),

  // Stars (new controller)
  awardStar: (data: { learnerId: string; classId: string; category: string; starCount?: number; note?: string }) =>
    request<void>('/stars/award', { method: 'POST', body: JSON.stringify(data) }),

  getClassRecognition: (classId: string) =>
    request<any[]>(`/stars/class/${classId}`),

  getStudentRecognition: (learnerId: string) =>
    request<any>(`/stars/student/${learnerId}`),
};
