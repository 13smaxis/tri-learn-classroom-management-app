import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

interface RegisterViewProps {
  onSwitchToLogin: () => void;
  defaultRole?: 'teacher' | 'parent' | 'learner';
  onRegisterSuccess?: (role: 'teacher' | 'parent' | 'learner') => void;
}

interface ClassInfo {
  classId: string;
  name: string;
  grade: string;
  subject: string;
  teacherName: string;
}

const RegisterView: React.FC<RegisterViewProps> = ({ onSwitchToLogin, defaultRole, onRegisterSuccess }) => {
  const { register } = useAuth();
  // Steps: 1=role select, 1.5='invite' (invite code for parent/learner), 2=form
  const [step, setStep] = useState<'role' | 'invite' | 'form'>(defaultRole ? (defaultRole === 'teacher' ? 'form' : 'invite') : 'role');
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Invite code gate state
  const [inviteCode, setInviteCode] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);

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
    // Teachers go straight to form; parents/learners must enter invite code first
    if (role === 'teacher') {
      setStep('form');
    } else {
      setInviteCode('');
      setInviteError('');
      setClassInfo(null);
      setStep('invite');
    }
  };

  const handleValidateInvite = async () => {
    if (!inviteCode.trim()) {
      setInviteError('Please enter an invite code');
      return;
    }
    setInviteLoading(true);
    setInviteError('');
    try {
      const data = await api.validateInviteCode(inviteCode.trim().toUpperCase());
      setClassInfo(data);
    } catch (err: any) {
      setInviteError(err?.message || 'Invalid invite code');
      setClassInfo(null);
    }
    setInviteLoading(false);
  };

  const handleInviteContinue = () => {
    setStep('form');
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
      setInviteCode('');
      setClassInfo(null);
      setStep('role');
    } else {
      setError(result.error || 'Registration failed');
    }

    setLoading(false);
  };

  const inputClass = "w-full rounded-lg border border-white/30 bg-white text-gray-900 px-4 py-2.5 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-300/40 transition-all placeholder:text-gray-400";
  const labelClass = "block text-sm font-medium text-blue-100 mb-1.5";

  const roleOptions = [
    {
      role: 'teacher' as const,
      title: 'Teacher',
      description: 'Create and manage classes',
      color: 'blue'
    },
    {
      role: 'parent' as const,
      title: 'Parent',
      description: "Monitor your child's progress",
      color: 'green'
    },
    {
      role: 'learner' as const,
      title: 'Learner',
      description: 'Access assignments & grades',
      color: 'purple'
    }
  ];

  const colorClasses: Record<string, string> = {
    blue: 'border-blue-300/50 bg-blue-500/20 hover:bg-blue-500/30 text-white',
    green: 'border-green-300/50 bg-green-500/20 hover:bg-green-500/30 text-white',
    purple: 'border-purple-300/50 bg-purple-500/20 hover:bg-purple-500/30 text-white'
  };

  const EyeToggle = ({ show, onToggle }: { show: boolean; onToggle: () => void }) => (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
      tabIndex={-1}
    >
      {show ? (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )}
    </button>
  );

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 border border-white/20 rounded-2xl p-8 bg-white/5 backdrop-blur-sm">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">Create Account</h1>
        <p className="text-sm text-blue-100 mt-1">Join the platform</p>
      </div>

      {step === 'role' && !defaultRole ? (
        <div className="space-y-3">
          <p className="text-blue-100 text-sm">Select your role to get started</p>
          
          {roleOptions.map((option) => (
            <button
              key={option.role}
              onClick={() => handleRoleSelect(option.role)}
              className={`w-full rounded-xl border-2 p-4 text-left transition-all ${colorClasses[option.color]}`}
            >
              <h3 className="font-semibold text-white">{option.title}</h3>
              <p className="text-sm text-blue-100 mt-0.5">{option.description}</p>
            </button>
          ))}

          <div className="pt-2 text-center">
            <button
              onClick={onSwitchToLogin}
              className="text-sm text-blue-200 hover:text-white transition-colors"
            >
              Already have an account? Sign in
            </button>
          </div>
        </div>
      ) : step === 'invite' ? (
        /* ── Invite code gate for parent/learner ── */
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            {!defaultRole && (
              <button type="button" onClick={() => { setStep('role'); setClassInfo(null); setInviteError(''); }} className="text-blue-200 hover:text-white">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <span className="text-sm font-medium text-blue-100">
              Joining as <span className="text-white capitalize font-semibold">{formData.role}</span>
            </span>
          </div>

          <div>
            <label className={labelClass}>Teacher's Class Invite Code *</label>
            <p className="text-xs text-blue-200 mb-2">Ask your teacher for the 8-character class invite code</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => { setInviteCode(e.target.value.toUpperCase()); setInviteError(''); setClassInfo(null); }}
                className={`${inputClass} font-mono tracking-widest flex-1`}
                placeholder="e.g. A3F2B1C4"
                maxLength={8}
              />
              <button
                type="button"
                onClick={handleValidateInvite}
                disabled={inviteLoading || !inviteCode.trim()}
                className="rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
              >
                {inviteLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : 'Verify'}
              </button>
            </div>
          </div>

          {inviteError && (
            <div className="rounded-lg bg-red-500/20 border border-red-300/30 p-3 text-sm text-red-100">
              {inviteError}
            </div>
          )}

          {classInfo && (
            <div className="rounded-xl border border-green-300/40 bg-green-500/15 p-4 space-y-2">
              <div className="flex items-center gap-2 text-green-200">
                <svg className="w-5 h-5 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold text-green-100">Valid Invite Code</span>
              </div>
              <div className="text-sm text-blue-100 space-y-1">
                <p><span className="text-blue-200">Class:</span> <span className="text-white font-medium">{classInfo.name}</span></p>
                <p><span className="text-blue-200">Grade:</span> <span className="text-white font-medium">{classInfo.grade}</span></p>
                {classInfo.subject && <p><span className="text-blue-200">Subject:</span> <span className="text-white font-medium">{classInfo.subject}</span></p>}
                <p><span className="text-blue-200">Teacher:</span> <span className="text-white font-medium">{classInfo.teacherName}</span></p>
              </div>

              <button
                type="button"
                onClick={handleInviteContinue}
                className="w-full mt-3 rounded-lg bg-green-600 px-4 py-2.5 font-semibold text-white hover:bg-green-700 transition-all"
              >
                Continue to Registration
              </button>
            </div>
          )}

          <div className="text-center">
            <button type="button" onClick={onSwitchToLogin} className="text-sm text-blue-200 hover:text-white transition-colors">
              Already have an account? Sign in
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-500/20 border border-red-300/30 p-3 text-sm text-red-100">
              {error}
            </div>
          )}

          <div className="flex items-center gap-2 mb-2">
            {!defaultRole && (
              <button
                type="button"
                onClick={() => formData.role === 'teacher' ? setStep('role') : setStep('invite')}
                className="text-blue-200 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <span className="text-sm font-medium text-blue-100">
              Registering as <span className="text-white capitalize font-semibold">{formData.role}</span>
            </span>
          </div>

          {/* Show class info for parent/learner */}
          {classInfo && formData.role !== 'teacher' && (
            <div className="rounded-lg border border-green-300/30 bg-green-500/10 p-3 text-xs text-blue-100 flex items-center gap-2">
              <svg className="w-4 h-4 text-green-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Joining <span className="text-white font-medium">{classInfo.name}</span> — {classInfo.grade} — {classInfo.teacherName}</span>
            </div>
          )}

          {/* Two-column grid for fields on wider screens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Title (optional)</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} className={inputClass} placeholder="e.g. Mr, Ms, Dr" />
            </div>

            <div>
              <label className={labelClass}>Full Name *</label>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className={inputClass} placeholder="Enter your full name" required />
            </div>

            <div>
              <label className={labelClass}>Email Address (optional)</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClass} placeholder="you@example.com" />
            </div>

            <div>
              <label className={labelClass}>Phone Number *</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={inputClass} placeholder="0821234567" required />
            </div>

            {formData.role === 'teacher' && (
              <div>
                <label className={labelClass}>School Invite Code *</label>
                <input type="text" name="schoolInviteCode" value={formData.schoolInviteCode} onChange={handleChange} className={`${inputClass} font-mono tracking-widest`} placeholder="e.g. JAN021234" maxLength={9} required disabled={!formData.role || loading} />
                <p className="mt-0.5 text-xs text-blue-200">
                  Demo format: first 3 letters of school + district + unique code
                </p>
              </div>
            )}

            <div>
              <label className={labelClass}>Password *</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} className={`${inputClass} pr-12`} placeholder="At least 6 characters" required disabled={!formData.role || loading} />
                <EyeToggle show={showPassword} onToggle={() => setShowPassword(!showPassword)} />
              </div>
            </div>

            <div>
              <label className={labelClass}>Confirm Password *</label>
              <div className="relative">
                <input type={showConfirm ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className={`${inputClass} pr-12`} placeholder="Confirm your password" required disabled={!formData.role || loading} />
                <EyeToggle show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !formData.role}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg"
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
            <button type="button" onClick={onSwitchToLogin} className="text-sm text-blue-200 hover:text-white transition-colors">
              Already have an account? Sign in
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default RegisterView;
