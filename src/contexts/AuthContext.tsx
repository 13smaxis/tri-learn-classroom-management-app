import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'teacher' | 'parent' | 'learner';
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => void;
  validateInvite: (code: string) => Promise<{ success: boolean; classInfo?: any; inviteType?: string; error?: string }>;
  joinClass: (classId: string, role: string, linkedLearnerId?: string) => Promise<{ success: boolean; error?: string }>;
}

interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  role: 'teacher' | 'parent' | 'learner';
  phone?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('eduUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Demo credentials
      const demoUsers = {
        'teacher@school.com': {
          id: 'teacher-1',
          email: 'teacher@school.com',
          fullName: 'John Smith',
          role: 'teacher' as const,
          password: 'teacher123'
        },
        'learner@school.com': {
          id: 'learner-1',
          email: 'learner@school.com',
          fullName: 'Sarah Johnson',
          role: 'learner' as const,
          password: 'learner123'
        },
        'parent@school.com': {
          id: 'parent-1',
          email: 'parent@school.com',
          fullName: 'Michael Brown',
          role: 'parent' as const,
          password: 'parent123'
        }
      };

      // Check demo credentials first
      const demoUser = demoUsers[email as keyof typeof demoUsers];
      if (demoUser && demoUser.password === password) {
        const { password: _, ...userData } = demoUser;
        setUser(userData);
        localStorage.setItem('eduUser', JSON.stringify(userData));
        return { success: true };
      }

      // Fallback to Supabase if not a demo user
      const { data, error } = await supabase.functions.invoke('edu-auth', {
        body: { action: 'login', email, password }
      });

      if (error || data?.error) {
        return { success: false, error: data?.error || error?.message || 'Invalid credentials' };
      }

      const userData = data.user;
      setUser(userData);
      localStorage.setItem('eduUser', JSON.stringify(userData));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Login failed' };
    }
  };

  const register = async (registerData: RegisterData) => {
    try {
      const { data, error } = await supabase.functions.invoke('edu-auth', {
        body: { action: 'register', ...registerData }
      });

      if (error || data.error) {
        return { success: false, error: data?.error || error?.message || 'Registration failed' };
      }

      const userData = data.user;
      setUser(userData);
      localStorage.setItem('eduUser', JSON.stringify(userData));
      return { success: true, user: userData };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('eduUser');
  };

  const validateInvite = async (code: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('edu-auth', {
        body: { action: 'validateInvite', inviteCode: code }
      });

      if (error || data.error) {
        return { success: false, error: data?.error || error?.message };
      }

      return { success: true, classInfo: data.classInfo, inviteType: data.inviteType };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const joinClass = async (classId: string, role: string, linkedLearnerId?: string) => {
    if (!user) return { success: false, error: 'Not logged in' };

    try {
      const { data, error } = await supabase.functions.invoke('edu-auth', {
        body: { action: 'joinClass', userId: user.id, classId, role, linkedLearnerId }
      });

      if (error || data.error) {
        return { success: false, error: data?.error || error?.message };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, validateInvite, joinClass }}>
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
