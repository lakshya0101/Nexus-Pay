import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function Shell() {
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
      <main className="ml-60 flex-1 p-6 overflow-hidden relative z-10 bg-transparent">
        <div key={location.pathname} className="animate-refocus">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
