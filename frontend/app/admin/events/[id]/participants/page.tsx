'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface Event {
  id: string;
  name: string;
  date: string;
}

interface Participant {
  id: string;
  company_id: string;
  invited_at: string;
  companies: {
    id: string;
    company_name: string;
    company_code: string;
    email?: string; // Email now directly from companies table
    industry: string;
    website?: string;
    profile_id?: string | null;
    hasLoggedIn?: boolean; // Computed: profile_id !== null
  };
}

export default function EventParticipantsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const supabase = createClient();
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  const [event, setEvent] = useState<Event | null>(null);
  const [eventName, setEventName] = useState<string>('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [eventId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load event details
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('id, name, date')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;
      setEvent(eventData);
      setEventName(eventData.name);

      // Load participants with company details INCLUDING EMAIL
      const { data: participantsData, error: participantsError } = await supabase
        .from('event_participants')
        .select(`
          id,
          company_id,
          invited_at,
          companies!inner (
            id,
            company_name,
            company_code,
            email,
            industry,
            website,
            profile_id
          )
        `)
        .eq('event_id', eventId)
        .order('invited_at', { ascending: false });

      if (participantsError) throw participantsError;

      // Add hasLoggedIn status (profile_id exists = logged in)
      const enrichedData = (participantsData || []).map((p: any) => ({
        ...p,
        companies: {
          ...p.companies,
          hasLoggedIn: p.companies.profile_id !== null
        }
      }));

      setParticipants(enrichedData as any);

    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load participants');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveParticipant = async (participantId: string, companyName: string) => {
    if (!confirm(`Remove ${companyName} from this event?\n\nThis will also delete all their interview slots.`)) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('event_participants')
        .delete()
        .eq('id', participantId);

      if (deleteError) throw deleteError;

      alert(`✅ Removed ${companyName} from event`);
      await loadData();

    } catch (err: any) {
      console.error('Error removing participant:', err);
      alert('Failed to remove participant: ' + err.message);
    }
  };

  const handleResendInvite = async (company: any) => {
    if (!company.email || company.email === 'No email') {
      alert('Cannot resend: No email found for this company');
      return;
    }

    if (confirm(`Resend invitation email to ${company.email}?`)) {
      try {
        // Generate new secure random password
        const array = new Uint8Array(24);
        crypto.getRandomValues(array);
        const hexPart = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
        const timestampPart = Date.now().toString(36);
        const tempPassword = hexPart + timestampPart;

        // Resend signup email
        const { error: signUpError } = await supabase.auth.signUp({
          email: company.email.toLowerCase(),
          password: tempPassword,
          options: {
            data: {
              company_name: company.company_name,
              company_code: company.company_code,
              role: 'company',
              event_name: eventName,
              event_id: eventId
            },
            emailRedirectTo: `${window.location.origin}/company`
          }
        });

        if (signUpError) {
          alert('Error resending email: ' + signUpError.message);
        } else {
          alert(`✅ Invitation email resent to ${company.email}`);
        }
      } catch (err: any) {
        alert('Failed to resend email: ' + err.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading participants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin/events" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Events
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Event Participants</h1>
              {event && (
                <p className="text-gray-600 mt-2">
                  {event.name} • {new Date(event.date).toLocaleDateString()}
                </p>
              )}
            </div>
            <Link
              href={`/admin/events/${eventId}/quick-invite`}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition font-semibold shadow-sm"
            >
              ⚡ Quick Invite Companies
            </Link>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Info Banner */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            ℹ️ <strong>Auto-generation enabled:</strong> When you invite a company via Quick Invite, 
            interview slots are automatically created for all active sessions in this event.
          </p>
        </div>

        {/* Participants List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Invited Companies ({participants.length})
            </h2>
          </div>

          {participants.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <p className="text-gray-500 text-lg mb-4">No companies invited yet</p>
              <Link
                href={`/admin/events/${eventId}/quick-invite`}
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                ⚡ Invite Your First Company
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Company</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Code</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Industry</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Invited At</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map(participant => {
                    if (!participant.companies) return null;
                    const company = participant.companies;
                    
                    return (
                    <tr key={participant.id} className="border-b hover:bg-gray-50 transition">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-semibold text-gray-900">{company.company_name}</p>
                          {company.website && (
                            <a 
                              href={company.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline"
                            >
                              {company.website}
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                          {company.company_code}
                        </code>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {company.email || 'No email'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {company.industry || '-'}
                      </td>
                      <td className="py-3 px-4">
                        {company.hasLoggedIn ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            ⏳ Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(participant.invited_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!company.hasLoggedIn && (
                            <button
                              onClick={() => handleResendInvite(company)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                              title="Resend invitation email"
                            >
                              📧 Resend
                            </button>
                          )}
                          <button
                            onClick={() => handleRemoveParticipant(participant.id, company.company_name)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        {participants.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Total Companies</p>
              <p className="text-2xl font-bold text-gray-900">{participants.length}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Industries Represented</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(participants.map(p => p.companies?.industry).filter(Boolean)).size}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Latest Invitation</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Date(participants[0]?.invited_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
