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
