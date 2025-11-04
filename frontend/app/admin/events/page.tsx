'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Event = {
  id: string
  name: string
  date: string
  description: string | null
  interview_duration_minutes: number
  buffer_minutes: number
  slots_per_time: number
  created_at: string
}

export default function EventsManagement() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<Event[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    date: '',
    description: '',
    location: ''
  })

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

      await loadEvents()
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: false })

    if (!error && data) {
      setEvents(data)
    }
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data, error } = await supabase
        .from('events')
        .insert([formData])
        .select()
        .single()

      if (error) throw error

      setShowCreateForm(false)
      setFormData({
        name: '',
        date: '',
        description: '',
        location: ''
      })
      await loadEvents()
      alert('✅ Event created successfully! Now add Sessions to configure interview times.')
    } catch (err: any) {
      alert('Error creating event: ' + err.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Manage Events</h1>
              <p className="text-gray-600 mt-1">Create events and configure interview time slots</p>
            </div>
            <Link href="/admin" className="text-gray-600 hover:text-gray-900">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Create Event Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition font-medium"
          >
            {showCreateForm ? '✕ Cancel' : '+ Create New Event'}
          </button>
        </div>

        {/* Create Event Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Create New Event</h2>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Spring 2025 Career Fair"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location *
                </label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., University Main Hall, Building A"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Event description..."
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>📅 Next Steps:</strong> After creating the event, you'll configure:
                </p>
                <ul className="mt-2 ml-6 list-disc text-sm text-blue-700">
                  <li><strong>Phases</strong> - Set booking limits for Phase 1 and Phase 2</li>
                  <li><strong>Sessions</strong> - Create time blocks (e.g., Morning 9-12, Afternoon 2-5) with interview duration</li>
                  <li><strong>Participants</strong> - Invite companies (slots auto-generated!)</li>
                </ul>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-medium transition"
              >
                Create Event
              </button>
            </form>
          </div>
        )}

        {/* Events List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">All Events</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {events.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                No events yet. Create your first event to get started.
              </div>
            ) : (
              events.map(event => (
                <div key={event.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{event.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        📅 {new Date(event.date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                      {event.description && (
                        <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 ml-4">
                      <Link
                        href={`/admin/events/${event.id}/quick-invite`}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-md hover:from-blue-600 hover:to-blue-700 transition text-sm font-semibold shadow-sm"
                      >
                        ⚡ Quick Invite
                      </Link>
                      <Link
                        href={`/admin/events/${event.id}/phases`}
                        className="bg-blue-100 text-blue-700 px-4 py-2 rounded-md hover:bg-blue-200 transition text-sm font-medium"
                      >
                        📅 Phases
                      </Link>
                      <Link
                        href={`/admin/events/${event.id}/sessions`}
                        className="bg-purple-100 text-purple-700 px-4 py-2 rounded-md hover:bg-purple-200 transition text-sm font-medium"
                      >
                        🎯 Sessions
                      </Link>
                      <Link
                        href={`/admin/events/${event.id}/participants`}
                        className="bg-green-100 text-green-700 px-4 py-2 rounded-md hover:bg-green-200 transition text-sm font-medium"
                      >
                        🏢 Participants
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
