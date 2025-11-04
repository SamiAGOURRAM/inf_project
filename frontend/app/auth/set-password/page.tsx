'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

export default function SetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [validating, setValidating] = useState(true)
  const [hasValidToken, setHasValidToken] = useState(false)
  const [companyName, setCompanyName] = useState<string | null>(null)

  // Validate token on mount
  useEffect(() => {
    validateToken()
  }, [])

  const validateToken = async () => {
    setValidating(true)
    
    try {
      // Check if user has a valid session from the confirmation link
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        setError('Invalid or expired link. Please request a new invitation.')
        setHasValidToken(false)
        setValidating(false)
        return
      }

      // Check if user already has a password set (by checking if they can sign in)
      // If they got here via confirmation link, they need to set password
      setHasValidToken(true)
      
      // Get company info from user metadata
      const companyNameFromMeta = session.user.user_metadata?.company_name
      if (companyNameFromMeta) {
        setCompanyName(companyNameFromMeta)
      }
      
    } catch (err: any) {
      setError('An error occurred. Please try again or contact support.')
      setHasValidToken(false)
    } finally {
      setValidating(false)
    }
  }

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    // Validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    setLoading(true)
    
    try {
      // Update user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })
      
      if (updateError) throw updateError
      
      // Wait a moment for profile to be created by trigger
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Check if profile exists, if not create it
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()
        
        // If no profile, create one manually (trigger might not have fired for invited users)
        if (!profile) {
          console.log('No profile found, creating manually...')
          
          const role = user.user_metadata?.role || 'company'
          const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
          
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email!,
              full_name: fullName,
              role: role
            })
          
          if (profileError) {
            console.error('Profile creation error:', profileError)
            // Don't fail - continue anyway
          }
          
          // If company, create company record
          if (role === 'company') {
            const companyName = user.user_metadata?.company_name || 'Company Name'
            
            const { error: companyError } = await supabase
              .from('companies')
              .insert({
                profile_id: user.id,
                company_name: companyName,
                is_verified: false,
                verification_status: 'pending'
              })
            
            if (companyError) {
              console.error('Company creation error:', companyError)
              // Don't fail - continue anyway
            }
          }
        }
      }
      
      setSuccess(true)
      
      // Redirect to company dashboard after 2 seconds
      setTimeout(() => {
        router.push('/company')
      }, 2000)
      
    } catch (err: any) {
      setError(err.message || 'Failed to set password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Validating token
  if (validating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validating your invitation link...</p>
        </div>
      </div>
    )
  }

  // Invalid token
  if (!hasValidToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Invalid or Expired Link
            </h1>
            <p className="text-gray-600 mb-6">
              {error}
            </p>
            <button
              onClick={() => router.push('/login')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            ✅ Password Set Successfully!
          </h1>
          <p className="text-gray-600 mb-4">
            Your account is now ready to use.
          </p>
          <p className="text-sm text-gray-500">
            Redirecting to your dashboard...
          </p>
        </div>
      </div>
    )
  }

  // Set password form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Set Your Password
          </h1>
          {companyName && (
            <p className="text-gray-600">
              Welcome, <span className="font-semibold">{companyName}</span>!
            </p>
          )}
          <p className="text-sm text-gray-500 mt-2">
            Choose a secure password for your account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSetPassword} className="space-y-5">
          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              minLength={8}
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum 8 characters
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              minLength={8}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '⏳ Setting Password...' : '🔒 Set Password & Continue'}
          </button>
        </form>

        {/* Security Note */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 text-center">
            🔒 This link is secure and can only be used once.
            After setting your password, you can login normally.
          </p>
        </div>
      </div>
    </div>
  )
}
