const API_BASE = '/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('authToken');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    cache: 'no-store',
  });

  const text = await res.text();

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

  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || json.message || 'Request failed');
  }

  return json.data as T;
}

// ── Auth ──

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

export const    api = {
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
  createClass: (data: { name: string; grade: string; subject: string; academicYear?: string }) =>
    request<any>('/class/create', { method: 'POST', body: JSON.stringify(data) }),

  getMyClasses: () =>
    request<any[]>('/class/my-classes'),

  getClass: (classId: string) =>
    request<any>(`/class/${classId}`),

  getClassStudents: (classId: string) =>
    request<any[]>(`/class/${classId}/students`),

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
