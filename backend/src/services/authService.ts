import axios, { AxiosHeaders, AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

interface ImportMetaWithEnv extends ImportMeta {
  env?: Record<string, string | undefined>;
}

// API base URL - matches backend
const API_BASE_URL = (import.meta as ImportMetaWithEnv).env?.VITE_API_BASE_URL || 'http://localhost:3000/api';

interface SignupRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'teacher' | 'parent' | 'learner';
  inviteCode: string;
}

interface SigninRequest {
  email: string;
  password: string;
}

interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'teacher' | 'parent' | 'learner';
    schoolId?: string;
  };
}

interface SchoolData {
  id: string;
  name: string;
  invite_code: string;
  district_number?: number;
}

class AuthService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests if it exists
    this.api.interceptors.request.use((config: InternalAxiosRequestConfig<any>) => {
      const token = this.getStorageItem('authToken');
      if (token) {
        const headers = new AxiosHeaders(config.headers);
        headers.set('Authorization', `Bearer ${token}`);
        config.headers = headers;
      }
      return config;
    });
  }

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

  /**
   * Sign up new user (teacher, parent, or learner)
   */
  async signup(data: SignupRequest): Promise<AuthResponse> {
    try {
      const response = await this.api.post<AuthResponse>('/auth/signup', {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        inviteCode: data.inviteCode,
      });

      // Store token
      if (response.data.token) {
        this.setStorageItem('authToken', response.data.token);
      }

      return response.data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Signup failed';
      throw new Error(message);
    }
  }

  /**
   * Sign in with email and password
   */
  async signin(data: SigninRequest): Promise<AuthResponse> {
    try {
      const response = await this.api.post<AuthResponse>('/auth/login', {
        email: data.email,
        password: data.password,
      });

      // Store token
      if (response.data.token) {
        this.setStorageItem('authToken', response.data.token);
      }

      return response.data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Login failed';
      throw new Error(message);
    }
  }

  /**
   * Validate invite code and get school info
   * This calls backend to check if code is valid
   */
  async validateInviteCode(inviteCode: string): Promise<SchoolData> {
    try {
      const response = await this.api.get<SchoolData>(`/auth/validate-invite/${inviteCode}`);
      return response.data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Invalid invite code';
      throw new Error(message);
    }
  }

  /**
   * Get current user from token
   */
  getCurrentUser(): { token: string; user?: AuthResponse['user'] } | null {
    const token = this.getStorageItem('authToken');
    const userStr = this.getStorageItem('authUser');

    if (!token) return null;

    try {
      const user = userStr ? JSON.parse(userStr) : null;
      return { token, user };
    } catch {
      return { token };
    }
  }

  /**
   * Save user to localStorage
   */
  saveUser(user: AuthResponse['user']): void {
    this.setStorageItem('authUser', JSON.stringify(user));
  }

  /**
   * Logout - clear auth data
   */
  logout(): void {
    this.removeStorageItem('authToken');
    this.removeStorageItem('authUser');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getStorageItem('authToken');
  }

  /**
   * Get auth token
   */
  getToken(): string | null {
    return this.getStorageItem('authToken');
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.api.get('/auth/health');
      return true;
    } catch {
      return false;
    }
  }
}

export const authService = new AuthService();
export type { SignupRequest, SigninRequest, AuthResponse, SchoolData };
