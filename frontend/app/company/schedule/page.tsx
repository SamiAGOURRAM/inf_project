'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type TimeSlot = {
  id: string
  start_time: string
  end_time: string
  capacity: number
  event_id: string
  location: string | null
  room_number: string | null
  bookings: Booking[]
}

type Booking = {
  id: string
  student_id: string
  offer_id: string
  status: string
  student: {
    full_name: string
    email: string
    phone: string | null
    student_number: string | null
    specialization: string | null
    graduation_year: number | null
    cv_url: string | null
  }
  offer: {
    title: string
  }
}

export default function SchedulePage() {
  const router = useRouter()
  const supabase = createClient()
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [notes, setNotes] = useState<{ [bookingId: string]: string }>({})

  useEffect(() => {
    loadSchedule()
  }, [])

  const loadSchedule = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('profile_id', user.id)
        .single()

      if (!company) throw new Error('Company not found')

      // Get all bookings for this company's offers
      const { data: bookings, error: bookingsError } = await supabase
        .from('interview_bookings')
        .select(`
          id,
          slot_id,
          student_id,
          offer_id,
          status,
          notes,
          event_slots!inner (
            id,
            start_time,
            end_time,
            capacity,
            event_id,
            location,
            room_number,
            company_id
          ),
          profiles!interview_bookings_student_id_fkey (
            full_name,
            email,
            phone,
            student_number,
            specialization,
            graduation_year,
            cv_url
          ),
          offers!inner (
            title,
            company_id
          )
        `)
        .eq('event_slots.company_id', company.id)
        .eq('status', 'confirmed')
        .order('event_slots(start_time)', { ascending: true })

      if (bookingsError) throw bookingsError

      // Group bookings by slot
      const slotsMap = new Map<string, TimeSlot>()
      
      bookings?.forEach((booking: any) => {
        const slotId = booking.event_slots.id
        const slotStartTime = booking.event_slots.start_time
        const slotEndTime = booking.event_slots.end_time
        
        if (!slotsMap.has(slotId)) {
          slotsMap.set(slotId, {
            id: slotId,
            start_time: slotStartTime,
            end_time: slotEndTime,
            capacity: booking.event_slots.capacity,
            event_id: booking.event_slots.event_id,
            location: booking.event_slots.location,
            room_number: booking.event_slots.room_number,
            bookings: []
          })
        }
        
        slotsMap.get(slotId)!.bookings.push({
          id: booking.id,
          student_id: booking.student_id,
          offer_id: booking.offer_id,
          status: booking.status,
          student: booking.profiles,
          offer: booking.offers
        })

        // Load existing notes
        if (booking.notes) {
          setNotes(prev => ({ ...prev, [booking.id]: booking.notes }))
        }
      })

      setSlots(Array.from(slotsMap.values()))
    } catch (err) {
      console.error('Error loading schedule:', err)
    } finally {
      setLoading(false)
    }
  }

  const saveNotes = async (bookingId: string, noteText: string) => {
    try {
      const { error } = await supabase
        .from('interview_bookings')
        .update({ notes: noteText })
        .eq('id', bookingId)

      if (error) throw error
    } catch (err) {
      console.error('Error saving notes:', err)
      alert('Failed to save notes')
    }
  }

  const exportSchedule = () => {
    let csv = 'Time Slot,Location,Room,Student Name,Email,Phone,Student Number,Specialization,Graduation Year,Offer,Notes\n'
    
    slots.forEach(slot => {
      const time = new Date(slot.start_time).toLocaleString()
      const location = slot.location || 'TBD'
      const room = slot.room_number || 'TBD'
      slot.bookings.forEach(booking => {
        csv += `"${time}","${location}","${room}","${booking.student.full_name}","${booking.student.email}","${booking.student.phone || ''}","${booking.student.student_number || ''}","${booking.student.specialization || ''}","${booking.student.graduation_year || ''}","${booking.offer.title}","${notes[booking.id] || ''}"\n`
      })
    })

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `interview-schedule-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const filteredSlots = selectedDate
    ? slots.filter(slot => slot.start_time.startsWith(selectedDate))
    : slots

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading schedule...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Interview Schedule</h1>
              <p className="text-gray-600 mt-1">View your upcoming interviews and student profiles</p>
            </div>
            <div className="flex gap-3">
              <Link href="/company" className="text-gray-600 hover:text-gray-900">
                ← Dashboard
              </Link>
              <button
                onClick={exportSchedule}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
              >
                📥 Export CSV
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Date Filter */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
          {selectedDate && (
            <button
              onClick={() => setSelectedDate('')}
              className="ml-3 text-sm text-blue-600 hover:text-blue-800"
            >
              Clear filter
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-blue-600">{slots.length}</div>
            <div className="text-sm text-gray-600">Total Time Slots</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-green-600">
              {slots.reduce((sum, slot) => sum + slot.bookings.length, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Interviews</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-purple-600">
              {new Set(slots.flatMap(s => s.bookings.map(b => b.student_id))).size}
            </div>
            <div className="text-sm text-gray-600">Unique Students</div>
          </div>
        </div>

        {/* Schedule - Grouped by Session */}
        {filteredSlots.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 mb-4">
              {selectedDate ? 'Aucune entrevue prévue pour cette date.' : 'Aucune entrevue prévue.'}
            </p>
            <p className="text-sm text-gray-400">
              Les étudiants apparaîtront ici une fois qu'ils réserveront des entrevues.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(slotsBySession).map(([sessionKey, { session, slots }]) => (
              <div key={sessionKey} className="bg-white rounded-lg shadow overflow-hidden">
                {/* Session Header */}
                {session ? (
                  <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4">
                    <h2 className="text-2xl font-bold">{session.name}</h2>
                    <p className="text-purple-100 mt-1">
                      {formatTime(session.start_time)} - {formatTime(session.end_time)}
                      {' • '}
                      {slots.reduce((sum, s) => sum + s.bookings.length, 0)} entrevue(s)
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-600 text-white px-6 py-4">
                    <h2 className="text-2xl font-bold">Hors session</h2>
                    <p className="text-gray-100 mt-1">
                      {slots.reduce((sum, s) => sum + s.bookings.length, 0)} entrevue(s)
                    </p>
                  </div>
                )}

                {/* Slots in this session */}
                <div className="p-6 space-y-6">
                  {slots.map(slot => (
                    <div key={slot.id} className="border-l-4 border-blue-500 pl-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                        </h3>
                        <div className="text-sm text-gray-600">
                          {slot.location && `${slot.location}`}
                          {slot.room_number && ` • Salle ${slot.room_number}`}
                        </div>
                      </div>

                      {slot.bookings.length === 0 ? (
                        <p className="text-gray-400 text-sm">Aucune réservation</p>
                      ) : (
                        <div className="space-y-4">
                          {slot.bookings.map(booking => (
                            <div key={booking.id} className="bg-gray-50 rounded-lg p-4 hover:bg-blue-50 transition">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h4 className="text-lg font-semibold text-gray-900">
                                    {booking.student.full_name}
                                  </h4>
                                  <p className="text-sm text-gray-600 mt-1">
                                    Offre: <span className="font-medium">{booking.offer.title}</span>
                                  </p>
                                </div>
                                {booking.student.cv_url && (
                                  <a
                                    href={booking.student.cv_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition text-sm font-medium"
                                  >
                                    📄 CV
                                  </a>
                                )}
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
                                <div>
                                  <span className="text-gray-500">Email:</span>
                                  <p className="font-medium">{booking.student.email}</p>
                                </div>
                                {booking.student.phone && (
                                  <div>
                                    <span className="text-gray-500">Téléphone:</span>
                                    <p className="font-medium">{booking.student.phone}</p>
                                  </div>
                                )}
                                {booking.student.student_number && (
                                  <div>
                                    <span className="text-gray-500">Matricule:</span>
                                    <p className="font-medium">{booking.student.student_number}</p>
                                  </div>
                                )}
                                {booking.student.specialization && (
                                  <div>
                                    <span className="text-gray-500">Spécialisation:</span>
                                    <p className="font-medium">{booking.student.specialization}</p>
                                  </div>
                                )}
                                {booking.student.graduation_year && (
                                  <div>
                                    <span className="text-gray-500">Graduation:</span>
                                    <p className="font-medium">{booking.student.graduation_year}</p>
                                  </div>
                                )}
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Notes d'entrevue
                                </label>
                                <textarea
                                  value={notes[booking.id] || ''}
                                  onChange={(e) => setNotes({ ...notes, [booking.id]: e.target.value })}
                                  onBlur={(e) => saveNotes(booking.id, e.target.value)}
                                  placeholder="Ajoutez des notes pendant ou après l'entrevue..."
                                  rows={2}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
