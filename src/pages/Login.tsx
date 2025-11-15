import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Building2, GraduationCap, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginAs, setLoginAs] = useState<'student' | 'company'>('student');

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    checkUser();
  }, []);

  // -------------------------------
  // Helpers
  // -------------------------------

  const redirectUser = (role: string) => {
    const redirect = searchParams.get('redirect');

    if (redirect) return navigate(redirect);

    const routes: Record<string, string> = {
      admin: '/admin',
      company: '/company',
      student: '/student',
    };

    navigate(routes[role] || '/student');
  };

  const getUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  };

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    try {
      const profile = await getUserProfile(user.id);
      redirectUser(profile.role);
    } catch {
      /* ignore errors */
    }
  };

  // -------------------------------
  // Login Handler
  // -------------------------------

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const profile = await getUserProfile(data.user.id);

      // Prevent incorrect login type
      if (profile.role === 'admin') {
        return redirectUser('admin');
      }

      if (loginAs === 'student' && profile.role !== 'student') {
        await supabase.auth.signOut();
        throw new Error('This account is not a student account. Please use Company Login.');
      }

      if (loginAs === 'company' && profile.role !== 'company') {
        await supabase.auth.signOut();
        throw new Error('This account is not a company account. Please use Student Login.');
      }

      redirectUser(profile.role);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------
  // UI
  // -------------------------------

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
          <div className="flex gap-3 p-1.5 bg-muted rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setLoginAs('student')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition ${
                loginAs === 'student'
                  ? 'bg-primary text-primary-foreground shadow-soft'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <GraduationCap className="w-5 h-5" />
              Student
            </button>

            <button
              type="button"
              onClick={() => setLoginAs('company')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition ${
                loginAs === 'company'
                  ? 'bg-primary text-primary-foreground shadow-soft'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Building2 className="w-5 h-5" />
              Company
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg flex items-start gap-3 animate-in">
              <AlertCircle className="w-5 h-5 mt-0.5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {loginAs === 'student' ? 'UM6P Email (@um6p.ma)' : 'Company Email'}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={loginAs === 'student' ? 'prenom.nom@um6p.ma' : 'contact@company.com'}
                className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg font-medium shadow-soft hover:shadow-elegant disabled:opacity-50"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Additional Links */}
          <div className="mt-6 text-center space-y-3">
            <Link to="/forgot-password" className="block text-sm text-primary hover:underline">
              Forgot Password?
            </Link>

            <p className="text-sm text-muted-foreground">Don't have an account?</p>

            <Link to="/signup" className="block text-sm text-primary hover:underline">
              Student Signup
            </Link>

            <p className="text-xs text-muted-foreground">
              Companies: Registration is by invitation only
            </p>

            <Link to="/offers" className="inline-block text-sm text-muted-foreground hover:text-foreground mt-4">
              ← Back to Offers
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
