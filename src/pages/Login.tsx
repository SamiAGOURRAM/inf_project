import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Building2, GraduationCap, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loginAs, setLoginAs] = useState<'student' | 'company'>('student');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile) {
          redirectUser(profile.role);
        }
      }
    } catch (err) {
      console.error('Error checking user:', err);
    }
  };

  const redirectUser = (role: string) => {
    const redirect = searchParams.get('redirect');
    if (redirect) {
      navigate(redirect);
    } else if (role === 'admin') {
      navigate('/admin');
    } else if (role === 'company') {
      navigate('/company');
    } else {
      navigate('/student');
    }
  };

  const validateEmail = useCallback((email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    
    if (loginAs === 'student' && !email.endsWith('@um6p.ma')) {
      setEmailError('Student email must be from UM6P domain (@um6p.ma)');
      return false;
    }
    
    setEmailError('');
    return true;
  }, [loginAs]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (value) {
      validateEmail(value);
    } else {
      setEmailError('');
    }
  };

  const getErrorMessage = (error: any): string => {
    if (error.message.includes('Invalid login credentials')) {
      return 'Invalid email or password. Please try again.';
    }
    if (error.message.includes('Email not confirmed')) {
      return 'Please verify your email address before logging in.';
    }
    if (error.message.includes('Network')) {
      return 'Network error. Please check your connection and try again.';
    }
    return error.message;
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate email before submission
    if (!validateEmail(email)) {
      return;
    }

    if (loading) return; // Prevent double submission
    
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error('Login failed. Please try again.');
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        throw new Error('Failed to fetch user profile. Please try again.');
      }

      if (profile) {
        // Admin can login from anywhere
        if (profile.role === 'admin') {
          redirectUser(profile.role);
          return;
        }

        // Check role mismatch
        if (loginAs === 'student' && profile.role !== 'student') {
          await supabase.auth.signOut();
          throw new Error('This account is not a student account. Please use Company Login.');
        }
        if (loginAs === 'company' && profile.role !== 'company') {
          await supabase.auth.signOut();
          throw new Error('This account is not a company account. Please use Student Login.');
        }
        
        redirectUser(profile.role);
      }
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-card rounded-2xl shadow-elegant p-8 border border-border">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h1>
            <p className="text-muted-foreground">INF Platform 2.0 - Speed Recruiting</p>
          </div>

          {/* Login Type Selector */}
          <div className="flex gap-3 p-1.5 bg-muted rounded-xl mb-6" role="tablist" aria-label="Login type">
            <button
              type="button"
              role="tab"
              aria-selected={loginAs === 'student'}
              aria-label="Login as student"
              onClick={() => {
                setLoginAs('student');
                setEmailError('');
                setError('');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                loginAs === 'student'
                  ? 'bg-primary text-primary-foreground shadow-soft'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <GraduationCap className="w-5 h-5" aria-hidden="true" />
              Student
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={loginAs === 'company'}
              aria-label="Login as company"
              onClick={() => {
                setLoginAs('company');
                setEmailError('');
                setError('');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                loginAs === 'company'
                  ? 'bg-primary text-primary-foreground shadow-soft'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Building2 className="w-5 h-5" aria-hidden="true" />
              Company
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg flex items-start gap-3 animate-in" role="alert">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                {loginAs === 'student' ? 'UM6P Email (@um6p.ma)' : 'Company Email'}
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={handleEmailChange}
                placeholder={loginAs === 'student' ? 'prenom.nom@um6p.ma' : 'contact@company.com'}
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
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
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
            </div>

            <button
              type="submit"
              disabled={loading || !!emailError}
              className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg font-medium shadow-soft hover:shadow-elegant transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-busy={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" aria-hidden="true"></span>
                  Signing In...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Additional Links */}
          <div className="mt-6 text-center space-y-3">
            <Link
              to="/forgot-password"
              className="block text-sm text-primary hover:underline font-medium"
            >
              Forgot Password?
            </Link>
            
            <p className="text-sm text-muted-foreground">Don't have an account?</p>
            <Link
              to="/signup"
              className="block text-sm text-primary hover:underline font-medium"
            >
              Student Signup
            </Link>
            <p className="text-xs text-muted-foreground">
              Companies: Registration is by invitation only
            </p>
            <Link
              to="/offers"
              className="inline-block text-sm text-muted-foreground hover:text-foreground mt-4"
            >
              ← Back to Offers
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}