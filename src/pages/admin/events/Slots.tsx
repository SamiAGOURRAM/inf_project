import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { Calendar, Filter } from 'lucide-react'

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

type Company = {
  id: string
  company_name: string
}

export default function EventSlots() {
  const navigate = useNavigate()
  const { id: eventId } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(true)
  const [event, setEvent] = useState<Event | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  
  const [filterCompany, setFilterCompany] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    checkAdminAndLoad()
  }, [eventId])

  const checkAdminAndLoad = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'admin') {
        navigate('/offers')
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
    if (!eventId) return

    const { data: eventData } = await supabase
      .from('events')
      .select('id, name, date')
      .eq('id', eventId)
      .single()

    if (eventData) setEvent(eventData)

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
        .map((p: any) => p.companies)
        .filter((c: any, i: number, arr: any[]) => arr.findIndex((x: any) => x.id === c.id) === i)
      setCompanies(uniqueCompanies)
    }

    // Fetch slots without embedded relations
    const { data: slotsData, error: slotsError } = await supabase
      .from('event_slots')
      .select('id, start_time, end_time, capacity, company_id, session_id')
      .eq('event_id', eventId)
      .eq('is_active', true)
      .order('start_time')

    console.log('Slots data:', slotsData, 'Error:', slotsError)

    if (slotsData && slotsData.length > 0) {
      // Get unique company IDs
      const companyIds = [...new Set(slotsData.map(s => s.company_id))]
      const { data: companiesData } = await supabase
        .from('companies')
        .select('id, company_name, company_code')
        .in('id', companyIds)

      const companiesMap = new Map(companiesData?.map(c => [c.id, c]) || [])

      // Get unique session IDs
      const sessionIds = [...new Set(slotsData.map(s => s.session_id).filter(Boolean))]
      let sessionsMap = new Map()
      
      if (sessionIds.length > 0) {
        const { data: sessionsData } = await supabase
          .from('speed_recruiting_sessions')
          .select('id, name')
          .in('id', sessionIds)
        
        sessionsMap = new Map(sessionsData?.map(s => [s.id, s]) || [])
      }

      const slotsWithCounts = await Promise.all(
        slotsData.map(async (slot: any) => {
          const { count } = await supabase
            .from('interview_bookings')
            .select('*', { count: 'exact', head: true })
            .eq('slot_id', slot.id)
            .eq('status', 'confirmed')

          return {
            ...slot,
            companies: companiesMap.get(slot.company_id) || { company_name: 'Unknown', company_code: 'N/A' },
            speed_recruiting_sessions: slot.session_id ? sessionsMap.get(slot.session_id) : null,
            bookings_count: count || 0
          }
        })
      )

      setSlots(slotsWithCounts as any)
    } else {
      setSlots([])
    }
  }

  const filteredSlots = slots.filter(slot => {
    if (filterCompany !== 'all' && slot.company_id !== filterCompany) return false
    if (filterStatus === 'available' && slot.bookings_count >= slot.capacity) return false
    if (filterStatus === 'full' && slot.bookings_count < slot.capacity) return false
    return true
  })

  // Group slots by time
  const slotsByTime = filteredSlots.reduce((acc, slot) => {
    const timeKey = `${slot.start_time}-${slot.end_time}`
    if (!acc[timeKey]) {
      acc[timeKey] = {
        start_time: slot.start_time,
        end_time: slot.end_time,
        slots: []
      }
    }
    acc[timeKey].slots.push(slot)
    return acc
  }, {} as Record<string, { start_time: string; end_time: string; slots: Slot[] }>)

  const timeSlots = Object.values(slotsByTime).sort((a, b) => 
    new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  )

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
      <header className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link to="/admin/events" className="text-sm text-primary hover:underline mb-2 inline-block">
            ← Back to Events
          </Link>
          <h1 className="text-2xl font-bold">{event.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">Interview Slots</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-card rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Total Slots</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Available</p>
            <p className="text-2xl font-bold text-success">{stats.available}</p>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Full</p>
            <p className="text-2xl font-bold text-destructive">{stats.full}</p>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Bookings</p>
            <p className="text-2xl font-bold text-primary">{stats.totalBookings}</p>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Fill Rate</p>
            <p className="text-2xl font-bold">
              {stats.totalCapacity > 0 ? Math.round((stats.totalBookings / stats.totalCapacity) * 100) : 0}%
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-lg border p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Filters</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Company</label>
              <select
                value={filterCompany}
                onChange={(e) => setFilterCompany(e.target.value)}
                className="w-full px-3 py-2 bg-background border rounded-md"
              >
                <option value="all">All Companies</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>{company.company_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Availability</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 bg-background border rounded-md"
              >
                <option value="all">All Slots</option>
                <option value="available">Available Only</option>
                <option value="full">Full Only</option>
              </select>
            </div>
          </div>

          {(filterCompany !== 'all' || filterStatus !== 'all') && (
            <button
              onClick={() => {
                setFilterCompany('all')
                setFilterStatus('all')
              }}
              className="mt-4 text-sm text-primary hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Schedule View */}
        <div className="bg-card rounded-lg border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold">
              Interview Schedule ({filteredSlots.length} slots)
            </h3>
          </div>

          {timeSlots.length === 0 ? (
            <div className="px-6 py-12 text-center text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No slots found matching your filters.</p>
            </div>
          ) : (
            <div className="divide-y">
              {timeSlots.map((timeSlot, idx) => (
                <div key={idx} className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-lg font-semibold text-primary">
                      {new Date(timeSlot.start_time).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      {' - '}
                      {new Date(timeSlot.end_time).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      ({timeSlot.slots.length} {timeSlot.slots.length === 1 ? 'slot' : 'slots'})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {timeSlot.slots.map(slot => (
                      <div 
                        key={slot.id} 
                        className={`p-4 rounded-lg border ${
                          slot.bookings_count >= slot.capacity 
                            ? 'bg-destructive/5 border-destructive/20' 
                            : 'bg-success/5 border-success/20'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {slot.companies?.company_name || 'Unknown Company'}
                            </p>
                            {slot.companies?.company_code && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {slot.companies.company_code}
                              </p>
                            )}
                          </div>
                          {slot.bookings_count >= slot.capacity ? (
                            <span className="px-2 py-1 bg-destructive/20 text-destructive text-xs rounded-full font-medium">
                              Full
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-success/20 text-success text-xs rounded-full font-medium">
                              {slot.capacity - slot.bookings_count} left
                            </span>
                          )}
                        </div>
                        
                        {slot.speed_recruiting_sessions?.name && (
                          <p className="text-xs text-muted-foreground mb-2">
                            {slot.speed_recruiting_sessions.name}
                          </p>
                        )}

                        <div className="text-xs text-muted-foreground">
                          {slot.bookings_count} / {slot.capacity} booked
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
