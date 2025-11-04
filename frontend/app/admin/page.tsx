'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type DashboardStats = {
  total_events: number
  upcoming_events: number
  total_companies: number
  total_participants: number
  total_bookings: number
  total_students: number
  total_sessions: number
}

type EventSummary = {
  id: string
  name: string
  date: string
  location: string
  total_participants: number
  total_sessions: number
  total_slots: number
  booked_slots: number
  booking_rate: number
}

type RecentActivity = {
  id: string
  type: 'company_registered' | 'registration_pending' | 'booking_created'
  description: string
  created_at: string
  status?: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [upcomingEvents, setUpcomingEvents] = useState<EventSummary[]>([])

  useEffect(() => {
    checkAdminAndLoadData()
  }, [])

  const checkAdminAndLoadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'admin') {
        router.push('/offers')
        return
      }

      await loadDashboardData()
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadDashboardData = async () => {
    const today = new Date().toISOString()

    // Load comprehensive stats
    const [
      { count: totalEvents },
      { count: upcomingEventsCount },
      { count: totalCompanies },
      { count: totalParticipants },
      { count: totalBookings },
      { count: totalStudents },
      { count: totalSessions }
    ] = await Promise.all([
      supabase.from('events').select('*', { count: 'exact', head: true }),
      supabase.from('events').select('*', { count: 'exact', head: true }).gte('date', today),
      supabase.from('companies').select('*', { count: 'exact', head: true }),
      supabase.from('event_participants').select('*', { count: 'exact', head: true }),
      supabase.from('interview_bookings').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
      supabase.from('speed_recruiting_sessions').select('*', { count: 'exact', head: true })
    ])

    setStats({
      total_events: totalEvents || 0,
      upcoming_events: upcomingEventsCount || 0,
      total_companies: totalCompanies || 0,
      total_participants: totalParticipants || 0,
      total_bookings: totalBookings || 0,
      total_students: totalStudents || 0,
      total_sessions: totalSessions || 0
    })

    // Load upcoming events with participant and session stats
    const { data: eventsData } = await supabase
      .from('events')
      .select('*')
      .gte('date', today)
      .order('date', { ascending: true })
      .limit(5)

    if (eventsData) {
      const eventsWithStats = await Promise.all(
        eventsData.map(async (event) => {
          const [
            { count: totalParticipants },
            { count: totalSessions },
            { count: totalSlots },
            { count: bookedSlots }
          ] = await Promise.all([
            supabase.from('event_participants').select('*', { count: 'exact', head: true }).eq('event_id', event.id),
            supabase.from('speed_recruiting_sessions').select('*', { count: 'exact', head: true }).eq('event_id', event.id),
            supabase.from('event_slots').select('*', { count: 'exact', head: true }).eq('event_id', event.id).eq('is_active', true),
            supabase.from('interview_bookings')
              .select('slot_id', { count: 'exact', head: true })
              .eq('status', 'confirmed')
              .in('slot_id', 
                (await supabase.from('event_slots').select('id').eq('event_id', event.id).eq('is_active', true)).data?.map(s => s.id) || []
              )
          ])

          const bookingRate = (totalSlots && totalSlots > 0) ? Math.round((bookedSlots || 0) / totalSlots * 100) : 0

          return {
            id: event.id,
            name: event.name,
            date: event.date,
            location: event.location,
            total_participants: totalParticipants || 0,
            total_sessions: totalSessions || 0,
            total_slots: totalSlots || 0,
            booked_slots: bookedSlots || 0,
            booking_rate: bookingRate
          }
        })
      )
      setUpcomingEvents(eventsWithStats)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Welcome back, Admin</p>
            </div>
            <button
              onClick={async () => {
                await supabase.auth.signOut()
                router.push('/')
              }}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Events Metric */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <Link href="/admin/events" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                Manage →
              </Link>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.upcoming_events || 0}</p>
              <p className="text-sm text-gray-600 mt-1">Upcoming Events</p>
              <p className="text-xs text-gray-500 mt-2">{stats?.total_events || 0} total events</p>
            </div>
          </div>

          {/* Companies Metric */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <Link href="/admin/companies" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                View →
              </Link>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.total_companies || 0}</p>
              <p className="text-sm text-gray-600 mt-1">Total Companies</p>
              <p className="text-xs text-gray-500 mt-2">{stats?.total_participants || 0} event participants</p>
            </div>
          </div>

          {/* Sessions Metric */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.total_sessions || 0}</p>
              <p className="text-sm text-gray-600 mt-1">Active Sessions</p>
            </div>
          </div>

          {/* Bookings Metric */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.total_bookings || 0}</p>
              <p className="text-sm text-gray-600 mt-1">Total Interviews</p>
              <p className="text-xs text-gray-500 mt-2">{stats?.total_students || 0} students registered</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Events */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>
              <Link href="/admin/events" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                View all
              </Link>
            </div>
            <div className="p-6">
              {upcomingEvents.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600">No upcoming events</p>
                  <Link href="/admin/events" className="mt-4 inline-block text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                    Create your first event →
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingEvents.map((event) => (
                    <Link
                      key={event.id}
                      href={`/admin/events/${event.id}/participants`}
                      className="block p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{event.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {new Date(event.date).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              month: 'long', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                          {event.location && (
                            <p className="text-xs text-gray-500 mt-1">📍 {event.location}</p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-gray-100">
                        <div>
                          <p className="text-xs text-gray-500">Participants</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {event.total_participants}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Sessions</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {event.total_sessions}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Interviews</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {event.booked_slots}/{event.total_slots}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
