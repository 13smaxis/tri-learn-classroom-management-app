import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'teacher' | 'parent' | 'learner';
  schoolId?: string;
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
  signup: (email: string, password: string, firstName: string, lastName: string, role: string, inviteCode: string) => Promise<void>;
  signin: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string, role: string, inviteCode: string) => Promise<{ success: boolean; user?: User; error?: string }>;
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
  signup: async () => {},
  signin: async () => {},
  register: async () => ({ success: false }),
  login: async () => ({ success: false }),
  logout: () => {},
  clearError: () => {},
  clearJustSignedUp: () => {},
  softLogout: () => {},
  reAuthenticate: async () => ({ success: false }),
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

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
        setUser(auth.user);
      }
    }
  }, []);

  const signup = useCallback(
    async (
      email: string,
      password: string,
      firstName: string,
      lastName: string,
      role: string,
      inviteCode: string
    ) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await authService.signup({
          email,
          password,
          firstName,
          lastName,
          role: role as 'teacher' | 'parent' | 'learner',
          inviteCode,
        });

        setToken(response.token);
        setUser(response.user);
        setJustSignedUp(true);
        authService.saveUser(response.user);
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

  const register = useCallback(async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: string,
    inviteCode: string
  ) => {
    try {
      const response = await signup(email, password, firstName, lastName, role, inviteCode);
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
        email,
        password,
      });

      setToken(response.token);
      setUser(response.user);
      setJustSignedUp(false);
      authService.saveUser(response.user);
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
