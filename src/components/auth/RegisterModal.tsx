import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService, type SchoolData } from '../../services/authService';

interface RegisterModalProps {
  onSwitchToLogin?: () => void;
  defaultRole?: 'teacher' | 'parent' | 'learner';
  onClose?: () => void;
}

type SignupFormData = {
  inviteCode: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role: 'teacher' | 'parent' | 'learner';
};

export const SignupForm: React.FC<RegisterModalProps> = ({ onSwitchToLogin, defaultRole, onClose }) => {
  const navigate = useNavigate();
  const { signup, isLoading, error, clearError } = useAuth();

  // Form state
  const [formData, setFormData] = useState<SignupFormData>({
    inviteCode: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: defaultRole ?? 'teacher',
  });
  const [schoolInfo, setSchoolInfo] = useState<SchoolData | null>(null);
  const [validatingCode, setValidatingCode] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, role: defaultRole ?? 'teacher' }));
  }, [defaultRole]);

  // Validate invite code
  const handleValidateCode = useCallback(async () => {
    if (!formData.inviteCode.trim()) {
      setCodeError('Please enter an invite code');
      return;
    }

    try {
      setValidatingCode(true);
      setCodeError(null);
      const school = await authService.validateInviteCode(formData.inviteCode);
      setSchoolInfo(school);
    } catch (err: any) {
      setCodeError(err.message || 'Invalid invite code');
      setSchoolInfo(null);
    } finally {
      setValidatingCode(false);
    }
  }, [formData.inviteCode]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    // Validation
    if (!schoolInfo) {
      setFormError('Please validate your invite code first');
      return;
    }

    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      setFormError('Please fill in all fields');
      return;
    }

    if (formData.password.length < 8) {
      setFormError('Password must be at least 8 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    if (!['teacher', 'parent', 'learner'].includes(formData.role)) {
      setFormError('Please select a valid role');
      return;
    }

    try {
      await signup({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
        inviteCode: formData.inviteCode,
      });
      onClose?.();
      navigate('/dashboard');
    } catch (err: any) {
      setFormError(err.message || 'Signup failed');
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="bg-white rounded-lg p-2 md:p-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Create Account</h2>

        {/* Invite Code Section */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            School Invite Code *
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={formData.inviteCode}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, inviteCode: e.target.value.toUpperCase() }));
                setSchoolInfo(null);
                setCodeError(null);
              }}
              placeholder="e.g., LIN120001"
              className="flex-1 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={validatingCode}
            />
            <button
              type="button"
              onClick={handleValidateCode}
              disabled={validatingCode || !formData.inviteCode}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {validatingCode ? 'Validating...' : 'Validate'}
            </button>
          </div>
          {codeError && <p className="mt-2 text-sm text-red-600">{codeError}</p>}
          {schoolInfo && (
            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>✓ School:</strong> {schoolInfo.name}
              </p>
            </div>
          )}
        </div>

        {/* Error Messages */}
        {(formError || error) && (
          <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{formError || error}</p>
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                placeholder="John"
                className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={!schoolInfo || isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                placeholder="Doe"
                className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={!schoolInfo || isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="john@example.com"
                className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={!schoolInfo || isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value as 'teacher' | 'parent' | 'learner' }))}
                className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={!schoolInfo || isLoading}
              >
                <option value="teacher">Teacher</option>
                <option value="parent">Parent</option>
                <option value="learner">Learner</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  disabled={!schoolInfo || isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-600 hover:text-gray-900"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">Minimum 8 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password *
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="••••••••"
                className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={!schoolInfo || isLoading}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!schoolInfo || isLoading}
            className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors mt-6"
          >
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        {/* Sign In Link */}
        <p className="mt-4 text-center text-gray-600">
          Already have an account?{' '}
          <button type="button" onClick={onSwitchToLogin} className="text-blue-600 hover:text-blue-700 font-medium">
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignupForm;
