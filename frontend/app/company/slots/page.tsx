'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Slot = {
  id: string
  start_time: string
  end_time: string
  capacity: number
  location: string | null
  room_number: string | null
  is_active: boolean
  event: {
    name: string
    id: string
  }
  bookings_count: number
}

export default function CompanySlotsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string>('')

  useEffect(() => {
    loadSlots()
  }, [])

  const loadSlots = async () => {
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

      // Get all slots for this company
      const { data: slotsData, error: slotsError } = await supabase
        .from('event_slots')
        .select(`
          id,
          start_time,
          end_time,
          capacity,
          location,
          room_number,
          is_active,
          events!inner (
            name,
            id
          )
        `)
        .eq('company_id', company.id)
        .order('start_time', { ascending: true })

      if (slotsError) throw slotsError

      // Count bookings for each slot
      const slotsWithBookings = await Promise.all(
        (slotsData || []).map(async (slot: any) => {
          const { count } = await supabase
            .from('interview_bookings')
            .select('*', { count: 'exact', head: true })
            .eq('slot_id', slot.id)
            .eq('status', 'confirmed')

          return {
            id: slot.id,
            start_time: slot.start_time,
            end_time: slot.end_time,
            capacity: slot.capacity,
            location: slot.location,
            room_number: slot.room_number,
            is_active: slot.is_active,
            event: slot.events,
            bookings_count: count || 0
          }
        })
      )

      setSlots(slotsWithBookings)
    } catch (err) {
      console.error('Error loading slots:', err)
      alert('Error loading slots. Check console for details.')
    } finally {
      setLoading(false)
    }
  }

  const filteredSlots = selectedDate
    ? slots.filter(slot => slot.start_time.startsWith(selectedDate))
    : slots

  const totalSlots = slots.length
  const activeSlots = slots.filter(s => s.is_active).length
  const bookedSlots = slots.filter(s => s.bookings_count > 0).length
  const totalBookings = slots.reduce((sum, s) => sum + s.bookings_count, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading slots...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">My Interview Slots</h1>
              <p className="text-gray-600 mt-1">View all your available interview time slots</p>
            </div>
            <Link href="/company" className="text-gray-600 hover:text-gray-900">
              ← Dashboard
            </Link>
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-blue-600">{totalSlots}</div>
            <div className="text-sm text-gray-600">Total Slots</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-green-600">{activeSlots}</div>
            <div className="text-sm text-gray-600">Active Slots</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-purple-600">{bookedSlots}</div>
            <div className="text-sm text-gray-600">Slots with Bookings</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-orange-600">{totalBookings}</div>
            <div className="text-sm text-gray-600">Total Bookings</div>
          </div>
        </div>

        {/* Slots List */}
        {filteredSlots.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 mb-4">
              {selectedDate ? 'No slots for this date.' : 'No interview slots generated yet.'}
            </p>
            <div className="text-sm text-gray-400 space-y-2">
              <p>Slots are automatically generated when:</p>
              <ul className="list-disc list-inside">
                <li>Your company is approved for an event</li>
                <li>You create offers linked to that event</li>
                <li>Admin regenerates slots for the event</li>
              </ul>
            </div>
            <div className="mt-6 space-x-4">
              <Link 
                href="/company/events" 
                className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Browse Events
              </Link>
              <Link 
                href="/company/offers/new" 
                className="inline-block px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Create Offer
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSlots.map(slot => (
              <div 
                key={slot.id} 
                className={`bg-white rounded-lg shadow p-6 border-l-4 ${
                  !slot.is_active ? 'border-gray-400 opacity-60' :
                  slot.bookings_count >= slot.capacity ? 'border-green-500' :
                  slot.bookings_count > 0 ? 'border-yellow-500' :
                  'border-blue-500'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {new Date(slot.start_time).toLocaleString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                        {' - '}
                        {new Date(slot.end_time).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </h3>
                      {!slot.is_active && (
                        <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Event:</strong> {slot.event.name}</p>
                      {slot.location && <p><strong>Location:</strong> {slot.location}</p>}
                      {slot.room_number && <p><strong>Room:</strong> {slot.room_number}</p>}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">
                      {slot.bookings_count}/{slot.capacity}
                    </div>
                    <div className="text-sm text-gray-500">bookings</div>
                    {slot.bookings_count >= slot.capacity && (
                      <span className="mt-2 inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                        Full
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Capacity</span>
                    <span>{Math.round((slot.bookings_count / slot.capacity) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        slot.bookings_count >= slot.capacity ? 'bg-green-500' :
                        slot.bookings_count > 0 ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min((slot.bookings_count / slot.capacity) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
