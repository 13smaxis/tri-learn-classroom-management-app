import { useState } from 'react'
import { Mail, Lock, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface LoginPageProps {
  isRegister?: boolean
}

export default function LoginPage({ isRegister = false }: LoginPageProps) {
  const { login, register } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'learner' as 'teacher' | 'parent' | 'learner',
    schoolInviteCode: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isRegister) {
        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match')
        }
        
        if (formData.password.length < 6) {
          throw new Error('Password must be at least 6 characters')
        }

        await register({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
        })
      } else {
        await login(formData.email, formData.password)
      }
      // Navigation will happen automatically via App.tsx when user state changes
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">School App</h1>
          <p className="text-gray-600">
            {isRegister ? 'Create your account' : 'Welcome back'}
          </p>
        </div>

        {/* Card */}
        <div className="card">
          {error && (
            <div className="p-4 bg-danger-50 border border-danger-200 rounded-md flex gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-danger-600 flex-shrink-0" />
              <p className="text-sm text-danger-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-96">
            {isRegister && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="input"
                    required
                    placeholder="John"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="input"
                    required
                    placeholder="Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="input"
                    required
                  >
                    <option value="learner">Learner</option>
                    <option value="teacher">Teacher</option>
                    <option value="parent">Parent</option>
                  </select>
                </div>

                {formData.role === 'teacher' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      School Invite Code *
                    </label>
                    <input
                      type="text"
                      name="schoolInviteCode"
                      value={formData.schoolInviteCode}
                      onChange={handleChange}
                      className="input"
                      required
                      placeholder="e.g., JAN021234"
                      maxLength={10}
                    />
                    <p className="text-xs text-gray-500 mt-1">Format: First 3 letters of school + district + unique code</p>
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address {!isRegister && '*'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input pl-10"
                  required={!isRegister}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input pl-10"
                  required
                  placeholder="••••••••"
                />
              </div>
            </div>

            {isRegister && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="input pl-10"
                    required
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-6"
            >
              {loading ? 'Loading...' : isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
              <a
                href={isRegister ? '/login' : '/register'}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                {isRegister ? 'Sign in' : 'Register'}
              </a>
            </p>
          </div>
        </div>

        {/* Info */}
        <p className="text-center text-xs text-gray-500 mt-4">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
