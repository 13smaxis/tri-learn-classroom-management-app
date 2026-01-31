import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
  defaultRole?: 'teacher' | 'parent' | 'learner';
  onRegisterSuccess?: (role: 'teacher' | 'parent' | 'learner') => void;
}

const RegisterModal: React.FC<RegisterModalProps> = ({ isOpen, onClose, onSwitchToLogin, defaultRole, onRegisterSuccess }) => {
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const initialRole = (defaultRole || 'teacher') as 'teacher' | 'parent' | 'learner';
  const [formData, setFormData] = useState({
    title: '',
    teacherGrade: '10',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    role: initialRole,
    schoolInviteCode: initialRole === 'teacher' ? 'JAN021234' : ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleSelect = (role: 'teacher' | 'parent' | 'learner') => {
    setFormData({
      ...formData,
      role,
      teacherGrade: role === 'teacher' ? (formData.teacherGrade || '10') : '',
      schoolInviteCode: role === 'teacher' ? formData.schoolInviteCode || 'JAN021234' : ''
    });
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const result = await register({
      title: formData.title || undefined,
      teacherGrade: formData.role === 'teacher' ? formData.teacherGrade || '10' : undefined,
      email: formData.email || undefined,
      password: formData.password,
      fullName: formData.fullName,
      role: formData.role,
      phone: formData.phone || undefined,
      schoolInviteCode: formData.schoolInviteCode || undefined
    });

    if (result.success) {
      if (onRegisterSuccess) {
        onRegisterSuccess(formData.role as 'teacher' | 'parent' | 'learner');
      }

      // Always close the modal on success; AppLayout will
      // handle showing a blurred welcome overlay for teachers
      onClose();
      setFormData({
        title: '',
        teacherGrade: '10',
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        phone: '',
        role: 'teacher',
        schoolInviteCode: 'JAN021234'
      });
      setStep(1);
    } else {
      setError(result.error || 'Registration failed');
    }

    setLoading(false);
  };

  const roleOptions = [
    {
      role: 'teacher' as const,
      title: 'Teacher',
      description: 'Create and manage classes, track student progress',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      ),
      color: 'blue'
    },
    {
      role: 'parent' as const,
      title: 'Parent',
      description: 'Monitor your child\'s progress and communicate with teachers',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'green'
    },
    {
      role: 'learner' as const,
      title: 'Learner',
      description: 'Access assignments, view grades, and submit work',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      color: 'purple'
    }
  ];

  const colorClasses: Record<string, string> = {
    blue: 'border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-300',
    green: 'border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-300',
    purple: 'border-purple-200 bg-purple-50 hover:bg-purple-100 hover:border-purple-300'
  };

  const iconColorClasses: Record<string, string> = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600'
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Account"
      size="md"
    >
      {step === 1 && !defaultRole ? (
        <div className="space-y-4">
          <p className="text-gray-600 mb-6">Select your role to get started</p>
          
          {roleOptions.map((option) => (
            <button
              key={option.role}
              onClick={() => handleRoleSelect(option.role)}
              className={`w-full rounded-xl border-2 p-5 text-left transition-all ${colorClasses[option.color]}`}
            >
              <div className="flex items-start gap-4">
                <div className={iconColorClasses[option.color]}>
                  {option.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{option.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                </div>
              </div>
            </button>
          ))}

          <div className="pt-4 text-center">
            <button
              onClick={onSwitchToLogin}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Already have an account? Sign in
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-100">
              {error}
            </div>
          )}

          <div className="flex items-center gap-2 mb-4">
            {!defaultRole && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <span className="text-sm font-medium text-gray-600">
              Registering as <span className="text-blue-600 capitalize">{formData.role}</span>
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title (optional)</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              placeholder="e.g. Mr, Ms, Dr"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              placeholder="Enter your full name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address (optional)</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              placeholder="0821234567"
              required
            />
          </div>

          {formData.role === 'teacher' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Primary Teaching Grade *</label>
                <select
                  name="teacherGrade"
                  value={formData.teacherGrade}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  required
                >
                  <option value="">Select grade</option>
                  <option value="1">Grade 1</option>
                  <option value="2">Grade 2</option>
                  <option value="3">Grade 3</option>
                  <option value="4">Grade 4</option>
                  <option value="5">Grade 5</option>
                  <option value="6">Grade 6</option>
                  <option value="7">Grade 7</option>
                  <option value="8">Grade 8</option>
                  <option value="9">Grade 9</option>
                  <option value="10">Grade 10</option>
                  <option value="11">Grade 11</option>
                  <option value="12">Grade 12</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">School Invite Code *</label>
                <input
                  type="text"
                  name="schoolInviteCode"
                  value={formData.schoolInviteCode}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 font-mono tracking-widest focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  placeholder="e.g. JAN021234"
                  maxLength={9}
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Demo format: first 3 letters of school + district + unique code (for example <span className="font-semibold">JAN021234</span>).
                </p>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              placeholder="At least 6 characters"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              placeholder="Confirm your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating account...
              </span>
            ) : 'Create Account'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Already have an account? Sign in
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default RegisterModal;
