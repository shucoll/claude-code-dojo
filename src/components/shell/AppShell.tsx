import { useState, type ReactNode } from 'react'
import { Button } from '../ui/Button'
import { LanguageSwitcher } from './LanguageSwitcher'
import { ProgressBar } from './ProgressBar'
import { Sidebar } from './Sidebar'
import { ThemeToggle } from './ThemeToggle'

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
  const [sidebarOpen, setSidebarOpen] = useState(true)

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
          <span className="font-mono text-lg font-bold">Claude Code Craft</span>
        </div>
        <div className="flex items-center gap-3">
          <ProgressBar className="hidden sm:flex" />
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && (
          <aside className="w-72 shrink-0 overflow-y-auto border-r-2 border-border bg-card/40 z-[var(--z-sidebar)]">
            <Sidebar />
          </aside>
        )}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
