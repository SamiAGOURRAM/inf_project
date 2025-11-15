import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { AlertCircle, CheckCircle2, Info, Eye, EyeOff, Check, X } from 'lucide-react';

interface PasswordRequirement {
  label: string;
  regex: RegExp;
}

const passwordRequirements: PasswordRequirement[] = [
  { label: 'At least 8 characters', regex: /.{8,}/ },
  { label: 'One uppercase letter', regex: /[A-Z]/ },
  { label: 'One lowercase letter', regex: /[a-z]/ },
  { label: 'One number', regex: /\d/ },
  { label: 'One special character', regex: /[!@#$%^&*(),.?":{}|<>]/ },
];

export default function Signup() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone: '',
    is_deprioritized: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const navigate = useNavigate();

  const validateEmail = useCallback((email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    if (!email.endsWith('@um6p.ma')) {
      setEmailError('Student email must be from UM6P domain (@um6p.ma)');
      return false;
    }
    setEmailError('');
    return true;
  }, []);

  const checkPasswordRequirements = (password: string) => {
    return passwordRequirements.map(req => ({
      ...req,
      met: req.regex.test(password),
    }));
  };

  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    const requirements = checkPasswordRequirements(password);
    const metCount = requirements.filter(r => r.met).length;
    const percentage = (metCount / requirements.length) * 100;

    if (percentage === 100) return { strength: 100, label: 'Strong', color: 'bg-green-500' };
    if (percentage >= 60) return { strength: percentage, label: 'Medium', color: 'bg-yellow-500' };
    if (percentage > 0) return { strength: percentage, label: 'Weak', color: 'bg-red-500' };
    return { strength: 0, label: '', color: 'bg-gray-300' };
  };

  const validatePassword = useCallback((password: string, confirmPassword: string): boolean => {
    if (!password) {
      setPasswordError('');
      return false;
    }

    const requirements = checkPasswordRequirements(password);
    const allMet = requirements.every(r => r.met);

    if (!allMet) {
      setPasswordError('Password does not meet all requirements');
      return false;
    }

    if (confirmPassword && password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return false;
    }

    setPasswordError('');
    return true;
  }, []);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, email: value });
    validateEmail(value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, password: value });
    validatePassword(value, formData.confirmPassword);
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, confirmPassword: value });
    validatePassword(formData.password, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate all fields
    const isEmailValid = validateEmail(formData.email);
    const isPasswordValid = validatePassword(formData.password, formData.confirmPassword);

    if (!isEmailValid || !isPasswordValid) {
      setError('Please fix the errors above before submitting');
      return;
    }

    if (!formData.full_name.trim()) {
      setError('Full name is required');
      return;
    }

    if (loading) return; // Prevent double submission
    
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name.trim(),
            role: 'student',
            phone: formData.phone.trim() || null,
            is_deprioritized: formData.is_deprioritized,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');

      setSuccess(true);
      
      // Countdown timer
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/login');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (err: any) {
      if (err.message.includes('User already registered')) {
        setError('This email is already registered. Please login instead.');
      } else if (err.message.includes('Password')) {
        setError('Password is too weak. Please use a stronger password.');
      } else {
        setError(err.message || 'An error occurred during signup. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card rounded-2xl shadow-elegant p-8 border border-border text-center">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-500" aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Account Created!</h2>
          <p className="text-muted-foreground mb-4">Please check your email to verify your account.</p>
          <p className="text-sm text-muted-foreground">Redirecting to login in {countdown} second{countdown !== 1 ? 's' : ''}...</p>
          <Link 
            to="/login" 
            className="mt-4 inline-block text-sm text-primary hover:underline font-medium"
          >
            Go to Login Now
          </Link>
        </div>
      </div>
    );
  }

  const passwordStrength = getPasswordStrength(formData.password);
  const requirements = checkPasswordRequirements(formData.password);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-card rounded-2xl shadow-elegant p-8 border border-border">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Create Account</h1>
            <p className="text-muted-foreground">INF Platform 2.0 - Student Registration</p>
          </div>

          {/* Info Banner */}
          <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg mb-6 flex gap-3">
            <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm text-primary font-medium">UM6P Students Only</p>
              <p className="text-xs text-primary/80 mt-1">
                Companies: Registration is by invitation only. Contact the event administrator.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg flex items-start gap-3 animate-in" role="alert">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-foreground mb-2">
                Full Name <span className="text-destructive">*</span>
              </label>
              <input
                id="full_name"
                type="text"
                required
                autoComplete="name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                UM6P Email <span className="text-destructive">*</span>
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={formData.email}
                onChange={handleEmailChange}
                placeholder="student@um6p.ma"
                className={`w-full px-4 py-3 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-shadow ${
                  emailError ? 'border-destructive' : 'border-input'
                }`}
                aria-invalid={!!emailError}
                aria-describedby={emailError ? 'email-error' : undefined}
              />
              {emailError && (
                <p id="email-error" className="mt-1 text-sm text-destructive" role="alert">
                  {emailError}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Password <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handlePasswordChange}
                  className={`w-full px-4 py-3 pr-12 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-shadow ${
                    passwordError ? 'border-destructive' : 'border-input'
                  }`}
                  aria-invalid={!!passwordError}
                  aria-describedby="password-requirements"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" aria-hidden="true" />
                  ) : (
                    <Eye className="w-5 h-5" aria-hidden="true" />
                  )}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Password strength:</span>
                    <span className={`text-xs font-medium ${
                      passwordStrength.strength === 100 ? 'text-green-500' : 
                      passwordStrength.strength >= 60 ? 'text-yellow-500' : 'text-red-500'
                    }`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${passwordStrength.strength}%` }}
                      role="progressbar"
                      aria-valuenow={passwordStrength.strength}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                </div>
              )}

              {/* Password Requirements */}
              <div id="password-requirements" className="mt-3 space-y-1">
                {requirements.map((req, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    {req.met ? (
                      <Check className="w-4 h-4 text-green-500" aria-hidden="true" />
                    ) : (
                      <X className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                    )}
                    <span className={req.met ? 'text-green-500' : 'text-muted-foreground'}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                Confirm Password <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  className={`w-full px-4 py-3 pr-12 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-shadow ${
                    formData.confirmPassword && formData.password !== formData.confirmPassword ? 'border-destructive' : 'border-input'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" aria-hidden="true" />
                  ) : (
                    <Eye className="w-5 h-5" aria-hidden="true" />
                  )}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="mt-1 text-sm text-destructive" role="alert">
                  Passwords do not match
                </p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                Phone (optional)
              </label>
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+212 6XX XXX XXX"
                className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
              />
            </div>

            {/* Deprioritized Warning */}
            <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_deprioritized}
                  onChange={(e) => setFormData({ ...formData, is_deprioritized: e.target.checked })}
                  className="mt-1 mr-3 w-4 h-4 text-primary border-input rounded focus:ring-ring"
                />
                <div>
                  <div className="font-medium text-foreground">I already have an internship</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    ⚠️ IMPORTANT: If you check this box, you will NOT be able to book during Phase 1.
                    You can only book during Phase 2.
                  </div>
                </div>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !!emailError || !!passwordError || formData.password !== formData.confirmPassword}
              className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg font-medium shadow-soft hover:shadow-elegant transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-busy={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" aria-hidden="true"></span>
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Additional Links */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm text-primary hover:underline font-medium"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}