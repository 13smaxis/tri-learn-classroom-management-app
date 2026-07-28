export interface JWTPayload {
  userId: string;
  schoolId: string;
  role: 'teacher' | 'parent' | 'learner';
  email?: string;
  iat?: number;
  exp?: number;
}

export interface TenantContext {
  userId: string;
  schoolId: string;
  role: 'teacher' | 'parent' | 'learner';
}

export interface SignupRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'teacher' | 'parent' | 'learner';
  inviteCode: string;
  title?: string;
  phone?: string;
  teacherGrade?: string;
}

export interface AuthRequest {
  email: string;
  password: string;
}

export interface UserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'teacher' | 'parent' | 'learner';
  schoolId?: string;
}

export interface AuthResponse {
  token: string;
  user: UserInfo;
}
