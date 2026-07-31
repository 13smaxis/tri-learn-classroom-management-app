import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface LoginModalProps {
  onSwitchToRegister?: () => void;
  onSwitchToInvite?: () => void;
  onClose?: () => void;
}

export const SigninForm: React.FC<LoginModalProps> = ({ onSwitchToRegister, onSwitchToInvite, onClose }) => {
  const navigate = useNavigate();
  const { signin, isLoading, error, clearError } = useAuth();

  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isValidEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const isValidPhone = (value: string) => {
    return /^0\d{9}$/.test(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    if (!credential || !password) {
      setFormError('Please fill in all fields');
      return;
    }

    if (!isValidEmail(credential) && !isValidPhone(credential)) {
      setFormError('Enter a valid email address or phone number starting with 0 and containing 10 digits.');
      return;
    }

    try {
      await signin(credential, password);
      onClose?.();
      navigate('/dashboard');
    } catch (err: any) {
      setFormError(err.message || 'Login failed');
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="bg-white rounded-lg p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Sign In</h2>

            {/* Error Message */}
            {(formError || error) && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{formError || error}</p>
              </div>
            )}

            {/* Sign In Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email or Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email address or phone number
                </label>
                <input
                  type="text"
                  value={credential}
                  onChange={(e) => setCredential(e.target.value)}
                  placeholder="john@example.com or 0123456789"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-600 hover:text-gray-900"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-gray-700">
                  <input type="checkbox" className="w-4 h-4 rounded" />
                  Remember me
                </label>
                <button type="button" onClick={onSwitchToInvite} className="text-blue-600 hover:text-blue-700">
                  Use invite code
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors mt-6"
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            {/* Sign Up Link */}
            <p className="mt-4 text-center text-gray-600">
              Don't have an account?{' '}
              <button type="button" onClick={onSwitchToRegister} className="text-blue-600 hover:text-blue-700 font-medium">
                Sign Up
              </button>
            </p>
          </div>

          <div className="hidden md:flex items-center justify-center h-full w-full">
            <img src="/logo-removebg.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SigninForm;
