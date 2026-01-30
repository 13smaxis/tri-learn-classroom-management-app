import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
  onSwitchToInvite: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSwitchToRegister, onSwitchToInvite }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'teacher' | 'learner' | 'parent' | null>(null);

  // Predefined credentials for demo
  const demoCredentials = {
    teacher: { email: 'teacher@school.com', password: 'teacher123' },
    learner: { email: 'learner@school.com', password: 'learner123' },
    parent: { email: 'parent@school.com', password: 'parent123' }
  };

  const handleDemoLogin = async (role: 'teacher' | 'learner' | 'parent') => {
    setSelectedRole(role);
    const creds = demoCredentials[role];
    setEmail(creds.email);
    setPassword(creds.password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      onClose();
      setEmail('');
      setPassword('');
      setSelectedRole(null);
    } else {
      setError(result.error || 'Login failed');
    }

    setLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Welcome Back" size="sm">
      <div className="space-y-5">
        {/* Role Selection */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">Select your role:</p>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleDemoLogin('teacher')}
              disabled={loading}
              className={`p-3 rounded-lg font-medium transition-all flex flex-col items-center justify-center gap-2 ${selectedRole === 'teacher'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span className="text-xs">Teacher</span>
            </button>

            <button
              onClick={() => handleDemoLogin('learner')}
              disabled={loading}
              className={`p-3 rounded-lg font-medium transition-all flex flex-col items-center justify-center gap-2 ${selectedRole === 'learner'
                  ? 'bg-green-600 text-white'
                  : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5m0 0l9 5m-9-5v10l9 5m0 0l9-5m-9 5v-10m0 0l-9-5m0 0v10a9 9 0 009 9m0 0v-10m0 10a9 9 0 01-9-9m0 0h18m0 0V5a9 9 0 00-9-9" />
              </svg>
              <span className="text-xs">Learner</span>
            </button>

            <button
              onClick={() => handleDemoLogin('parent')}
              disabled={loading}
              className={`p-3 rounded-lg font-medium transition-all flex flex-col items-center justify-center gap-2 ${selectedRole === 'parent'
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 8.646 4 4 0 010-8.646M9 9H3v10a6 6 0 006 6h6a6 6 0 006-6V9h-6a4 4 0 00-4 4" />
              </svg>
              <span className="text-xs">Parent</span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-100">
            {error}
          </div>
        )}

        {/* Email Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            placeholder="you@example.com"
            required
          />
        </div>

        {/* Password Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            placeholder="Enter your password"
            required
          />
        </div>

        {/* Sign In Button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Signing in...
            </span>
          ) : 'Sign In'}
        </button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-4 text-gray-500">or</span>
          </div>
        </div>

        {/* Additional Actions */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 font-medium text-gray-700 hover:bg-gray-50 transition-all"
          >
            Create New Account
          </button>

          <button
            type="button"
            onClick={onSwitchToInvite}
            className="w-full rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 font-medium text-blue-600 hover:bg-blue-100 transition-all"
          >
            Join with Invite Code
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default LoginModal;
