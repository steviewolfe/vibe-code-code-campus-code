import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import '../styles/auth.css'

interface RegisterProps {
  onRegisterSuccess: () => void
  onSwitchToLogin: () => void
}

export function Register({ onRegisterSuccess, onSwitchToLogin }: RegisterProps) {
  const { register, isLoading } = useAuth()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    passwordConfirm: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)

  const validatePassword = (pwd: string) => {
    let strength = 0
    if (pwd.length >= 8) strength++
    if (/[A-Z]/.test(pwd)) strength++
    if (/[a-z]/.test(pwd)) strength++
    if (/[0-9]/.test(pwd)) strength++
    setPasswordStrength(strength)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    if (name === 'password') {
      validatePassword(value)
    }

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    // Validation
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!formData.email) newErrors.email = 'Email is required'
    if (!formData.password) newErrors.password = 'Password is required'
    if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters'
    if (!/[A-Z]/.test(formData.password)) newErrors.password = 'Password must contain an uppercase letter'
    if (!/[a-z]/.test(formData.password)) newErrors.password = 'Password must contain a lowercase letter'
    if (!/[0-9]/.test(formData.password)) newErrors.password = 'Password must contain a digit'
    if (!formData.passwordConfirm) newErrors.passwordConfirm = 'Please confirm your password'
    if (formData.password !== formData.passwordConfirm) newErrors.passwordConfirm = 'Passwords do not match'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      await register(
        formData.firstName,
        formData.lastName,
        formData.email,
        formData.password,
        formData.passwordConfirm
      )
      onRegisterSuccess()
    } catch (err) {
      setErrors({
        submit: err instanceof Error ? err.message : 'Registration failed'
      })
    }
  }

  const getPasswordStrengthLabel = () => {
    const labels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong']
    return labels[passwordStrength] || 'Weak'
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Create Your Account</h1>
          <p>Join Campus Customs and start shopping</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {errors.submit && <div className="error-message">{errors.submit}</div>}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                placeholder="John"
                value={formData.firstName}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
              {errors.firstName && <span className="field-error">{errors.firstName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Doe"
                value={formData.lastName}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
              {errors.lastName && <span className="field-error">{errors.lastName}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="john.doe@yale.edu"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
              required
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {formData.password && (
              <div className="password-strength">
                <div className="strength-meter">
                  <div
                    className={`strength-bar strength-${passwordStrength}`}
                    style={{ width: `${(passwordStrength / 4) * 100}%` }}
                  ></div>
                </div>
                <span className={`strength-label strength-${passwordStrength}`}>
                  {getPasswordStrengthLabel()}
                </span>
              </div>
            )}
            <p className="password-requirements">
              Password must contain: uppercase, lowercase, number, and 8+ characters
            </p>
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="passwordConfirm">Confirm Password</label>
            <input
              id="passwordConfirm"
              name="passwordConfirm"
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirm your password"
              value={formData.passwordConfirm}
              onChange={handleChange}
              disabled={isLoading}
              required
            />
            {errors.passwordConfirm && (
              <span className="field-error">{errors.passwordConfirm}</span>
            )}
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <button
              type="button"
              className="switch-auth-link"
              onClick={onSwitchToLogin}
              disabled={isLoading}
            >
              Log in
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
