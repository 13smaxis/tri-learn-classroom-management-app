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

export interface SigninRequest {
  credential: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'teacher' | 'parent' | 'learner';
  schoolId?: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface SchoolData {
  id: string;
  name: string;
  invite_code: string;
  district_number?: number;
  location?: string;
}

class AuthService {
  private getStorage(): Storage | null {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    return window.localStorage;
  }

  private getStorageItem(key: string): string | null {
    return this.getStorage()?.getItem(key) ?? null;
  }

  private setStorageItem(key: string, value: string): void {
    this.getStorage()?.setItem(key, value);
  }

  private removeStorageItem(key: string): void {
    this.getStorage()?.removeItem(key);
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`/api${path}`, {
      headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
      ...init,
    });

    const text = await response.text();
    let payload: any = {};
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { message: text };
      }
    }

    if (!response.ok) {
      throw new Error(payload?.message || payload?.error?.message || 'Request failed');
    }

    return payload?.data ?? payload ?? ({} as T);
  }

  async signup(data: SignupRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        inviteCode: data.inviteCode,
        title: data.title,
        phone: data.phone,
        teacherGrade: data.teacherGrade,
      }),
    });

    if (response.token) {
      this.setStorageItem('authToken', response.token);
    }
    this.saveUser(response.user);
    return response;
  }

  async signin(data: SigninRequest): Promise<AuthResponse> {
  const response = await this.request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      credential: data.credential,  // ✅ Now sends correct field
      password: data.password,
    }),
  });

    if (response.token) {
      this.setStorageItem('authToken', response.token);
    }
    this.saveUser(response.user);
    return response;
  }

  async validateInviteCode(inviteCode: string): Promise<SchoolData> {
    return this.request<SchoolData>(`/auth/validate-invite/${encodeURIComponent(inviteCode)}`);
  }

  getCurrentUser(): { token: string; user?: AuthUser } | null {
    const token = this.getStorageItem('authToken');
    const userStr = this.getStorageItem('authUser');

    if (!token) {
      return null;
    }

    try {
      const user = userStr ? JSON.parse(userStr) : null;
      return { token, user };
    } catch {
      return { token };
    }
  }

  saveUser(user: AuthUser): void {
    this.setStorageItem('authUser', JSON.stringify(user));
  }

  logout(): void {
    this.removeStorageItem('authToken');
    this.removeStorageItem('authUser');
  }

  isAuthenticated(): boolean {
    return !!this.getStorageItem('authToken');
  }

  getToken(): string | null {
    return this.getStorageItem('authToken');
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.request('/auth/health');
      return true;
    } catch {
      return false;
    }
  }
}

export const authService = new AuthService();
