import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { isAuthConfigured } from '@/lib/auth'
import { Zap, ShieldCheck } from 'lucide-react'

export function Shell() {
  const authed = isAuthConfigured()

  return (
    <div className="flex min-h-screen bg-surface-0">
      <Sidebar />
      <div className="ml-60 flex-1 flex flex-col min-h-screen">
        <header className="h-12 border-b border-border bg-surface-1/80 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2 text-xs font-medium text-text-secondary">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-text-primary">Nexus Engine</span>
            <span className="text-text-muted">•</span>
            <span className="text-text-muted">Web3 Payments & x402 Agent Infrastructure</span>
          </div>
          <div className="flex items-center gap-2">
            {!authed ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-600 border border-amber-500/20">
                <Zap size={12} /> Local Demo Mode
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-600 border border-emerald-500/20">
                <ShieldCheck size={12} /> AWS AgentCore Connected
              </span>
            )}
          </div>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
