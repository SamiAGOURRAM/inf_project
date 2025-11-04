'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, TrendingUp, Users } from 'lucide-react'

type CompanyStats = {
  id: string
  company_name: string
  company_code: string
  email: string | null
  industry: string | null
  website: string | null
  total_slots: number
  booked_slots: number
  unique_students: number
}

type Event = {
  id: string
  name: string
  date: string
}

export default function EventCompaniesPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const supabase = createClient()
  const resolvedParams = use(params)
  const eventId = resolvedParams.id

  const [loading, setLoading] = useState(true)
  const [event, setEvent] = useState<Event | null>(null)
  const [companies, setCompanies] = useState<CompanyStats[]>([])

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

    // Load companies with stats
    const { data: participantsData } = await supabase
      .from('event_participants')
      .select(`
        company_id,
        companies!inner (
          id,
          company_name,
          company_code,
          email,
          industry,
          website
        )
      `)
      .eq('event_id', eventId)

    if (participantsData) {
      const companiesWithStats = await Promise.all(
        participantsData.map(async (p) => {
          const company = p.companies

          // Get total slots
          const { count: totalSlots } = await supabase
            .from('event_slots')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', eventId)
            .eq('company_id', company.id)

          // Get booked slots
          const { data: bookedSlotsData } = await supabase
            .from('event_slots')
            .select(`
              id,
              interview_bookings!inner (
                id,
                student_id
              )
            `)
            .eq('event_id', eventId)
            .eq('company_id', company.id)

          const bookedSlots = bookedSlotsData?.length || 0
          
          // Get unique students
          const uniqueStudents = new Set(
            bookedSlotsData?.flatMap(slot => 
              slot.interview_bookings.map(b => b.student_id)
            ) || []
          ).size

          return {
            ...company,
            total_slots: totalSlots || 0,
            booked_slots: bookedSlots,
            unique_students: uniqueStudents
          }
        })
      )

      setCompanies(companiesWithStats as any)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading companies...</p>
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

  const totalStats = {
    companies: companies.length,
    totalSlots: companies.reduce((sum, c) => sum + c.total_slots, 0),
    bookedSlots: companies.reduce((sum, c) => sum + c.booked_slots, 0),
    avgBookingRate: companies.length > 0
      ? Math.round(
          (companies.reduce((sum, c) => sum + (c.total_slots > 0 ? (c.booked_slots / c.total_slots) * 100 : 0), 0) /
            companies.length)
        )
      : 0
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/admin/events" className="text-sm text-primary hover:underline mb-2 inline-block">
            ← Back to Events
          </Link>
          <h1 className="text-2xl font-bold text-foreground">{event.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">Company Analytics</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Companies</p>
            <p className="text-2xl font-bold text-foreground">{totalStats.companies}</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Total Slots</p>
            <p className="text-2xl font-bold text-foreground">{totalStats.totalSlots}</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Booked Slots</p>
            <p className="text-2xl font-bold text-primary">{totalStats.bookedSlots}</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Avg Booking Rate</p>
            <p className="text-2xl font-bold text-success">{totalStats.avgBookingRate}%</p>
          </div>
        </div>

        {/* Companies List */}
        <div className="bg-card rounded-lg border border-border">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">
              Companies ({companies.length})
            </h3>
          </div>

          {companies.length === 0 ? (
            <div className="px-6 py-12 text-center text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No companies invited yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {companies.map(company => {
                const bookingRate = company.total_slots > 0
                  ? Math.round((company.booked_slots / company.total_slots) * 100)
                  : 0

                return (
                  <Link
                    key={company.id}
                    href={`/admin/events/${eventId}/companies/${company.id}`}
                    className="block px-6 py-4 hover:bg-muted/50 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="text-lg font-semibold text-foreground">
                            {company.company_name}
                          </h4>
                          <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded font-mono">
                            {company.company_code}
                          </span>
                        </div>
                        
                        {company.industry && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {company.industry}
                          </p>
                        )}

                        <div className="mt-3 grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Interview Slots</p>
                            <p className="text-sm font-medium text-foreground">
                              {company.booked_slots} / {company.total_slots}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Booking Rate</p>
                            <p className="text-sm font-medium text-foreground">
                              {bookingRate}%
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Students Met</p>
                            <p className="text-sm font-medium text-foreground flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {company.unique_students}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="ml-4">
                        <TrendingUp className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
