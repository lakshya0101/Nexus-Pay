import { NavLink, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, KeyRound, CreditCard, Link2, Wallet,
  BookOpen, Shield, User, LogOut,
  Store, ShoppingBag, Send, Sparkles, Sliders, History, Zap
} from 'lucide-react'
import { useAuthStore } from '@/store/auth'

const adminLinks = [
  { to: '/admin', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/admin/credential-providers', icon: KeyRound, label: 'Credential Providers' },
  { to: '/admin/payment-managers', icon: CreditCard, label: 'Payment Managers' },
  { to: '/admin/payment-connectors', icon: Link2, label: 'Payment Connectors' },
  { to: '/admin/seller-setup', icon: Store, label: 'Seller Setup' },
  { to: '/admin/seller-orders', icon: ShoppingBag, label: 'Orders' },
  { to: '/admin/how-it-works', icon: BookOpen, label: 'How It Works' },
]

const userLinks = [
  { to: '/user', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/user/pay', icon: Send, label: 'Pay' },
  { to: '/user/wallets', icon: Wallet, label: 'Wallets' },
  { to: '/user/agent', icon: Sparkles, label: 'AI Agent' },
  { to: '/user/allowances', icon: Sliders, label: 'Allowances' },
  { to: '/user/history', icon: History, label: 'History' },
]

function NavItem({ to, icon: Icon, label, end }: {
  to: string; icon: typeof LayoutDashboard; label: string; end?: boolean
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
        isActive
          ? 'bg-accent-muted text-accent font-semibold'
          : 'text-text-secondary hover:text-text-primary hover:bg-surface-3',
      )}
    >
      <Icon size={16} strokeWidth={1.8} />
      {label}
    </NavLink>
  )
}

export function Sidebar() {
  const { email, role, signOut } = useAuthStore()
  const isAdmin = role === 'admin'
  const navigate = useNavigate()

  const handleSignOut = () => {
    signOut()
    navigate('/', { replace: true })
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-border bg-surface-1">
      <div className="flex h-14 items-center gap-2.5 px-5 border-b border-border">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm">
          <Zap size={15} strokeWidth={2.5} />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-tight text-text-primary">Nexus Pay</span>
          <span className="text-[9px] font-medium text-text-muted">Web3 Payments & AI</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Main navigation">
        {isAdmin ? (
          <>
            <p className="flex items-center gap-2 px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
              <Shield size={11} /> Admin Control
            </p>
            {adminLinks.map((link) => (
              <NavItem key={link.to} {...link} />
            ))}
          </>
        ) : (
          <>
            <p className="flex items-center gap-2 px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
              <User size={11} /> Menu
            </p>
            {userLinks.map((link) => (
              <NavItem key={link.to} {...link} />
            ))}
          </>
        )}
      </nav>

      <div className="border-t border-border px-4 py-3 space-y-2">
        <div className="flex items-center gap-2">
          <p className="text-[10px] text-text-muted truncate flex-1">{email || 'demo@nexuspay.io'}</p>
          <span className={cn(
            'text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded',
            isAdmin ? 'bg-accent-muted text-accent' : 'bg-surface-3 text-text-secondary',
          )}>
            {role || 'user'}
          </span>
        </div>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-surface-3 transition-colors"
        >
          <LogOut size={12} /> Sign Out
        </button>
      </div>
    </aside>
  )
}
