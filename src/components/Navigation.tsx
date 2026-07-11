import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from './ui/button'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import { Globe, Menu, X, User, LogOut, Settings, BookOpen, Shield } from 'lucide-react'
import { LEARN_URL } from '../lib/learnUrl'
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
    // The course itself now lives on the Learn platform. Users with access
    // (admin, host, or enrolled+paid) go straight there; everyone else keeps
    // the default link to the enrolment page on this site.
    if (canAccessCourse) {
      e.preventDefault()
      window.location.assign(LEARN_URL)
    }
  }

  const canSeeHostTools = Boolean(
    (userProfile && (userProfile.courseStatus === COURSE_STATUS.ACTIVE || userProfile.courseStatus === COURSE_STATUS.COMPLETED)) ||
    (user && (user.role === 'host' || user.role === 'admin'))
  )

  const handleDashboardClick = (e: React.MouseEvent) => {
    if (canSeeHostTools) return // default Link → /host-dashboard
    e.preventDefault()
    if (canAccessCourse) window.location.assign(LEARN_URL)
    else navigate('/course/enroll')
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
  const navItems = [
    ...(baseItems ?? []),
    // Signed-in users get a visible Dashboard entry: hosts/admins to the
    // Host Dashboard, enrolled learners to the Learn platform.
    ...(user ? [{ name: 'Dashboard', href: canSeeHostTools ? '/host-dashboard' : '/course/enroll', onClick: handleDashboardClick }] : []),
    // Community is the network hub: open to every signed-in user. The feed
    // mixes member posts with activity computed from live platform data.
    ...(user ? [{ name: 'Community', href: '/community' }] : [])
  ]

  return (
    <nav aria-label="Main navigation" className="bg-white/85 backdrop-blur-lg border-b border-[#dfe9e2] sticky top-0 z-50">
      {/* SDG rainbow hairline — the page's top edge */}
      <div className="ggj-rainbow h-1.5 w-full" aria-hidden="true" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center gap-3 h-16">
          {/* Logo — single-line lockup, never wraps */}
          <Link to="/" className="flex shrink-0 items-center gap-2.5 group">
            <img
              src={logoSrc}
              alt="Global Goals Jam"
              className="h-9 w-auto object-contain transition-transform group-hover:scale-105"
              decoding="async"
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement
                if (!img.src.endsWith('/ggj-logo.svg')) img.src = '/ggj-logo.svg'
              }}
            />
            <span className="whitespace-nowrap font-display font-extrabold tracking-tight text-[17px] leading-none text-[#14201a]">
              Global Goals Jam
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-0.5 xl:gap-1">
            {(navItems || []).map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={item.onClick}
                className={`whitespace-nowrap text-[13px] xl:text-sm px-2.5 xl:px-3 py-1.5 rounded-full transition-colors duration-200 ${
                  location.pathname === item.href
                    ? 'text-[#00713a] font-semibold bg-[#00A651]/10'
                    : 'text-[#4c5a52] hover:text-[#14201a] hover:bg-[#14201a]/5'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* User Actions */}
          <div className="hidden lg:flex shrink-0 items-center gap-2">
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
              <div className="flex items-center gap-1.5">
                <Link
                  to="/sign-in"
                  className="whitespace-nowrap text-[13px] xl:text-sm font-medium text-[#4c5a52] hover:text-[#00713a] px-2.5 py-1.5 rounded-full transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/sign-in"
                  className="whitespace-nowrap rounded-full bg-[#00A651] px-4 xl:px-5 py-2 text-[13px] xl:text-sm font-semibold text-white shadow-sm hover:bg-[#008a44] transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full text-[#14201a] hover:bg-[#14201a]/5 hover:text-[#14201a]"
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
          <div className="lg:hidden">
            <div className="px-3 pt-3 pb-4 space-y-1 rounded-xl shadow-card bg-white border border-[#dfe9e2] mt-1 mx-2 mb-2">
              {(navItems || []).map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block px-3 py-2.5 text-base rounded-lg transition-colors duration-200 ${
                    location.pathname === item.href
                      ? 'text-[#00713a] font-semibold bg-[#00A651]/10'
                      : 'text-[#4c5a52] hover:text-[#14201a] hover:bg-[#14201a]/5'
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