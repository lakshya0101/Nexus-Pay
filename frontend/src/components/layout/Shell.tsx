import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { isAuthConfigured } from '@/lib/auth'
import { Zap, ShieldCheck } from 'lucide-react'

export function Shell() {
  const authed = isAuthConfigured()
  const location = useLocation()

  return (
    <div className="flex min-h-screen relative bg-transparent">
      {/* Cinematic Multi-layer Background Ambient Light System */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#050607]">
        {/* Layer 1: Emerald Radial Glow */}
        <div className="absolute top-[-25%] left-[-10%] w-[800px] h-[800px] rounded-full bg-accent/4 blur-[140px] animate-ambient-1" />
        {/* Layer 2: Secondary Graphite/Green Glow */}
        <div className="absolute bottom-[-15%] right-[-5%] w-[700px] h-[700px] rounded-full bg-emerald-500/3 blur-[120px] animate-ambient-2" />
        {/* Layer 3: Warm Purple/Graphite Glow */}
        <div className="absolute top-[30%] right-[20%] w-[600px] h-[600px] rounded-full bg-purple-500/2 blur-[130px] animate-ambient-3" />
      </div>

      <Sidebar />
      <div className="ml-60 flex-1 flex flex-col min-h-screen relative z-10 bg-transparent">
        <header className="h-12 border-b border-border bg-surface-1/40 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2 text-xs font-medium text-text-secondary">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-text-primary">Nexus Engine</span>
            <span className="text-text-muted">•</span>
            <span className="text-text-muted">Web3 Payments & x402 Agent Infrastructure</span>
          </div>
          <div className="flex items-center gap-2">
            {!authed ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-500 border border-amber-500/20">
                <Zap size={12} /> Local Demo Mode
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-500 border border-emerald-500/20">
                <ShieldCheck size={12} /> AWS AgentCore Connected
              </span>
            )}
          </div>
        </header>
        <main className="flex-1 p-6 overflow-hidden relative">
          <div key={location.pathname} className="animate-refocus">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
