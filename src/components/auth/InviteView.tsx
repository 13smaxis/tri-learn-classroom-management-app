import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

interface InviteViewProps 
{
  onSwitchToLogin: () => void;
  onSwitchToRegister: (role: 'parent' | 'learner') => void;
}

interface ClassInfo 
{
  classId: string;
  name: string;
  grade: string;
  subject: string;
  teacherName: string;
}

const InviteView: React.FC<InviteViewProps> = ({ onSwitchToLogin, onSwitchToRegister }) => {
  const { user, joinClass } = useAuth();
  const [inviteCode, setInviteCode] = useState('');
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [selectedRole, setSelectedRole] = useState<'parent' | 'learner'>('learner');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleValidate = async () => {
    if (!inviteCode.trim()) {
      setError('Please enter an invite code');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await api.validateInviteCode(inviteCode.trim().toUpperCase());
      setClassInfo(data);
    } catch (err: any) {
      setError(err?.message || 'Invalid invite code');
      setClassInfo(null);
    }
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!user) {
      onSwitchToRegister(selectedRole);
      return;
    }

    setLoading(true);
    setError('');
    const result = await joinClass(classInfo!.classId, selectedRole);
    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error || 'Failed to join class');
    }
    setLoading(false);
  };

  const inputClass = "w-full rounded-lg border border-white/30 bg-white text-gray-900 px-4 py-3 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-300/40 transition-all placeholder:text-gray-400";
  const labelClass = "block text-sm font-medium text-blue-100 mb-1.5";

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto border border-white/20 rounded-2xl p-6 bg-white/5 backdrop-blur-sm text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-green-500/20 border border-green-300/30 rounded-full flex items-center justify-center">
          <svg className="h-8 w-8 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white">Successfully Joined!</h2>
        <p className="text-blue-100">You are now part of <span className="text-white font-medium">{classInfo?.name}</span></p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4 max-h-[70vh] overflow-y-auto no-scrollbar border border-white/20 rounded-2xl p-6 bg-white/5 backdrop-blur-sm">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white">Join a Class</h1>
        <p className="text-sm text-blue-100 mt-1">Enter the invite code shared by your teacher</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/20 border border-red-300/30 p-3 text-sm text-red-100">
          {error}
        </div>
      )}

      {!classInfo ? (
        /* ── Step 1: Enter & validate invite code ── */
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Invite Code *</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => { setInviteCode(e.target.value.toUpperCase()); setError(''); }}
                className={`${inputClass} font-mono tracking-widest text-center text-lg flex-1`}
                placeholder="e.g. A3F2B1C4"
                maxLength={8}
              />
              <button
                type="button"
                onClick={handleValidate}
                disabled={loading || !inviteCode.trim()}
                className="rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : 'Verify'}
              </button>
            </div>
          </div>

          <div className="text-center pt-2">
            <button type="button" onClick={onSwitchToLogin} className="text-sm text-blue-200 hover:text-white transition-colors">
              Already have an account? Sign in
            </button>
          </div>
        </div>
      ) : (
        /* ── Step 2: Class info + role select + join ── */
        <div className="space-y-4">
          {/* Class info card */}
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
          </div>

          {/* Role select */}
          <div className="space-y-2">
            <p className="text-sm text-blue-100">How are you joining this class?</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedRole('learner')}
                className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
                  selectedRole === 'learner'
                    ? 'border-green-400/60 bg-green-500/20 text-white'
                    : 'border-white/20 text-blue-200 hover:bg-white/5'
                }`}
              >
                I'm a Learner
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('parent')}
                className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
                  selectedRole === 'parent'
                    ? 'border-purple-400/60 bg-purple-500/20 text-white'
                    : 'border-white/20 text-blue-200 hover:bg-white/5'
                }`}
              >
                I'm a Parent
              </button>
            </div>
          </div>

          {/* Not logged in warning */}
          {!user && (
            <div className="rounded-lg bg-orange-500/15 border border-orange-300/30 p-3 text-sm text-orange-100">
              You need to create an account to join this class.
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { setClassInfo(null); setError(''); }}
              className="flex-1 rounded-lg border border-white/20 px-4 py-2.5 font-medium text-blue-200 hover:bg-white/5 transition-all"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleJoin}
              disabled={loading}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Joining...' : user ? 'Join Class' : 'Create Account & Join'}
            </button>
          </div>

          <div className="text-center">
            <button type="button" onClick={onSwitchToLogin} className="text-sm text-blue-200 hover:text-white transition-colors">
              Already have an account? Sign in
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InviteView;
