'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function QuickInvitePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const supabase = createClient()
  const resolvedParams = use(params)
  const eventId = resolvedParams.id
  
  const [activeTab, setActiveTab] = useState<'new' | 'existing'>('new')
  const [eventName, setEventName] = useState<string>('')
  
  // New company state
  const [email, setEmail] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [industry, setIndustry] = useState('Technology')
  const [website, setWebsite] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [exportingCSV, setExportingCSV] = useState(false)

  // Load event name
  useEffect(() => {
    loadEventName()
  }, [eventId])

  const loadEventName = async () => {
    const { data } = await supabase
      .from('events')
      .select('name')
      .eq('id', eventId)
      .single()
    
    if (data) setEventName(data.name)
  }

  // Quick invite new company
  const handleQuickInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const { data, error } = await supabase.rpc('quick_invite_company', {
        p_email: email.trim(),
        p_company_name: companyName.trim(),
        p_event_id: eventId,
        p_industry: industry || 'Other',
        p_website: website.trim() || null
      })

      if (error) throw error

      setResult(data)

      // Handle different actions based on company status
      if (data.success) {
        if (data.action === 'send_signup_email') {
          // NEW COMPANY - Send signup email with temporary password
          try {
            // Generate a cryptographically secure random password (max 72 chars for bcrypt)
            const array = new Uint8Array(24) // 24 bytes = 48 hex chars
            crypto.getRandomValues(array)
            const hexPart = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
            const timestampPart = Date.now().toString(36) // ~11 chars
            const tempPassword = hexPart + timestampPart // 59 chars total
            
            // Create user account (this triggers confirmation email)
            const { error: signUpError } = await supabase.auth.signUp({
              email: email.trim().toLowerCase(),
              password: tempPassword,
              options: {
                data: {
                  company_name: companyName.trim(),
                  company_code: data.company_code,
                  role: 'company',
                  event_name: eventName,
                  event_id: eventId
                },
                emailRedirectTo: `${window.location.origin}/auth/set-password`
              }
            })

            if (signUpError) {
              console.error('Email invitation error:', signUpError)
              setResult({
                ...data,
                message: data.message + '\n⚠️ Email error: ' + signUpError.message + '\n\nCompany created successfully but please send credentials manually.'
              })
            } else {
              setResult({
                ...data,
                message: data.message + '\n\n📧 Invitation email sent! Company will receive a link to set their password.'
              })
            }
          } catch (emailError: any) {
            console.error('Failed to send invitation email:', emailError)
            setResult({
              ...data,
              message: data.message + '\n\n⚠️ Email could not be sent. Please use the Resend button in Participants page.'
            })
          }
        } else if (data.action === 'send_notification_email') {
          // EXISTING COMPANY - Added to new event (don't send auth.signUp - they already have account)
          setResult({
            ...data,
            message: data.message + '\n\n✅ Company added to event! They can login with their existing credentials.\n\nNote: No email sent (company already has an account). You may want to notify them through other channels.'
          })
        } else if (data.action === 'use_resend_button') {
          // ALREADY INVITED TO THIS EVENT - Show error
          setResult({
            success: false,
            message: data.message
          })
        }

        // Clear form if actually successful
        if (data.success && data.action !== 'use_resend_button') {
          setEmail('')
          setCompanyName('')
          setIndustry('Technology')
          setWebsite('')
        }
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || 'Failed to invite company'
      })
    } finally {
      setLoading(false)
    }
  }

  // Search companies
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      const { data, error } = await supabase.rpc('search_companies_for_invitation', {
        search_query: searchQuery.trim(),
        event_id_filter: eventId
      })

      if (error) throw error
      setSearchResults(data || [])
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  // Re-invite existing company
  const handleReInvite = async (company: any) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('quick_invite_company', {
        p_email: company.email,
        p_company_name: company.company_name,
        p_event_id: eventId
      })

      if (error) throw error

      // Refresh search results
      await handleSearch()
      
      alert(data.message)
    } catch (error: any) {
      alert('Failed to re-invite: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Export companies as CSV
  const handleExportCSV = async () => {
    setExportingCSV(true)
    try {
      // Get all invited companies for this event
      const { data: participants, error } = await supabase
        .from('event_participants')
        .select(`
          company_id,
          companies!inner (
            company_code,
            company_name,
            industry,
            website,
            profiles!inner (
              email
            )
          )
        `)
        .eq('event_id', eventId)

      if (error) throw error

      if (!participants || participants.length === 0) {
        alert('No companies invited to this event yet')
        return
      }

      // Build CSV content
      const csvHeader = 'company_code,company_name,email,industry,website\n'
      const csvRows = participants.map((p: any) => {
        const company = p.companies
        const email = company.profiles?.email || ''
        return `${company.company_code},"${company.company_name}","${email}","${company.industry || ''}","${company.website || ''}"`
      }).join('\n')

      const csvContent = csvHeader + csvRows

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `companies_${eventName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      alert(`✅ Exported ${participants.length} companies to CSV`)
    } catch (error: any) {
      alert('Export failed: ' + error.message)
    } finally {
      setExportingCSV(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.back()}
              className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
            >
              ← Back to Event
            </button>
            <button
              onClick={handleExportCSV}
              disabled={exportingCSV}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center gap-2"
            >
              {exportingCSV ? '⏳ Exporting...' : '📥 Export Companies CSV'}
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Invite Companies
          </h1>
          <p className="text-gray-600 mt-2">
            {eventName ? `Event: ${eventName}` : 'Add new companies or re-invite returning ones'}
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('new')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'new'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                ➕ Add New Company
              </button>
              <button
                onClick={() => setActiveTab('existing')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'existing'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🔍 Re-invite Returning Companies
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'new' ? (
              /* NEW COMPANY FORM */
              <div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    ⚡ Quick Invite Workflow
                  </h3>
                  <ol className="text-sm text-blue-800 space-y-1">
                    <li>1. Enter email + company name</li>
                    <li>2. Company created & invited instantly</li>
                    <li>3. Welcome email sent automatically</li>
                    <li>4. Interview slots auto-generated</li>
                    <li>5. Company receives link to set password</li>
                  </ol>
                </div>

                <form onSubmit={handleQuickInvite} className="space-y-4">
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="hr@company.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Invitation email will be sent here
                    </p>
                  </div>

                  {/* Company Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="TechCorp Solutions"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Company code will be auto-generated (e.g., TECHCORP2025)
                    </p>
                  </div>

                  {/* Industry (Optional) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Industry
                    </label>
                    <select
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option>Technology</option>
                      <option>Finance</option>
                      <option>Healthcare</option>
                      <option>Education</option>
                      <option>Consulting</option>
                      <option>Manufacturing</option>
                      <option>Retail</option>
                      <option>Other</option>
                    </select>
                  </div>

                  {/* Website (Optional) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Website
                    </label>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://www.company.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading || !email || !companyName}
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? '⏳ Inviting...' : '🚀 Invite Company'}
                  </button>
                </form>

                {/* Result Message */}
                {result && (
                  <div className={`mt-4 p-4 rounded-lg ${
                    result.success 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <p className={`font-semibold ${
                      result.success ? 'text-green-900' : 'text-red-900'
                    }`}>
                      {result.message}
                    </p>
                    {result.success && result.company_code && (
                      <div className="mt-2 text-sm text-green-800">
                        <p>Company Code: <code className="font-mono font-bold">{result.company_code}</code></p>
                        {result.is_new_company && (
                          <p className="mt-1">
                            ✉️ Invitation email sent to {result.email}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* SEARCH & RE-INVITE */
              <div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    🔍 Search Returning Companies
                  </h3>
                  <p className="text-sm text-blue-800 mb-2">
                    Search by name, code, or email. See participation history and one-click re-invite.
                  </p>
                  <div className="mt-3 pt-3 border-t border-blue-300">
                    <p className="text-sm text-blue-900 font-semibold mb-1">
                      📥 Pro Tip: Export CSV for Bulk Re-invite
                    </p>
                    <p className="text-xs text-blue-700">
                      Click "Export Companies CSV" above to download the list of all invited companies with their codes.
                      Save this file to quickly re-invite the same companies to next year's event!
                    </p>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="flex gap-2 mb-6">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search by name, code, or email..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={searching || !searchQuery.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                  >
                    {searching ? '⏳' : '🔍'} Search
                  </button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 ? (
                  <div className="space-y-3">
                    {searchResults.map((company) => (
                      <div
                        key={company.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-bold text-lg text-gray-900">
                                {company.company_name}
                              </h3>
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                                {company.company_code}
                              </code>
                              {company.already_invited && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                  ✓ Already Invited
                                </span>
                              )}
                            </div>
                            
                            <div className="text-sm text-gray-600 space-y-1">
                              <p>📧 {company.email}</p>
                              <p>🏢 {company.industry}</p>
                              {company.website && (
                                <p>
                                  🌐 <a href={company.website} target="_blank" className="text-blue-600 hover:underline">
                                    {company.website}
                                  </a>
                                </p>
                              )}
                              <p className="font-semibold text-gray-700">
                                📊 {company.total_participations} past participation{company.total_participations !== 1 ? 's' : ''}
                              </p>
                              {company.last_event_name && (
                                <p className="text-xs text-gray-500">
                                  Last: {company.last_event_name} ({new Date(company.last_event_date).toLocaleDateString()})
                                </p>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => handleReInvite(company)}
                            disabled={loading || company.already_invited}
                            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                              company.already_invited
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            {company.already_invited ? '✓ Invited' : '📧 Re-Invite'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchQuery && !searching ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-lg">No companies found matching "{searchQuery}"</p>
                    <p className="text-sm mt-2">Try a different search term or add as new company</p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
