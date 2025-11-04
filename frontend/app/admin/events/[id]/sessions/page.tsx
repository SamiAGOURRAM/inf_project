'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

type Session = {
  id: string
  name: string
  start_time: string
  end_time: string
  interview_duration_minutes: number
  buffer_minutes: number
  slots_per_time: number
  is_active: boolean
}

type Event = {
  id: string
  name: string
  date: string
}

export default function SessionManagement() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const eventId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [event, setEvent] = useState<Event | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingSession, setEditingSession] = useState<Session | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    start_time: '',
    end_time: '',
    interview_duration_minutes: 15,
    buffer_minutes: 5,
    slots_per_time: 2
  })

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
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (eventError) {
      console.error('Error loading event:', eventError)
      alert('Event not found')
      router.push('/admin/events')
      return
    }

    setEvent(eventData)

    // Load sessions
    const { data: sessionsData, error: sessionsError } = await supabase
      .from('speed_recruiting_sessions')
      .select('*')
      .eq('event_id', eventId)
      .order('start_time', { ascending: true })

    if (sessionsError) {
      console.error('Error loading sessions:', sessionsError)
    } else {
      setSessions(sessionsData || [])
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      start_time: '',
      end_time: '',
      interview_duration_minutes: 15,
      buffer_minutes: 5,
      slots_per_time: 2
    })
    setEditingSession(null)
    setShowAddForm(false)
  }

  const handleEdit = (session: Session) => {
    setFormData({
      name: session.name,
      start_time: session.start_time.substring(0, 16),
      end_time: session.end_time.substring(0, 16),
      interview_duration_minutes: session.interview_duration_minutes,
      buffer_minutes: session.buffer_minutes,
      slots_per_time: session.slots_per_time
    })
    setEditingSession(session)
    setShowAddForm(true)
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      // Validation
      if (!formData.name.trim()) {
        alert('Session name is required')
        return
      }

      if (new Date(formData.start_time) >= new Date(formData.end_time)) {
        alert('Start time must be before end time')
        return
      }

      if (formData.interview_duration_minutes <= 0) {
        alert('Interview duration must be greater than 0')
        return
      }

      if (formData.buffer_minutes < 0) {
        alert('Buffer cannot be negative')
        return
      }

      if (formData.slots_per_time <= 0) {
        alert('Capacity must be greater than 0')
        return
      }

      if (editingSession) {
        // Update existing session
        const { error } = await supabase
          .from('speed_recruiting_sessions')
          .update({
            name: formData.name,
            start_time: formData.start_time,
            end_time: formData.end_time,
            interview_duration_minutes: formData.interview_duration_minutes,
            buffer_minutes: formData.buffer_minutes,
            slots_per_time: formData.slots_per_time
          })
          .eq('id', editingSession.id)

        if (error) throw error
        alert('Session updated successfully!')
      } else {
        // Create new session
        const { error } = await supabase
          .from('speed_recruiting_sessions')
          .insert({
            event_id: eventId,
            name: formData.name,
            start_time: formData.start_time,
            end_time: formData.end_time,
            interview_duration_minutes: formData.interview_duration_minutes,
            buffer_minutes: formData.buffer_minutes,
            slots_per_time: formData.slots_per_time,
            is_active: true
          })

        if (error) throw error
        alert('Session created successfully!')
      }

      resetForm()
      await loadData()
    } catch (err) {
      console.error('Error saving:', err)
      alert('Error saving session')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (sessionId: string, sessionName: string) => {
    if (!confirm(`Delete session "${sessionName}"? This will also delete all associated interview slots.`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('speed_recruiting_sessions')
        .delete()
        .eq('id', sessionId)

      if (error) throw error

      alert('Session deleted successfully!')
      await loadData()
    } catch (err) {
      console.error('Error deleting:', err)
      alert('Error deleting session')
    }
  }

  const handleRegenerateSlots = async () => {
    if (!confirm('Regenerate all interview slots for all sessions? This will delete existing slots and create new ones based on current session configuration and registered companies.')) {
      return
    }

    try {
      setSaving(true)

      const { data, error } = await supabase.rpc('fn_regenerate_session_slots', {
        p_event_id: eventId
      })

      if (error) throw error

      alert(`Slots regenerated successfully!\n\n${data?.map((s: any) => 
        `${s.session_name}: ${s.company_count} companies × ${s.slots_per_company} slots = ${s.total_slots} total`
      ).join('\n') || 'No sessions found'}`)

      await loadData()
    } catch (err) {
      console.error('Error regenerating slots:', err)
      alert('Error regenerating slots')
    } finally {
      setSaving(false)
    }
  }

  const calculateSlotCount = (session: Session) => {
    const start = new Date(session.start_time)
    const end = new Date(session.end_time)
    const durationMs = (session.interview_duration_minutes + session.buffer_minutes) * 60 * 1000
    const totalMs = end.getTime() - start.getTime()
    return Math.floor(totalMs / durationMs)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Event not found</p>
          <Link href="/admin/events" className="mt-4 text-indigo-600 hover:text-indigo-700">
            Back to Events
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/admin/events" className="text-sm text-indigo-600 hover:text-indigo-700 mb-2 inline-block">
                ← Back to Events
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
              <p className="text-sm text-gray-600 mt-1">Speed Recruiting Sessions</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Sessions Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Sessions ({sessions.length})</h2>
              <p className="text-sm text-gray-600 mt-1">
                Define time blocks for speed recruiting interviews
              </p>
            </div>
            <div className="flex space-x-3">
              {sessions.length > 0 && (
                <button
                  onClick={handleRegenerateSlots}
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  🔄 Regenerate Slots
                </button>
              )}
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                + Add Session
              </button>
            </div>
          </div>

          {/* Sessions List */}
          {sessions.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No sessions yet</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating your first speed recruiting session.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session.id} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold text-gray-900">{session.name}</h3>
                        {!session.is_active && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Inactive</span>
                        )}
                      </div>
                      <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Time Range</p>
                          <p className="font-medium">
                            {new Date(session.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            {' - '}
                            {new Date(session.end_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Interview Duration</p>
                          <p className="font-medium">{session.interview_duration_minutes} min</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Buffer Time</p>
                          <p className="font-medium">{session.buffer_minutes} min</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Capacity</p>
                          <p className="font-medium">{session.slots_per_time} students/slot</p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center space-x-4 text-sm text-gray-600">
                        <span>
                          📊 ~{calculateSlotCount(session)} slots per company
                        </span>
                        <span>
                          ⏱️ Total: {Math.floor((new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / 60000)} minutes
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleEdit(session)}
                        className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(session.id, session.name)}
                        className="px-3 py-1 text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingSession ? 'Edit Session' : 'Add New Session'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Morning Session, Afternoon Block"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interview Duration (minutes) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.interview_duration_minutes}
                  onChange={(e) => setFormData({ ...formData, interview_duration_minutes: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buffer Time (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.buffer_minutes}
                  onChange={(e) => setFormData({ ...formData, buffer_minutes: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">Break between interviews</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacity (students per slot) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.slots_per_time}
                  onChange={(e) => setFormData({ ...formData, slots_per_time: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">How many students can be interviewed simultaneously</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingSession ? 'Update Session' : 'Create Session'}
              </button>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">ℹ️ How Sessions Work</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>
              <strong>Sessions</strong> are time blocks during your event when speed recruiting interviews take place.
            </li>
            <li>
              <strong>Example:</strong> "Morning Session" (9:00 AM - 12:00 PM) and "Afternoon Session" (1:00 PM - 4:00 PM)
            </li>
            <li>
              <strong>Interview Slots</strong> are automatically generated based on session configuration.
            </li>
            <li>
              <strong>Formula:</strong> Slots per company = Session duration ÷ (Interview duration + Buffer time)
            </li>
            <li>
              <strong>After creating sessions:</strong> Click "Regenerate Slots" to create interview slots for all registered companies.
            </li>
          </ul>
        </div>
      </main>
    </div>
  )
}
