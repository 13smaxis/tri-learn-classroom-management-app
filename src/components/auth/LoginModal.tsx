import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface LoginViewProps {
  onSwitchToRegister: () => void;
  onSwitchToInvite: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onSwitchToRegister, onSwitchToInvite }) => {
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'teacher' | 'learner' | 'parent' | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(phone, password);

    if (result.success) {
      setPhone('');
      setPassword('');
      setSelectedRole(null);
    } else {
      setError(result.error || 'Login failed');
    }

    setLoading(false);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
          <p className="text-sm text-blue-100 mt-1">Sign in to your account</p>
        </div>

        {/* Role Selection */}
        <div>
          <p className="text-sm font-medium text-blue-100 mb-3">I am a:</p>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setSelectedRole('teacher')}
              disabled={loading}
              className={`p-3 rounded-lg font-medium transition-all flex flex-col items-center justify-center gap-2 ${
                selectedRole === 'teacher'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span className="text-xs">Teacher</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('learner')}
              disabled={loading}
              className={`p-3 rounded-lg font-medium transition-all flex flex-col items-center justify-center gap-2 ${
                selectedRole === 'learner'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0v6" />
              </svg>
              <span className="text-xs">Learner</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('parent')}
              disabled={loading}
              className={`p-3 rounded-lg font-medium transition-all flex flex-col items-center justify-center gap-2 ${
                selectedRole === 'parent'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
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

        {/* Cellphone Number Input */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-blue-100 mb-2">Cellphone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-white/30 bg-white text-gray-900 px-4 py-3 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-300/40 transition-all placeholder:text-gray-400"
              placeholder="0821234567"
              required
            />
          </div>

          {/* Password Input with visibility toggle */}
          <div>
            <label className="block text-sm font-medium text-blue-100 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-white/30 bg-white text-gray-900 px-4 py-3 pr-12 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-300/40 transition-all placeholder:text-gray-400"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? (
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
            </div>
          </div>

          {/* Sign In Button */}
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
                Signing in...
              </span>
            ) : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-blue-400/30"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-transparent px-4 text-blue-200">or</span>
          </div>
        </div>

        {/* Conditional Actions Based on Role */}
        <div className="space-y-3">
          {selectedRole === 'teacher' && (
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="w-full rounded-lg border border-blue-300/50 px-4 py-3 font-medium text-white hover:bg-white/10 transition-all"
            >
              Create New Account
            </button>
          )}

          {(selectedRole === 'learner' || selectedRole === 'parent') && (
            <button
              type="button"
              onClick={onSwitchToInvite}
              className="w-full rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 font-medium text-blue-600 hover:bg-blue-100 transition-all"
            >
              Join with Invite Code
            </button>
          )}

          {!selectedRole && (
            <p className="text-center text-sm text-blue-200">Select a role above to see sign-up options</p>
          )}
        </div>
      </div>
  );
};

export default LoginView;
