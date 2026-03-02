import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from './ui/button'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import { Globe, Menu, X, User, LogOut, Settings, BookOpen, Shield } from 'lucide-react'
import { getUserProfile, UserProfile, COURSE_STATUS } from '../lib/userStatus'
import { appAuth } from '../lib/simpleAuth'
import { clearAuthToken } from '../lib/auth'

interface User {
  id: string
  email: string
  displayName?: string
  role: string
}

export default function Navigation() {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const [isImpersonating, setIsImpersonating] = useState(false)

  // Use bundled marker image in public folder (ensures availability on live site)
  const logoSrc = '/marker.png'

  useEffect(() => {
    const updateFromLocal = async () => {
      setLoading(true)
      const stored = appAuth.get()
      setUser(stored as any)
      if (stored?.id) {
        const profile = await getUserProfile(stored.id)
        setUserProfile(profile)
      } else {
        setUserProfile(null)
      }
      setIsImpersonating(!!localStorage.getItem('impersonator_user'))
      setLoading(false)
    }

    const unsubscribe = appAuth.onChange(() => {
      updateFromLocal().catch(console.error)
    })

    updateFromLocal().catch(console.error)

    return unsubscribe
  }, [])

  const handleLogin = () => {
    // Navigate to our custom login page
    window.location.href = '/sign-in'
  }

  const handleLogout = () => {
    try { clearAuthToken() } catch {}
    try { appAuth.clear() } catch {}
    localStorage.removeItem('impersonator_user')
    window.location.href = '/sign-in'
  }

  const handleReturnToAdmin = () => {
    try {
      const rawUser = localStorage.getItem('impersonator_user')
      const rawToken = localStorage.getItem('impersonator_token')
      if (!rawUser || !rawToken) return

      const admin = JSON.parse(rawUser)

      // Restore admin session (token + user)
      localStorage.setItem('auth_token', rawToken)
      localStorage.setItem('user', rawUser)

      // Clear impersonation markers
      localStorage.removeItem('impersonator_user')
      localStorage.removeItem('impersonator_token')

      // Sync simple auth and UI
      appAuth.set(admin)
      setIsImpersonating(false)

      // Reload to ensure all contexts pick up restored token
      window.location.href = '/admin/users'
    } catch (e) {
      console.error('Failed to return to admin', e)
    }
  }

  const canAccessCourse = Boolean(
    (user && (user.role === 'admin' || user.role === 'host')) ||
    (userProfile && userProfile.isPaid &&
      (userProfile.courseStatus === COURSE_STATUS.ACTIVE || userProfile.courseStatus === COURSE_STATUS.COMPLETED))
  )

  const handleCertificationCourseClick = (e: React.MouseEvent) => {
    // If user can access the course (admin, host, or enrolled+paid), go to dashboard
    if (canAccessCourse) {
      e.preventDefault()
      navigate('/course/dashboard')
    }
    // Otherwise, let the default link behavior work (goes to enrollment page)
  }

  const baseItems = [
    { name: 'Home', href: '/' },
    { name: '2026 Theme', href: '/theme' },
    { name: 'Events', href: '/events' },
    { name: 'Process', href: '/process' },
    { name: 'About', href: '/about' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Contact', href: '/contact' },
    { name: 'Toolkit', href: '/toolkit' },
    { name: 'Certification course', href: '/course/enroll', onClick: handleCertificationCourseClick }
  ]
  const canSeeHostTools = Boolean(
    (userProfile && (userProfile.courseStatus === COURSE_STATUS.ACTIVE || userProfile.courseStatus === COURSE_STATUS.COMPLETED)) ||
    (user && (user.role === 'host' || user.role === 'admin'))
  )
  const navItems = [
    ...(baseItems ?? []),
    ...(canSeeHostTools ? [{ name: 'Community', href: '/community' }] : [])
  ]

  return (
    <nav aria-label="Main navigation" className="bg-white/80 dark:bg-background/80 backdrop-blur-lg border-b border-border/50 sticky top-0 z-50">
      {/* SDG Color Strip */}
      <div className="flex w-full h-[3px]" aria-hidden="true">
        {Array.from({ length: 17 }, (_, i) => (
          <div key={i} className={`flex-1 bg-sdg-${i + 1}`} />
        ))}
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-[4.5rem]">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2.5 group">
            <img
              src={logoSrc}
              alt="Global Goals Jam"
              className="w-8 h-10 object-contain transition-transform group-hover:scale-105"
              decoding="async"
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement
                if (!img.src.endsWith('/ggj-logo.svg')) img.src = '/ggj-logo.svg'
              }}
            />
            <span className="text-lg font-display font-bold text-foreground tracking-tight">Global Goals Jam</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {(navItems || []).map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={item.onClick}
                className={`text-sm px-3 py-2 rounded-lg transition-colors duration-200 ${
                  location.pathname === item.href
                    ? 'text-primary font-medium bg-primary/5'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* User Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full" aria-label="User menu">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profileImage} alt={user.displayName || user.email} />
                      <AvatarFallback>
                        {(user.displayName || user.email).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user.displayName || 'User'}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link to="/profile">
                      <span className="inline-flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </span>
                    </Link>
                  </DropdownMenuItem>
                  {isImpersonating && (
                    <DropdownMenuItem onSelect={handleReturnToAdmin}>
                      <Shield className="mr-2 h-4 w-4" />
                      Return to Admin
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onSelect={() => navigate(canAccessCourse ? '/course/dashboard' : '/course/enroll')}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    {canAccessCourse ? 'My Course' : 'Certification Course'}
                  </DropdownMenuItem>
                  {canSeeHostTools && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/host-dashboard">
                          <Settings className="mr-2 h-4 w-4" />
                          Host Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={`/host/${user.id}`}>
                          <User className="mr-2 h-4 w-4" />
                          My Host Page
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  {user.role === 'admin' && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/admin-dashboard">
                          <Settings className="mr-2 h-4 w-4" />
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/admin/users">
                          <User className="mr-2 h-4 w-4" />
                          User Management
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link to="/sign-in">Sign in</Link>
                </Button>
                <Button variant="pill" asChild>
                  <Link to="/sign-in">Get Started</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-3 pt-3 pb-4 space-y-1 rounded-xl shadow-card bg-card border border-border/50 mt-1 mx-2 mb-2">
              {(navItems || []).map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block px-3 py-2.5 text-base rounded-lg transition-colors duration-200 ${
                    location.pathname === item.href
                      ? 'text-primary font-semibold bg-primary/5'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                  onClick={(e) => {
                    item.onClick?.(e)
                    setMobileMenuOpen(false)
                  }}
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-4 pb-3 border-t border-border/50">
                {user ? (
                  <div className="flex items-center px-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.profileImage} alt={user.displayName || user.email} />
                      <AvatarFallback>
                        {(user.displayName || user.email).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="ml-3">
                      <div className="text-base font-medium">{user.displayName || 'User'}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                ) : (
                  <div className="px-3 space-y-2">
                    <Button variant="ghost" onClick={handleLogin} className="w-full justify-start">
                      Sign in
                    </Button>
                    <Button variant="pill" asChild className="w-full">
                      <Link to="/sign-in">Get Started</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}