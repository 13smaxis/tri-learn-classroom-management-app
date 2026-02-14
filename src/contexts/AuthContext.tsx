import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, UserResponse } from '@/lib/api';
import { AlignVerticalJustifyEnd } from 'lucide-react';

export interface User {
  id: string;
  title?: string;
  email?: string;
  fullName: string;
  role: 'teacher' | 'parent' | 'learner';
  avatarUrl?: string;
  teacherInviteCode?: string;
  teacherGrade?: string;
}

/**
 * AuthContext provides authentication state and functions to the app.
 * It manages the current user, loading state, and provides methods for login, registration, logout, and invite validation.
 */
interface AuthContextType 
{
  user: User | null;
  loading: boolean;
  justSignedUp: boolean;
  login: (phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => void;
  validateInvite: (code: string) => Promise<{ success: boolean; classInfo?: any; error?: string }>;
  joinClass: (classId: string, role: string, linkedLearnerId?: string) => Promise<{ success: boolean; error?: string }>;
  clearJustSignedUp: () => void;
}

interface RegisterData {
  teacherGrade?: string;
  title?: string;
  email?: string;
  password: string;
  fullName: string;
  role: 'teacher' | 'parent' | 'learner';
  phone?: string;
  schoolInviteCode?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function apiUserToUser(u: UserResponse): User {
  return {
    id: u.userId,
    title: u.title,
    email: u.email,
    fullName: u.fullName,
    role: u.role as 'teacher' | 'parent' | 'learner',
    avatarUrl: u.avatarUrl,
    teacherInviteCode: u.teacherInviteCode,
    teacherGrade: u.teacherGrade,
  };
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [justSignedUp, setJustSignedUp] = useState(false);

  // On mount, check for stored token and fetch current user
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      api.me()
        .then((data) => {
          setUser(apiUserToUser(data));
        })
        .catch(() => {
          localStorage.removeItem('authToken');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (phone: string, password: string) => {
    try {
      const data = await api.login({ phone, password });
      if (data.token) {
        localStorage.setItem('authToken', data.token);
      }
      setUser(apiUserToUser(data));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Login failed' };
    }
  };

  const register = async (registerData: RegisterData) => {
    try {
      const data = await api.register({
        fullName: registerData.fullName,
        email: registerData.email || '',
        password: registerData.password,
        role: registerData.role,
        title: registerData.title,
        phone: registerData.phone,
        teacherGrade: registerData.teacherGrade,
        schoolInviteCode: registerData.schoolInviteCode,
      });

      if (data.token) {
        localStorage.setItem('authToken', data.token);
      }

      const userData = apiUserToUser(data);
      setUser(userData);

      if (registerData.role === 'teacher') {
        setJustSignedUp(true);
      }

      return { success: true, user: userData };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Registration failed' };
    }
  };

  const logout = () => {
    api.logout().catch(() => {}); // best-effort server logout
    localStorage.removeItem('authToken');
    setUser(null);
    setJustSignedUp(false);
  };

  const validateInvite = async (code: string) => {
    // TODO: implement backend endpoint for invite validation
    // For now, return a not-implemented error
    try {
      // Once /auth/validate-invite is built, call it here
      return { success: false, error: 'Invite validation not yet connected to backend' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const joinClass = async (classId: string, _role: string, linkedLearnerId?: string) => {
    if (!user) return { success: false, error: 'Not logged in' };

    try {
      await api.joinClass(classId, linkedLearnerId);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to join class' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        justSignedUp,
        login,
        register,
        logout,
        validateInvite,
        joinClass,
        clearJustSignedUp: () => setJustSignedUp(false)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
