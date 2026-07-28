import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService, type SignupRequest, type AuthResponse } from '../services/authService';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'teacher' | 'parent' | 'learner';
  schoolId?: string;
  title?: string;
  fullName?: string;
}

interface AuthContextType {
  // State
  user: User | null;
  token: string | null;
  isLoading: boolean;
  loading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  justSignedUp: boolean;
  sessionExpired: boolean;

  // Actions
  signup: (payload: SignupRequest) => Promise<AuthResponse>;
  signin: (email: string, password: string) => Promise<AuthResponse>;
  register: (payload: SignupRequest) => Promise<{ success: boolean; user?: User; error?: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => void;
  clearError: () => void;
  clearJustSignedUp: () => void;
  softLogout: () => void;
  reAuthenticate: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
}

const defaultAuthContext: AuthContextType = {
  user: null,
  token: null,
  isLoading: false,
  loading: false,
  isAuthenticated: false,
  error: null,
  justSignedUp: false,
  sessionExpired: false,
  signup: async () => ({
    token: '',
    user: {
      id: '',
      email: '',
      firstName: '',
      lastName: '',
      role: 'learner',
    },
  }),
  signin: async () => ({
    token: '',
    user: {
      id: '',
      email: '',
      firstName: '',
      lastName: '',
      role: 'learner',
    },
  }),
  register: async () => ({ success: false }),
  login: async () => ({ success: false }),
  logout: () => {},
  clearError: () => {},
  clearJustSignedUp: () => {},
  softLogout: () => {},
  reAuthenticate: async () => ({ success: false }),
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

const normalizeUser = (user?: Partial<User> | null): User | null => {
  if (!user) return null;

  const firstName = user.firstName?.trim() ?? '';
  const lastName = user.lastName?.trim() ?? '';
  const fullName =
    user.fullName?.trim() ||
    [firstName, lastName].filter(Boolean).join(' ').trim() ||
    user.email?.trim() ||
    '';

  return {
    id: user.id ?? '',
    email: user.email ?? '',
    firstName,
    lastName,
    role: user.role ?? 'learner',
    schoolId: user.schoolId,
    title: user.title,
    fullName: fullName || undefined,
  };
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSignedUp, setJustSignedUp] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Load auth from localStorage on mount
  useEffect(() => {
    const auth = authService.getCurrentUser();
    if (auth?.token) {
      setToken(auth.token);
      if (auth.user) {
        setUser(normalizeUser(auth.user));
      }
    }
  }, []);

  const signup = useCallback(
    async (payload: SignupRequest) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await authService.signup(payload);

        const normalizedUser = normalizeUser(response.user);
        setToken(response.token);
        setUser(normalizedUser);
        setJustSignedUp(true);
        if (normalizedUser) {
          authService.saveUser(normalizedUser);
        }
        return response;
      } catch (err: any) {
        const message = err.message || 'Signup failed';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const register = useCallback(async (payload: SignupRequest) => {
    try {
      const response = await signup(payload);
      return { success: true, user: response.user };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Signup failed' };
    }
  }, [signup]);

  const signin = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authService.signin({
        credential: email,
        password,
      });

      const normalizedUser = normalizeUser(response.user);
      setToken(response.token);
      setUser(normalizedUser);
      setJustSignedUp(false);
      if (normalizedUser) {
        authService.saveUser(normalizedUser);
      }
      return response;
    } catch (err: any) {
      const message = err.message || 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await signin(email, password);
      return { success: true, user: response.user };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Login failed' };
    }
  }, [signin]);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setError(null);
    setJustSignedUp(false);
    authService.logout();
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearJustSignedUp = useCallback(() => {
    setJustSignedUp(false);
  }, []);

  const softLogout = useCallback(() => {
    setSessionExpired(true);
    logout();
  }, [logout]);

  const reAuthenticate = useCallback(async (email: string, password: string) => {
    try {
      await signin(email, password);
      setSessionExpired(false);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Login failed' };
    }
  }, [signin]);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    loading: isLoading,
    isAuthenticated: !!token && !!user,
    error,
    justSignedUp,
    sessionExpired,
    signup,
    signin,
    register,
    login,
    logout,
    clearError,
    clearJustSignedUp,
    softLogout,
    reAuthenticate,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
