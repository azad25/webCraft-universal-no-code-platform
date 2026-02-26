'use client'

import { useState, useEffect, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Home, Globe, Layout, Zap, Settings, CreditCard, Users, HelpCircle, LogOut, Menu, X, Search, ChevronDown, Database, BarChart3, Image, Puzzle, FolderOpen, Webhook, Bot, Smartphone, Upload, Sun, Moon, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { NotificationCenter } from '@/components/notifications/notification-center'
import { useAuth } from '@/contexts/auth-context'
import { useAppDispatch } from '@/store'
import { addToast } from '@/store/slices/uiSlice'
import { Toaster } from '@/components/ui/toaster'
import { Logo } from '@/components/brand/logo'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'My Apps', href: '/apps', icon: Globe },
  { name: 'Templates', href: '/templates', icon: Layout },
  { name: 'Automations', href: '/automations', icon: Zap },
  { name: 'Data Sources', href: '/data-sources', icon: Database },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Media Library', href: '/media', icon: Image },
  { name: 'Integrations', href: '/integrations', icon: Puzzle }
]

const secondaryNav = [
  { name: 'Collections', href: '/collections', icon: FolderOpen },
  { name: 'Webhooks', href: '/webhooks', icon: Webhook },
  { name: 'AI Assistant', href: '/ai', icon: Bot },
  { name: 'Mobile SDKs', href: '/mobile', icon: Smartphone },
  { name: 'Export & Deploy', href: '/export', icon: Upload },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Billing', href: '/billing', icon: CreditCard },
  { name: 'Team', href: '/team', icon: Users },
  { name: 'Help', href: '/help', icon: HelpCircle }
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const dispatch = useAppDispatch()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null)
  const { isAuthenticated, isInitialized, user, logout } = useAuth()

  // Load sidebar collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved !== null) {
      setSidebarCollapsed(JSON.parse(saved))
    }
  }, [])

  // Save sidebar collapsed state to localStorage
  const toggleSidebarCollapsed = useCallback(() => {
    const newState = !sidebarCollapsed
    setSidebarCollapsed(newState)
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newState))
  }, [sidebarCollapsed])

  // Fast navigation without artificial delays
  const handleNavigation = useCallback((href: string) => {
    if (pathname === href) return
    
    setNavigatingTo(href)
    setSidebarOpen(false) // Close mobile sidebar immediately
    startTransition(() => {
      router.push(href)
    })
  }, [pathname, router])

  // Clear navigating state when navigation completes
  useEffect(() => {
    setNavigatingTo(null)
  }, [pathname])

  // Prefetch important routes on mount for faster navigation
  useEffect(() => {
    const importantRoutes = ['/dashboard', '/apps', '/templates', '/data-sources']
    importantRoutes.forEach(route => router.prefetch(route))
  }, [router])

  // Keyboard shortcuts for navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
        const shortcuts: Record<string, string> = {
          '1': '/dashboard', '2': '/apps', '3': '/templates', '4': '/automations',
          '5': '/data-sources', '6': '/analytics', '7': '/media', '8': '/integrations'
        }

        if (shortcuts[e.key]) {
          e.preventDefault()
          handleNavigation(shortcuts[e.key])
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleNavigation])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isInitialized, router])

  // Show loading while checking authentication
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Don't render dashboard if not authenticated (redirect is happening)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const handleLogout = async () => {
    try {
      await logout()
      dispatch(addToast({
        type: 'success',
        title: 'Logged out successfully',
        message: 'You have been logged out of your account'
      }))
    } catch (error) {
      dispatch(addToast({
        type: 'error',
        title: 'Logout failed',
        message: 'There was an error logging you out'
      }))
    }
  }

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full bg-white dark:bg-slate-800 border-r transform transition-all duration-300 lg:translate-x-0",
        sidebarCollapsed ? "w-16" : "w-64",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={cn(
            "flex items-center h-16 px-4 border-b",
            sidebarCollapsed ? "justify-center" : "justify-between"
          )}>
            <button 
              onClick={() => handleNavigation('/dashboard')} 
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              disabled={navigatingTo === '/dashboard'}
            >
              <Logo 
                size="sm" 
                variant={sidebarCollapsed ? "icon" : "full"} 
                animated={false}
              />
              {navigatingTo === '/dashboard' && !sidebarCollapsed && (
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
              )}
            </button>
            
            {!sidebarCollapsed && (
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={toggleSidebarCollapsed}
                  className="hidden lg:flex w-8 h-8 p-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="lg:hidden w-8 h-8 p-0" 
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
            
            {sidebarCollapsed && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleSidebarCollapsed}
                className="hidden lg:flex w-8 h-8 p-0 absolute -right-3 top-4 bg-white dark:bg-slate-800 border rounded-full shadow-md hover:shadow-lg"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            <div className="mb-4">
              {!sidebarCollapsed && (
                <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase">Build & Create</p>
              )}
              {navigation.slice(0, 4).map((item, index) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                const isNavigating = navigatingTo === item.href
                return (
                  <button
                    key={item.name}
                    onClick={() => handleNavigation(item.href)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full text-left relative group",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-foreground",
                      sidebarCollapsed && "justify-center"
                    )}
                    disabled={isNavigating}
                    title={sidebarCollapsed ? item.name : undefined}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1">{item.name}</span>
                        {isNavigating && (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        )}
                      </>
                    )}
                    
                    {/* Tooltip for collapsed state */}
                    {sidebarCollapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                        {item.name}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            <div className="mb-4">
              {!sidebarCollapsed && (
                <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase">Data & Analytics</p>
              )}
              {navigation.slice(4, 8).map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                const isNavigating = navigatingTo === item.href
                return (
                  <button
                    key={item.name}
                    onClick={() => handleNavigation(item.href)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full text-left relative group",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-foreground",
                      sidebarCollapsed && "justify-center"
                    )}
                    disabled={isNavigating}
                    title={sidebarCollapsed ? item.name : undefined}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1">{item.name}</span>
                        {isNavigating && (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        )}
                      </>
                    )}
                    
                    {/* Tooltip for collapsed state */}
                    {sidebarCollapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                        {item.name}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {!sidebarCollapsed && (
              <>
                <div className="pt-4 mt-4 border-t">
                  <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase">Advanced</p>
                  {secondaryNav.slice(0, 5).map((item) => {
                    const isActive = pathname === item.href
                    const isNavigating = navigatingTo === item.href
                    return (
                      <button
                        key={item.name}
                        onClick={() => handleNavigation(item.href)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full text-left",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-foreground"
                        )}
                        disabled={isNavigating}
                      >
                        <item.icon className="w-5 h-5" />
                        {item.name}
                        {isNavigating && (
                          <Loader2 className="w-3 h-3 animate-spin ml-auto" />
                        )}
                      </button>
                    )
                  })}
                </div>

                <div className="pt-4 mt-4 border-t">
                  <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase">Account</p>
                  {secondaryNav.slice(5).map((item) => {
                    const isActive = pathname === item.href
                    const isNavigating = navigatingTo === item.href
                    return (
                      <button
                        key={item.name}
                        onClick={() => handleNavigation(item.href)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full text-left",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-foreground"
                        )}
                        disabled={isNavigating}
                      >
                        <item.icon className="w-5 h-5" />
                        {item.name}
                        {isNavigating && (
                          <Loader2 className="w-3 h-3 animate-spin ml-auto" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </nav>

          {/* User */}
          <div className="p-4 border-t">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user?.avatarUrl || undefined} />
                    <AvatarFallback>
                      {user?.fullName ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 
                       user?.username ? user.username.slice(0, 2).toUpperCase() : 
                       user?.email ? user.email.slice(0, 2).toUpperCase() : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">{user?.fullName || user?.username || 'User'}</p>
                    <p className="text-xs text-muted-foreground">
                      {user?.subscriptionTier === 'pro' ? 'Pro Plan' : 
                       user?.subscriptionTier === 'enterprise' ? 'Enterprise Plan' : 'Free Plan'}
                    </p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <button 
                    onClick={() => handleNavigation('/settings')}
                    className="w-full flex items-center"
                    disabled={navigatingTo === '/settings'}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                    {navigatingTo === '/settings' && (
                      <Loader2 className="w-3 h-3 animate-spin ml-auto" />
                    )}
                  </button>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <button 
                    onClick={() => handleNavigation('/billing')}
                    className="w-full flex items-center"
                    disabled={navigatingTo === '/billing'}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Billing
                    {navigatingTo === '/billing' && (
                      <Loader2 className="w-3 h-3 animate-spin ml-auto" />
                    )}
                  </button>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white dark:bg-slate-800 border-b">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-5 h-5" />
              </Button>
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search..." className="w-64 pl-10" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={toggleTheme}>
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </Button>
              <NotificationCenter />
              <Button variant="ghost" size="sm">
                <HelpCircle className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="relative">
          {/* Loading indicator only for transitions */}
          {isPending && (
            <div className="fixed top-20 right-4 z-50">
              <div className="flex items-center gap-2 bg-card p-3 rounded-lg shadow-lg border">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm">Loading...</span>
              </div>
            </div>
          )}
          
          {children}
        </main>
        
        {/* Toast notifications */}
        <Toaster />
      </div>
    </div>
  )
}
