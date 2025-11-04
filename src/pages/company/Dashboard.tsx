import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Briefcase, Calendar, Users, LogOut } from 'lucide-react';

export default function CompanyDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ offers: 0, events: 0, bookings: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    checkCompanyAndLoadData();
  }, []);

  const checkCompanyAndLoadData = async () => {
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

    if (!profile || profile.role !== 'company') {
      navigate('/offers');
      return;
    }

    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('profile_id', user.id)
      .single();

    if (company) {
      const { count: offersCount } = await supabase
        .from('offers')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', company.id);

      setStats({ ...stats, offers: offersCount || 0 });
    }

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
              <h1 className="text-2xl font-bold text-foreground">Company Dashboard</h1>
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
          <Link to="/company/offers" className="bg-card rounded-xl border border-border p-6 hover:border-primary hover:shadow-elegant transition-all">
            <Briefcase className="w-8 h-8 text-primary mb-4" />
            <p className="text-3xl font-bold text-foreground mb-1">{stats.offers}</p>
            <p className="text-sm text-muted-foreground">Active Offers</p>
          </Link>
          
          <Link to="/company/events" className="bg-card rounded-xl border border-border p-6 hover:border-primary hover:shadow-elegant transition-all">
            <Calendar className="w-8 h-8 text-success mb-4" />
            <p className="text-3xl font-bold text-foreground mb-1">{stats.events}</p>
            <p className="text-sm text-muted-foreground">Events</p>
          </Link>

          <Link to="/company/schedule" className="bg-card rounded-xl border border-border p-6 hover:border-primary hover:shadow-elegant transition-all">
            <Users className="w-8 h-8 text-warning mb-4" />
            <p className="text-3xl font-bold text-foreground mb-1">{stats.bookings}</p>
            <p className="text-sm text-muted-foreground">Bookings</p>
          </Link>
        </div>
      </main>
    </div>
  );
}