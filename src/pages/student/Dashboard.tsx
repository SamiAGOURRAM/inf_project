import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Calendar, Briefcase, User, LogOut, Book } from 'lucide-react';

export default function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ bookings: 0, offers: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    checkStudentAndLoadData();
  }, []);

  const checkStudentAndLoadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'student') {
      navigate('/offers');
      return;
    }

    const { count: bookingsCount } = await supabase
      .from('interview_bookings')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', user.id)
      .eq('status', 'confirmed');

    const { count: offersCount } = await supabase
      .from('offers')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    setStats({ bookings: bookingsCount || 0, offers: offersCount || 0 });
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Student Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1">Welcome back!</p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-in">
          <Link to="/student/bookings" className="bg-card rounded-xl border border-border p-6 hover:border-primary hover:shadow-elegant transition-all">
            <Calendar className="w-8 h-8 text-primary mb-4" />
            <p className="text-3xl font-bold text-foreground mb-1">{stats.bookings}</p>
            <p className="text-sm text-muted-foreground">My Bookings</p>
          </Link>
          
          <Link to="/student/offers" className="bg-card rounded-xl border border-border p-6 hover:border-primary hover:shadow-elegant transition-all">
            <Briefcase className="w-8 h-8 text-success mb-4" />
            <p className="text-3xl font-bold text-foreground mb-1">{stats.offers}</p>
            <p className="text-sm text-muted-foreground">Available Offers</p>
          </Link>

          <Link to="/student/profile" className="bg-card rounded-xl border border-border p-6 hover:border-primary hover:shadow-elegant transition-all">
            <User className="w-8 h-8 text-warning mb-4" />
            <p className="text-sm font-medium text-foreground mb-1">My Profile</p>
            <p className="text-sm text-muted-foreground">View & edit</p>
          </Link>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to="/student/offers" className="p-4 bg-primary/5 border border-primary/20 rounded-lg hover:bg-primary/10 transition-colors">
              <Book className="w-8 h-8 text-primary mb-2" />
              <h3 className="font-semibold text-foreground mb-1">Browse Offers</h3>
              <p className="text-sm text-muted-foreground">Explore available internship opportunities</p>
            </Link>
            <Link to="/student/bookings" className="p-4 bg-success/5 border border-success/20 rounded-lg hover:bg-success/10 transition-colors">
              <Calendar className="w-8 h-8 text-success mb-2" />
              <h3 className="font-semibold text-foreground mb-1">Manage Bookings</h3>
              <p className="text-sm text-muted-foreground">View and manage your interview slots</p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}