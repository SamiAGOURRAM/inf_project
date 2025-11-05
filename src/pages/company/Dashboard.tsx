import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Briefcase, Calendar, Users, LogOut, Clock, MapPin } from 'lucide-react';

type CompanyStats = {
  company_id: string;
  company_name: string;
  next_event_id: string | null;
  next_event_name: string | null;
  next_event_date: string | null;
  next_event_location: string | null;
  total_active_offers: number;
  available_slots: number;
  bookings_this_week: number;
  total_event_bookings: number;
};

type UpcomingInterview = {
  id: string;
  student_name: string;
  offer_title: string;
  start_time: string;
  end_time: string;
};

export default function CompanyDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CompanyStats | null>(null);
  const [upcomingInterviews, setUpcomingInterviews] = useState<UpcomingInterview[]>([]);
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
      .select('id, company_name')
      .eq('profile_id', user.id)
      .single();

    if (!company) {
      setLoading(false);
      return;
    }

    // Get next event they're participating in
    const { data: nextEventData } = await supabase
      .from('event_participants')
      .select('events!inner(id, name, date, location)')
      .eq('company_id', company.id)
      .gte('events.date', new Date().toISOString())
      .order('events.date', { ascending: true })
      .limit(1)
      .maybeSingle();

    const nextEvent = nextEventData?.events;

    // Get active offers count
    const { count: activeOffers } = await supabase
      .from('offers')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', company.id)
      .eq('is_active', true);

    let availableSlots = 0;
    let totalEventBookings = 0;

    // Get available slots and total event bookings (if next event exists)
    if (nextEvent) {
      const { count: totalSlots } = await supabase
        .from('event_slots')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', company.id)
        .eq('event_id', nextEvent.id)
        .eq('is_active', true);

      const { count: bookedSlots } = await supabase
        .from('interview_bookings')
        .select('*, event_slots!inner(company_id, event_id)', { count: 'exact', head: true })
        .eq('event_slots.company_id', company.id)
        .eq('event_slots.event_id', nextEvent.id)
        .eq('status', 'confirmed');

      availableSlots = (totalSlots || 0) - (bookedSlots || 0);
      totalEventBookings = bookedSlots || 0;
    }

    // Get bookings this week
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

    const { count: bookingsThisWeek } = await supabase
      .from('interview_bookings')
      .select('*, event_slots!inner(company_id, start_time)', { count: 'exact', head: true })
      .eq('event_slots.company_id', company.id)
      .gte('event_slots.start_time', new Date().toISOString())
      .lte('event_slots.start_time', oneWeekFromNow.toISOString())
      .eq('status', 'confirmed');

    // Get upcoming interviews (next 5)
    const { data: interviews } = await supabase
      .from('interview_bookings')
      .select(`
        id,
        event_slots!inner(start_time, end_time, company_id, offers!inner(title)),
        profiles!inner(full_name)
      `)
      .eq('event_slots.company_id', company.id)
      .gte('event_slots.start_time', new Date().toISOString())
      .eq('status', 'confirmed')
      .order('event_slots.start_time', { ascending: true })
      .limit(5);

    const formattedInterviews: UpcomingInterview[] = interviews?.map((booking: any) => ({
      id: booking.id,
      student_name: booking.profiles?.full_name || 'Unknown',
      offer_title: booking.event_slots?.offers?.title || 'Unknown Offer',
      start_time: booking.event_slots?.start_time,
      end_time: booking.event_slots?.end_time,
    })) || [];

    setStats({
      company_id: company.id,
      company_name: company.company_name,
      next_event_id: nextEvent?.id || null,
      next_event_name: nextEvent?.name || null,
      next_event_date: nextEvent?.date || null,
      next_event_location: nextEvent?.location || null,
      total_active_offers: activeOffers || 0,
      available_slots: availableSlots,
      bookings_this_week: bookingsThisWeek || 0,
      total_event_bookings: totalEventBookings,
    });

    setUpcomingInterviews(formattedInterviews);
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
              <h1 className="text-2xl font-bold text-foreground">{stats?.company_name || 'Company Dashboard'}</h1>
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
        {/* Next Event Banner */}
        {stats?.next_event_id && (
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20 p-6 mb-8">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-medium rounded-full">
                    You're Invited
                  </span>
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">{stats.next_event_name}</h2>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(stats.next_event_date!).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                  {stats.next_event_location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {stats.next_event_location}
                    </div>
                  )}
                </div>
                <p className="text-sm text-foreground font-medium">
                  {stats.total_event_bookings} confirmed booking{stats.total_event_bookings !== 1 ? 's' : ''} for this event
                </p>
              </div>
              <Link
                to={`/company/slots`}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                Manage Slots
              </Link>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link to="/company/offers" className="bg-card rounded-xl border border-border p-6 hover:border-primary hover:shadow-elegant transition-all group">
            <Briefcase className="w-8 h-8 text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
            <p className="text-3xl font-bold text-foreground mb-1">{stats?.total_active_offers || 0}</p>
            <p className="text-sm text-muted-foreground">Active Offers</p>
          </Link>
          
          <Link to="/company/slots" className="bg-card rounded-xl border border-border p-6 hover:border-primary hover:shadow-elegant transition-all group">
            <Calendar className="w-8 h-8 text-purple-500 mb-4 group-hover:scale-110 transition-transform" />
            <p className="text-3xl font-bold text-foreground mb-1">{stats?.available_slots || 0}</p>
            <p className="text-sm text-muted-foreground">Available Slots</p>
          </Link>

          <Link to="/company/schedule" className="bg-card rounded-xl border border-border p-6 hover:border-primary hover:shadow-elegant transition-all group">
            <Users className="w-8 h-8 text-green-500 mb-4 group-hover:scale-110 transition-transform" />
            <p className="text-3xl font-bold text-foreground mb-1">{stats?.bookings_this_week || 0}</p>
            <p className="text-sm text-muted-foreground">Bookings This Week</p>
          </Link>
        </div>

        {/* Upcoming Interviews */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground">Upcoming Interviews</h2>
            {upcomingInterviews.length > 0 && (
              <Link to="/company/schedule" className="text-sm text-primary hover:text-primary/80 transition-colors">
                View All
              </Link>
            )}
          </div>

          {upcomingInterviews.length > 0 ? (
            <div className="space-y-4">
              {upcomingInterviews.map((interview) => (
                <div key={interview.id} className="flex items-center gap-4 p-4 bg-background rounded-lg border border-border hover:border-primary/50 transition-colors">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{interview.student_name}</p>
                    <p className="text-sm text-muted-foreground truncate">{interview.offer_title}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {new Date(interview.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {' at '}
                    {new Date(interview.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground mb-4">No upcoming interviews scheduled</p>
              <Link
                to="/company/slots"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                View Available Slots
              </Link>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center text-sm">
          <Link to="/company/events" className="text-muted-foreground hover:text-foreground transition-colors">
            Events
          </Link>
          <span className="text-border">•</span>
          <Link to="/company/offers" className="text-muted-foreground hover:text-foreground transition-colors">
            Offers
          </Link>
          <span className="text-border">•</span>
          <Link to="/company/schedule" className="text-muted-foreground hover:text-foreground transition-colors">
            Schedule
          </Link>
          <span className="text-border">•</span>
          <Link to="/company/slots" className="text-muted-foreground hover:text-foreground transition-colors">
            Slots
          </Link>
        </div>
      </main>
    </div>
  );
}