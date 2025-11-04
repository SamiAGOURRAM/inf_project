'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Clock, Users, Plus, Edit, Trash2 } from 'lucide-react'

type ScheduleItem = {
  id: string
  name: string
  description: string | null
  start_time: string
  end_time: string
  item_type: string
  location: string | null
}

type Session = {
  id: string
  name: string
  start_time: string
  end_time: string
  interview_duration_minutes: number
  buffer_minutes: number
  slots_per_time: number
}

type Event = {
  id: string
  name: string
  date: string
  location: string
}

type CombinedScheduleItem = {
  id: string
  name: string
  description?: string
  start_time: string
  end_time: string
  type: 'schedule' | 'session'
  location?: string
  details?: string
}

export default function EventSchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const supabase = createClient()
  const resolvedParams = use(params)
  const eventId = resolvedParams.id

  const [loading, setLoading] = useState(true)
  const [event, setEvent] = useState<Event | null>(null)
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_time: '',
    end_time: '',
    item_type: 'break',
    location: ''
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
    const { data: eventData } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (eventData) setEvent(eventData)

    // Load schedule items
    const { data: itemsData } = await supabase
      .from('event_schedule_items')
      .select('*')
      .eq('event_id', eventId)
      .order('start_time', { ascending: true })

    if (itemsData) setScheduleItems(itemsData)

    // Load sessions
    const { data: sessionsData } = await supabase
      .from('speed_recruiting_sessions')
      .select('*')
      .eq('event_id', eventId)
      .order('start_time', { ascending: true })

    if (sessionsData) setSessions(sessionsData)
  }

  const getCombinedSchedule = (): CombinedScheduleItem[] => {
    const combined: CombinedScheduleItem[] = [
      ...scheduleItems.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description || undefined,
        start_time: item.start_time,
        end_time: item.end_time,
        type: 'schedule' as const,
        location: item.location || undefined,
        details: item.item_type
      })),
      ...sessions.map(session => ({
        id: session.id,
        name: session.name,
        start_time: session.start_time,
        end_time: session.end_time,
        type: 'session' as const,
        details: `${session.interview_duration_minutes}min interviews, ${session.slots_per_time} capacity`
      }))
    ]

    return combined.sort((a, b) => 
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    )
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      start_time: '',
      end_time: '',
      item_type: 'break',
      location: ''
    })
    setEditingItem(null)
    setShowAddForm(false)
  }

  const handleEdit = (item: ScheduleItem) => {
    setFormData({
      name: item.name,
      description: item.description || '',
      start_time: item.start_time.substring(0, 16),
      end_time: item.end_time.substring(0, 16),
      item_type: item.item_type,
      location: item.location || ''
    })
    setEditingItem(item)
    setShowAddForm(true)
  }

  const handleSave = async () => {
    try {
      if (!formData.name.trim()) {
        alert('Name is required')
        return
      }

      if (new Date(formData.start_time) >= new Date(formData.end_time)) {
        alert('Start time must be before end time')
        return
      }

      if (editingItem) {
        const { error } = await supabase
          .from('event_schedule_items')
          .update({
            name: formData.name,
            description: formData.description || null,
            start_time: formData.start_time,
            end_time: formData.end_time,
            item_type: formData.item_type,
            location: formData.location || null
          })
          .eq('id', editingItem.id)

        if (error) throw error
        alert('Schedule item updated!')
      } else {
        const { error } = await supabase
          .from('event_schedule_items')
          .insert({
            event_id: eventId,
            name: formData.name,
            description: formData.description || null,
            start_time: formData.start_time,
            end_time: formData.end_time,
            item_type: formData.item_type,
            location: formData.location || null,
            is_active: true
          })

        if (error) throw error
        alert('Schedule item added!')
      }

      resetForm()
      await loadData()
    } catch (err) {
      console.error('Error saving:', err)
      alert('Error saving schedule item')
    }
  }

  const handleDelete = async (itemId: string, itemName: string) => {
    if (!confirm(`Delete "${itemName}"?`)) return

    try {
      const { error } = await supabase
        .from('event_schedule_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error
      alert('Deleted!')
      await loadData()
    } catch (err) {
      console.error('Error deleting:', err)
      alert('Error deleting item')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading schedule...</p>
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

  const combinedSchedule = getCombinedSchedule()

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/admin/events" className="text-sm text-primary hover:underline mb-2 inline-block">
            ← Back to Events
          </Link>
          <h1 className="text-2xl font-bold text-foreground">{event.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">Event Schedule & Timeline</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Actions */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Full Event Schedule</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Combining {scheduleItems.length} schedule items and {sessions.length} recruiting sessions
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            Add Schedule Item
          </button>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-card rounded-lg border border-border p-6 mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              {editingItem ? 'Edit Schedule Item' : 'Add Schedule Item'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Lunch Break, Opening Ceremony"
                  className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Type *
                </label>
                <select
                  value={formData.item_type}
                  onChange={(e) => setFormData({ ...formData, item_type: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground"
                >
                  <option value="break">Break</option>
                  <option value="lunch">Lunch</option>
                  <option value="registration">Registration</option>
                  <option value="networking">Networking</option>
                  <option value="presentation">Presentation</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Optional location"
                  className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Start Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  End Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  placeholder="Optional description"
                  className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground"
                />
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <button
                onClick={resetForm}
                className="px-4 py-2 border border-input rounded-md text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                {editingItem ? 'Update' : 'Add'} Item
              </button>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">
              {new Date(event.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </h3>
          </div>

          {combinedSchedule.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No schedule items or sessions yet.</p>
              <p className="text-sm mt-2">Add schedule items or create sessions to build your event timeline.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {combinedSchedule.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className={`border-l-4 pl-4 py-3 ${
                    item.type === 'session'
                      ? 'border-l-primary bg-primary/5'
                      : 'border-l-muted-foreground bg-muted/30'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground">
                          {new Date(item.start_time).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                          {' - '}
                          {new Date(item.end_time).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          item.type === 'session'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {item.type === 'session' ? '🎯 Recruiting Session' : `📋 ${item.details}`}
                        </span>
                      </div>
                      <h4 className="text-lg font-semibold text-foreground mt-2">{item.name}</h4>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                      )}
                      {item.location && (
                        <p className="text-sm text-muted-foreground mt-1">📍 {item.location}</p>
                      )}
                      {item.type === 'session' && (
                        <p className="text-sm text-muted-foreground mt-1">ℹ️ {item.details}</p>
                      )}
                    </div>
                    {item.type === 'schedule' && (
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEdit(scheduleItems.find(s => s.id === item.id)!)}
                          className="p-2 text-primary hover:bg-primary/10 rounded-md"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.name)}
                          className="p-2 text-destructive hover:bg-destructive/10 rounded-md"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-6 bg-muted/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-3">
            <strong>💡 Tip:</strong> Schedule items are for non-recruiting activities (breaks, lunch, presentations).
            To configure interview sessions, go to:
          </p>
          <Link
            href={`/admin/events/${eventId}/sessions`}
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <Users className="w-4 h-4" />
            Manage Recruiting Sessions →
          </Link>
        </div>
      </main>
    </div>
  )
}
