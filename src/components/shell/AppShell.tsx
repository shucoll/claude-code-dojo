import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { Button } from '../ui/Button'
import { GitHubLink } from './GitHubLink'
import { LanguageSwitcher } from './LanguageSwitcher'
import { Logo } from './Logo'
import { ProgressBar } from './ProgressBar'
import { Sidebar } from './Sidebar'
import { ThemeToggle } from './ThemeToggle'

// Below this width the sidebar becomes a modal drawer that overlays the content
// instead of pushing it aside.
const DESKTOP_QUERY = '(min-width: 1024px)'

function PanelIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16" />
    </svg>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const [sidebarOpen, setSidebarOpen] = useState(isDesktop)
  const reduce = useReducedMotion()
  const duration = reduce ? 0 : 0.22
  const location = useLocation()

  // Follow the breakpoint: open by default on desktop, closed (drawer) on mobile.
  useEffect(() => {
    setSidebarOpen(isDesktop)
  }, [isDesktop])

  // On mobile the drawer sits over the content, so close it once a lesson loads.
  useEffect(() => {
    if (!isDesktop) setSidebarOpen(false)
  }, [location.pathname, isDesktop])

  // Escape closes the mobile drawer, matching its modal behaviour.
  useEffect(() => {
    if (isDesktop || !sidebarOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isDesktop, sidebarOpen])

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-[var(--z-sticky)] flex items-center justify-between gap-4 border-b-2 border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen((o) => !o)}
          >
            <PanelIcon />
          </Button>
          <Logo />
        </div>
        <div className="flex items-center gap-3">
          <ProgressBar className="hidden sm:flex" />
          <LanguageSwitcher />
          <GitHubLink />
          <ThemeToggle />
        </div>
      </header>

      <div className="relative flex flex-1 overflow-hidden">
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration }}
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
              className="absolute inset-0 z-[var(--z-overlay)] bg-background/60 backdrop-blur-sm lg:hidden"
            />
          )}
          {sidebarOpen && (
            <motion.aside
              key="sidebar"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 288, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-y-0 left-0 z-[var(--z-modal)] overflow-y-auto overflow-x-hidden border-r-2 border-border bg-card shadow-hard-lg lg:relative lg:inset-auto lg:z-[var(--z-sidebar)] lg:bg-card/40 lg:shadow-none"
            >
              <div className="w-72">
                <Sidebar />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
