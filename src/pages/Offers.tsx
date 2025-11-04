import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Building2, MapPin, Calendar, Briefcase, LogIn, UserPlus } from 'lucide-react';
import type { Offer, Company, Event } from '@/types/database';

type OfferWithDetails = Offer & {
  companies: Company;
  events: Event;
};

export default function Offers() {
  const [offers, setOffers] = useState<OfferWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'Opérationnel' | 'Administratif'>('all');
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
    loadOffers();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const loadOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('offers')
        .select(`
          *,
          companies(*),
          events(*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOffers((data as OfferWithDetails[]) || []);
    } catch (error) {
      console.error('Error loading offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOffers = offers.filter(offer => 
    filter === 'all' || offer.interest_tag === filter
  );

  const handleOfferClick = (offerId: string) => {
    if (user) {
      navigate(`/student/offers/${offerId}`);
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10 shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">INF Platform 2.0</h1>
              <p className="text-sm text-muted-foreground">Speed Recruiting - Internship Offers</p>
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    setUser(null);
                  }}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign Out
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:text-primary transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium shadow-soft hover:shadow-elegant transition-all"
                  >
                    <UserPlus className="w-4 h-4" />
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-foreground">Filter by:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'all'
                  ? 'bg-primary text-primary-foreground shadow-soft'
                  : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              All Offers
            </button>
            <button
              onClick={() => setFilter('Opérationnel')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'Opérationnel'
                  ? 'bg-success text-success-foreground shadow-soft'
                  : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              Opérationnel
            </button>
            <button
              onClick={() => setFilter('Administratif')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'Administratif'
                  ? 'bg-primary text-primary-foreground shadow-soft'
                  : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              Administratif
            </button>
          </div>
        </div>

        {/* Offers Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            <p className="mt-4 text-muted-foreground">Loading offers...</p>
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Offers Available</h3>
            <p className="text-muted-foreground">Check back later for new opportunities.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in">
            {filteredOffers.map((offer) => (
              <div
                key={offer.id}
                onClick={() => handleOfferClick(offer.id)}
                className="bg-card border border-border rounded-xl p-6 hover:border-primary hover:shadow-elegant transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    offer.interest_tag === 'Opérationnel'
                      ? 'bg-success/10 text-success'
                      : 'bg-primary/10 text-primary'
                  }`}>
                    {offer.interest_tag}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {offer.title}
                </h3>
                
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {offer.description}
                </p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="w-4 h-4" />
                    <span>{offer.companies?.company_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(offer.events?.date).toLocaleDateString()}</span>
                  </div>
                  {offer.events?.location && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{offer.events.location}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <span className="text-xs text-primary font-medium group-hover:underline">
                    View Details →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}