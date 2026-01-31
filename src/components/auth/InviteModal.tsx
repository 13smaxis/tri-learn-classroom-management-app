import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
  onSwitchToRegister: (role: 'parent' | 'learner') => void;
}

const InviteModal: React.FC<InviteModalProps> = ({ isOpen, onClose, onSwitchToLogin, onSwitchToRegister }) => {
  const { user, validateInvite, joinClass } = useAuth();
  const [inviteCode, setInviteCode] = useState('');
  const [classInfo, setClassInfo] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<'parent' | 'learner'>('parent');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await validateInvite(inviteCode.toUpperCase());

    if (result.success) {
      setClassInfo(result.classInfo);
      setSelectedRole('parent');
    } else {
      setError(result.error || 'Invalid invite code');
    }

    setLoading(false);
  };

  const handleJoin = async () => {
    if (!user) {
      onSwitchToRegister(selectedRole);
      return;
    }

    setLoading(true);
    const result = await joinClass(classInfo.id, selectedRole);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setInviteCode('');
        setClassInfo(null);
        setSuccess(false);
      }, 2000);
    } else {
      setError(result.error || 'Failed to join class');
    }

    setLoading(false);
  };

  const handleClose = () => {
    onClose();
    setInviteCode('');
    setClassInfo(null);
    setError('');
    setSuccess(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Join a Class" size="sm">
      {success ? (
        <div className="text-center py-8">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Successfully Joined!</h3>
          <p className="text-gray-600 mt-2">You are now part of {classInfo?.className}</p>
        </div>
      ) : !classInfo ? (
        <form onSubmit={handleValidate} className="space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-100">
              {error}
            </div>
          )}

          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <p className="text-gray-600">Enter the invite code shared by your teacher</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Invite Code</label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-2xl font-mono tracking-widest uppercase focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              placeholder="XXXXXXXX"
              maxLength={8}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || inviteCode.length < 8}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Validating...
              </span>
            ) : 'Validate Code'}
          </button>

          <div className="text-center pt-4">
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Already have an account? Sign in
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-5">
          <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-5">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-blue-100 p-3">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{classInfo.className}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Grade {classInfo.grade} • {classInfo.subject}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Teacher: {classInfo.teacherName}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-gray-50 p-4 space-y-3">
            <p className="text-sm text-gray-600">
              How are you joining this class?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedRole('parent')}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                  selectedRole === 'parent'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                I'm a Parent
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('learner')}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                  selectedRole === 'learner'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                I'm a Learner
              </button>
            </div>
          </div>

          {!user && (
            <div className="rounded-lg bg-orange-50 border border-orange-200 p-4">
              <p className="text-sm text-orange-700">
                You need to create an account or sign in to join this class.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setClassInfo(null)}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-3 font-medium text-gray-700 hover:bg-gray-50 transition-all"
            >
              Back
            </button>
            <button
              onClick={handleJoin}
              disabled={loading}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-all"
            >
              {loading ? 'Joining...' : user ? 'Join Class' : 'Create Account & Join'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default InviteModal;
