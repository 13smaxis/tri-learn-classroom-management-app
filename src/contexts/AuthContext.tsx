import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { addDemoUser, DemoUser, findUserByEmail, getTeacherClasses, joinDemoClass, loadDemoUsers, updateDemoUser } from '@/lib/demoStore';

export interface User {
  id: string;
  title?: string;
  email?: string;
  fullName: string;
  role: 'teacher' | 'parent' | 'learner';
  avatarUrl?: string;
   // For teachers, this is the single invite code that
   // parents and learners use across all of their classes
   teacherInviteCode?: string;
  // For teachers, their selected grade (e.g. "10")
  teacherGrade?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  justSignedUp: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
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

// Built-in demo users available for quick logins and invite validation
const builtInDemoUsers: DemoUser[] = [
  {
    id: 'teacher-1',
    email: 'teacher@school.com',
    fullName: 'John Smith',
    role: 'teacher',
    password: 'teacher123',
    teacherInviteCode: 'GRD101234'
  },
  {
    id: 'learner-1',
    email: 'learner@school.com',
    fullName: 'Sarah Johnson',
    role: 'learner',
    password: 'learner123'
  },
  {
    id: 'parent-1',
    email: 'parent@school.com',
    fullName: 'Michael Brown',
    role: 'parent',
    password: 'parent123'
  }
];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [justSignedUp, setJustSignedUp] = useState(false);

  // Single INVITE CODE generator used for teachers
  const generateInviteCode = (grade: string = '10') => {
    // Example format: GRD{grade} + 4-digit number, e.g. GRD101234
    const safeGrade = grade || '10';
    const suffix = Math.floor(1000 + Math.random() * 9000);
    return `GRD${safeGrade}${suffix}`;
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('eduUser');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser) as User;
        // Backfill INVITE CODE for any already-stored teacher user
        if (parsed.role === 'teacher' && !parsed.teacherInviteCode) {
          const code = generateInviteCode(parsed.teacherGrade || '10');
          const updated: User = { ...parsed, teacherInviteCode: code };
          setUser(updated);
          localStorage.setItem('eduUser', JSON.stringify(updated));
          // Best-effort: update corresponding demo user if it exists
          updateDemoUser(parsed.id, { teacherInviteCode: code });
        } else {
          setUser(parsed);
        }
      } catch {
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const allUsers: DemoUser[] = [...builtInDemoUsers, ...loadDemoUsers()];
      const found = allUsers.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());

      if (!found || found.password !== password) {
        return { success: false, error: 'Invalid credentials' };
      }

      // Backfill a teacher invite code for any older teacher accounts
      if (found.role === 'teacher' && !found.teacherInviteCode) {
        const code = generateInviteCode(found.teacherGrade || '10');
        found.teacherInviteCode = code;
        // Only persisted users live in the demo store
        updateDemoUser(found.id, { teacherInviteCode: code });
      }

      const { password: _pw, ...userData } = found;
      setUser(userData);
      localStorage.setItem('eduUser', JSON.stringify(userData));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Login failed' };
    }
  };

  const register = async (registerData: RegisterData) => {
    try {
      const id = `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const teacherInviteCode = registerData.role === 'teacher'
        ? generateInviteCode(registerData.teacherGrade || '10')
        : undefined;
      const newUser: DemoUser = {
        id,
        teacherGrade: registerData.teacherGrade,
        title: registerData.title,
        email: registerData.email,
        fullName: registerData.fullName,
        role: registerData.role,
        password: registerData.password,
        teacherInviteCode
      };

      // Prevent duplicate emails in demo store
      if (registerData.email && findUserByEmail(registerData.email)) {
        return { success: false, error: 'An account with this email already exists in the demo data' };
      }

      addDemoUser(newUser);

      const { password: _pw, ...userData } = newUser;
      setUser(userData);
      if (registerData.role === 'teacher') {
        setJustSignedUp(true);
      }
      localStorage.setItem('eduUser', JSON.stringify(userData));
      return { success: true, user: userData };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    setUser(null);
    setJustSignedUp(false);
    localStorage.removeItem('eduUser');
  };

  const validateInvite = async (code: string) => {
    try {
      const normalized = code.toUpperCase();
      const allUsers: DemoUser[] = [...builtInDemoUsers, ...loadDemoUsers()];

      // Find the teacher whose single INVITE CODE matches this code
      const teacher = allUsers.find(
        u => u.role === 'teacher' && u.teacherInviteCode && u.teacherInviteCode.toUpperCase() === normalized
      );

      if (!teacher) {
        return { success: false, error: 'Invalid invite code' };
      }

      const teacherClasses = getTeacherClasses(teacher.id);

      if (!teacherClasses.length) {
        return { success: false, error: 'This teacher has not created any classes yet' };
      }

      const demoClass = teacherClasses[0];
      const classInfo = {
        id: demoClass.id,
        className: demoClass.name,
        grade: demoClass.grade,
        subject: demoClass.subject,
        teacherName: demoClass.teacherName
      };

      return { success: true, classInfo };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const joinClass = async (classId: string, role: string, linkedLearnerId?: string) => {
    if (!user) return { success: false, error: 'Not logged in' };

    try {
      const ok = joinDemoClass(classId, {
        userId: user.id,
        role: role as any,
        linkedLearnerId
      });

      if (!ok) {
        return { success: false, error: 'Class not found in demo data' };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
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
