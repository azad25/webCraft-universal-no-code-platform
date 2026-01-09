'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAdminTestUser, useDevUser, getCurrentDevUserId } from '@/lib/dev-auth'

export function UserSwitcher() {
  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window !== 'undefined') {
      const useAdminToken = localStorage.getItem('use-admin-token')
      if (useAdminToken === 'true') {
        return 'admin@test.com'
      }
      const devUserId = getCurrentDevUserId()
      return devUserId ? `dev-${devUserId}@webcraft.local` : 'No user'
    }
    return 'Loading...'
  })

  const handleSwitchToAdmin = () => {
    useAdminTestUser()
    setCurrentUser('admin@test.com')
  }

  const handleSwitchToDevUser = () => {
    useDevUser()
    const devUserId = getCurrentDevUserId()
    setCurrentUser(devUserId ? `dev-${devUserId}@webcraft.local` : 'dev-user')
  }

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-sm">Development User Switcher</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm">
          <span className="font-medium">Current User:</span>
          <div className="text-muted-foreground">{currentUser}</div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSwitchToAdmin}
            className="flex-1"
          >
            Use admin@test.com
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSwitchToDevUser}
            className="flex-1"
          >
            Use Dev User
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}