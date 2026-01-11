'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { m } from \'framer-motion\'
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (token) {
      verifyEmail(token)
    } else {
      setStatus('error')
      setMessage('No verification token provided')
    }
  }, [token])

  const verifyEmail = async (token: string) => {
    try {
      const res = await fetch(`/api/auth/verify-email/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (res.ok) {
        setStatus('success')
        setMessage('Your email has been verified successfully!')
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      } else {
        const data = await res.json()
        setStatus('error')
        setMessage(data.detail || 'Verification failed')
      }
    } catch (error) {
      setStatus('error')
      setMessage('An error occurred during verification')
    }
  }

  const resendVerification = async () => {
    // This would need the user's email - for now just redirect to login
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-6">
            {status === 'loading' && (
              <div className="flex flex-col items-center">
                <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-4" />
                <h1 className="text-2xl font-bold mb-2">Verifying Email</h1>
                <p className="text-muted-foreground">Please wait while we verify your email address...</p>
              </div>
            )}

            {status === 'success' && (
              <div className="flex flex-col items-center">
                <CheckCircle className="w-16 h-16 text-green-600 mb-4" />
                <h1 className="text-2xl font-bold text-green-600 mb-2">Email Verified!</h1>
                <p className="text-muted-foreground mb-4">{message}</p>
                <p className="text-sm text-muted-foreground">Redirecting to login...</p>
              </div>
            )}

            {status === 'error' && (
              <div className="flex flex-col items-center">
                <XCircle className="w-16 h-16 text-red-600 mb-4" />
                <h1 className="text-2xl font-bold text-red-600 mb-2">Verification Failed</h1>
                <p className="text-muted-foreground mb-6">{message}</p>
                
                <div className="space-y-3">
                  <Button onClick={() => router.push('/login')} className="w-full">
                    Go to Login
                  </Button>
                  <Button variant="outline" onClick={resendVerification} className="w-full">
                    <Mail className="w-4 h-4 mr-2" />
                    Resend Verification
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </m.div>
    </div>
  )
}