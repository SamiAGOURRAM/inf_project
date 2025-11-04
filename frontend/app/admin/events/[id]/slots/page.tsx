'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Filter, Users, Building2 } from 'lucide-react'

type Slot = {
  id: string
  start_time: string
  end_time: string
  capacity: number
  company_id: string
  session_id: string
  companies: {
    company_name: string
    company_code: string
  }
  speed_recruiting_sessions: {
    name: string
  }
  bookings_count: number
}

type Event = {
  id: string
  name: string
  date: string
}

type Session = {
  id: string
  name: string
}

type Company = {
  id: string
  company_name: string
}

export default function EventSlotsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const supabase = createClient()
  const resolvedParams = use(params)
  const eventId = resolvedParams.id

  const [loading, setLoading] = useState(true)
  const [event, setEvent] = useState<Event | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  
  const [filterSession, setFilterSession] = useState<string>('all')
  const [filterCompany, setFilterCompany] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    checkAdminAndLoad()
  }, [eventId])

  const checkAdminAndLoad = async () => {
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

      await loadData()
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadData = async () => {
    // Load event
    const { data: eventData } = await supabase
      .from('events')
      .select('id, name, date')
      .eq('id', eventId)
      .single()

    if (eventData) setEvent(eventData)

    // Load sessions
    const { data: sessionsData } = await supabase
      .from('speed_recruiting_sessions')
      .select('id, name')
      .eq('event_id', eventId)
      .order('start_time')

    if (sessionsData) setSessions(sessionsData)

    // Load companies (participants)
    const { data: participantsData } = await supabase
      .from('event_participants')
      .select(`
        companies!inner (
          id,
          company_name
        )
      `)
      .eq('event_id', eventId)

    if (participantsData) {
      const uniqueCompanies = participantsData
        .map(p => p.companies)
        .filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i)
      setCompanies(uniqueCompanies as any)
    }

    // Load slots with bookings count
    const { data: slotsData } = await supabase
      .from('event_slots')
      .select(`
        id,
        start_time,
        end_time,
        capacity,
        company_id,
        session_id,
        companies!inner (
          company_name,
          company_code
        ),
        speed_recruiting_sessions!inner (
          name
        )
      `)
      .eq('event_id', eventId)
      .order('start_time')

    if (slotsData) {
      // Get booking counts for each slot
      const slotsWithCounts = await Promise.all(
        slotsData.map(async (slot) => {
          const { count } = await supabase
            .from('interview_bookings')
            .select('*', { count: 'exact', head: true })
            .eq('slot_id', slot.id)
            .eq('status', 'confirmed')

          return {
            ...slot,
            bookings_count: count || 0
          }
        })
      )

      setSlots(slotsWithCounts as any)
    }
  }

  const filteredSlots = slots.filter(slot => {
    if (filterSession !== 'all' && slot.session_id !== filterSession) return false
    if (filterCompany !== 'all' && slot.company_id !== filterCompany) return false
    if (filterStatus === 'available' && slot.bookings_count >= slot.capacity) return false
    if (filterStatus === 'full' && slot.bookings_count < slot.capacity) return false
    return true
  })

  const stats = {
    total: slots.length,
    available: slots.filter(s => s.bookings_count < s.capacity).length,
    full: slots.filter(s => s.bookings_count >= s.capacity).length,
    totalBookings: slots.reduce((sum, s) => sum + s.bookings_count, 0),
    totalCapacity: slots.reduce((sum, s) => sum + s.capacity, 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading slots...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-destructive">Event not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/admin/events" className="text-sm text-primary hover:underline mb-2 inline-block">
            ← Back to Events
          </Link>
          <h1 className="text-2xl font-bold text-foreground">{event.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">Interview Slots</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Total Slots</p>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Available</p>
            <p className="text-2xl font-bold text-success">{stats.available}</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Full</p>
            <p className="text-2xl font-bold text-destructive">{stats.full}</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Bookings</p>
            <p className="text-2xl font-bold text-primary">{stats.totalBookings}</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Fill Rate</p>
            <p className="text-2xl font-bold text-foreground">
              {stats.totalCapacity > 0 ? Math.round((stats.totalBookings / stats.totalCapacity) * 100) : 0}%
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-lg border border-border p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Filters</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Session</label>
              <select
                value={filterSession}
                onChange={(e) => setFilterSession(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground"
              >
                <option value="all">All Sessions</option>
                {sessions.map(session => (
                  <option key={session.id} value={session.id}>{session.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Company</label>
              <select
                value={filterCompany}
                onChange={(e) => setFilterCompany(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground"
              >
                <option value="all">All Companies</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>{company.company_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Availability</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground"
              >
                <option value="all">All Slots</option>
                <option value="available">Available Only</option>
                <option value="full">Full Only</option>
              </select>
            </div>
          </div>

          {(filterSession !== 'all' || filterCompany !== 'all' || filterStatus !== 'all') && (
            <button
              onClick={() => {
                setFilterSession('all')
                setFilterCompany('all')
                setFilterStatus('all')
              }}
              className="mt-4 text-sm text-primary hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Slots Table */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">
              Interview Slots ({filteredSlots.length})
            </h3>
          </div>

          {filteredSlots.length === 0 ? (
            <div className="px-6 py-12 text-center text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No slots found matching your filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Time</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Session</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Company</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">Bookings</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSlots.map(slot => (
                    <tr key={slot.id} className="border-b hover:bg-muted/50 transition">
                      <td className="py-3 px-4 text-sm text-foreground">
                        {new Date(slot.start_time).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                        {' - '}
                        {new Date(slot.end_time).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground">
                        {slot.speed_recruiting_sessions.name}
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {slot.companies.company_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {slot.companies.company_code}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-sm font-medium text-foreground">
                          {slot.bookings_count} / {slot.capacity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {slot.bookings_count >= slot.capacity ? (
                          <span className="px-2 py-1 bg-destructive/10 text-destructive text-xs rounded-full font-medium">
                            Full
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-success/10 text-success text-xs rounded-full font-medium">
                            Available
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
