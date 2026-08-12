import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserStore, useAdminStore } from '@/store'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { KpiCard } from '@/components/ui/KpiCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { getUsdcBalance, resolveInstrumentContext } from '@/lib/balance'
import { getWalletDetails } from '@/lib/utils'
import {
  Wallet, Send, Sparkles, Sliders, ArrowUpRight, ArrowDownLeft,
  Activity, RefreshCw, Zap
} from 'lucide-react'

export function Dashboard() {
  const navigate = useNavigate()
  const { instruments, sessions, transactions } = useUserStore()

  const { paymentManagers, paymentConnectors } = useAdminStore()
  const [balances, setBalances] = useState<Record<string, string>>({})
  const [loadingBalances, setLoadingBalances] = useState(false)

  // Fetch balances for active wallets
  const refreshBalances = async () => {
    setLoadingBalances(true)
    const newBalances: Record<string, string> = {}

    for (const inst of instruments) {
      const details = getWalletDetails(inst)
      if (details.walletAddress && details.network) {
        try {
          const ctx = resolveInstrumentContext(inst, paymentConnectors, paymentManagers)
          const res = await getUsdcBalance(inst, ctx)
          newBalances[inst.paymentInstrumentId] = (res && res !== '—') ? res : 'Unavailable'
        } catch {
          newBalances[inst.paymentInstrumentId] = 'Unavailable'
        }
      } else {
        newBalances[inst.paymentInstrumentId] = 'Unavailable'
      }
    }
    setBalances(newBalances)
    setLoadingBalances(false)
  }

  useEffect(() => {
    refreshBalances()
  }, [instruments])

  // Total balance calculation
  const numericBalances = Object.values(balances).map((v) => parseFloat(v)).filter((v) => !isNaN(v))
  const totalBalanceVal = numericBalances.reduce((acc, curr) => acc + curr, 0)
  const totalBalanceFormatted = numericBalances.length > 0 ? `$${totalBalanceVal.toFixed(2)} USDC` : 'Unavailable'

  // Allowance stats
  const activeSessionsCount = sessions.filter((s) => s.status === 'ACTIVE').length
  const totalAllowanceVal = sessions.reduce((acc, s) => acc + (parseFloat(s.limits?.maxSpendAmount?.value || '0') || 0), 0)
  const spentAllowanceVal = sessions.reduce((acc, s) => acc + (parseFloat(s.currentSpendAmount?.value || '0') || 0), 0)
  const remainingAllowanceVal = Math.max(0, totalAllowanceVal - spentAllowanceVal)

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-surface-1 via-surface-2 to-surface-1 p-6 rounded-2xl border border-border shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">Nexus Overview</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent border border-accent/20">
              <Zap size={12} /> Web3 Financial Hub
            </span>
          </div>
          <p className="text-xs text-text-secondary">
            Manage your multi-chain balances, pre-authorized agent allowances, and automated x402 payments.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" icon={<RefreshCw size={14} className={loadingBalances ? 'animate-spin' : ''} />} onClick={refreshBalances}>
            Sync Balances
          </Button>
          <Button variant="primary" size="sm" icon={<Send size={14} />} onClick={() => navigate('/user/pay')}>
            Make Payment
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard
          title="Aggregate Total Balance"
          value={totalBalanceFormatted}
          change={`${instruments.length} Connected Wallets`}
          icon={<Wallet className="text-accent" size={20} />}
        />
        <KpiCard
          title="Monthly Spend"
          value={`$${spentAllowanceVal.toFixed(2)} USDC`}
          change={`Of $${totalAllowanceVal.toFixed(2)} Total Limit`}
          icon={<Activity className="text-emerald-500" size={20} />}
        />
        <KpiCard
          title="Agent Allowance Remaining"
          value={`$${remainingAllowanceVal.toFixed(2)} USDC`}
          change={`${activeSessionsCount} Active Spending Rules`}
          icon={<Sliders className="text-purple-500" size={20} />}
        />
        <KpiCard
          title="AI Agent Payments"
          value={`${transactions.length} Executed`}
          change="x402 Micropayments"
          icon={<Sparkles className="text-amber-500" size={20} />}
        />
      </div>

      {/* Main Content Split: Wallets Summary & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Connected Wallets Column */}
        <div className="lg:col-span-2 space-y-4">
          <Card title="Connected Payment Instruments" description="EVM and Solana embedded wallets provisioned for manual and agent payments">
            <div className="space-y-3 pt-2">
              {instruments.length === 0 ? (
                <div className="p-6 text-center text-xs text-text-muted border border-dashed border-border rounded-xl">
                  No payment instruments provisioned yet.
                </div>
              ) : (
                instruments.map((inst) => {
                  const details = getWalletDetails(inst)
                  const rawBal = balances[inst.paymentInstrumentId]
                  const balDisplay = (rawBal && rawBal !== 'Unavailable') ? `$${rawBal} USDC` : 'Unavailable'
                  const isSol = details.network === 'SOLANA_DEVNET'

                  const truncAddr = details.walletAddress ? (details.walletAddress.length > 12 ? details.walletAddress.slice(0, 6) + '…' + details.walletAddress.slice(-4) : details.walletAddress) : (inst.paymentInstrumentId.length > 12 ? inst.paymentInstrumentId.slice(0, 8) + '…' : inst.paymentInstrumentId)

                  return (
                    <div key={inst.paymentInstrumentId} className="flex items-center justify-between p-4 rounded-xl border border-border bg-surface-1 hover:border-border-hover transition-all">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold text-xs ${isSol ? 'bg-purple-500/10 text-purple-600' : 'bg-blue-500/10 text-blue-600'}`}>
                          {isSol ? 'SOL' : 'EVM'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-text-primary">{details.network || 'BASE_SEPOLIA'}</span>
                            <StatusBadge status={inst.status || 'ACTIVE'} />
                          </div>
                          <p className="text-xs font-mono text-text-muted">{truncAddr}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-text-primary">{balDisplay}</p>
                        <p className="text-[10px] text-text-muted">On-Chain RPC Status</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
            <div className="mt-4 pt-3 border-t border-border flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => navigate('/user/wallets')}>
                Manage All Wallets →
              </Button>
            </div>
          </Card>
        </div>

        {/* Quick Actions & AI Agent Preview */}
        <div className="space-y-4">
          <Card title="Quick Payment Actions" description="Fast-track Web3 payments and agent rules">
            <div className="space-y-2 pt-2">
              <button
                onClick={() => navigate('/user/pay')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-border bg-surface-1 hover:bg-surface-2 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-muted text-accent">
                    <Send size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-text-primary">Send Web3 Payment</p>
                    <p className="text-[10px] text-text-muted">Transfer USDC on Sepolia or Solana</p>
                  </div>
                </div>
                <ArrowUpRight size={16} className="text-text-muted group-hover:text-accent group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>

              <button
                onClick={() => navigate('/user/agent')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-border bg-surface-1 hover:bg-surface-2 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-text-primary">Launch Nexus AI</p>
                    <p className="text-[10px] text-text-muted">Execute autonomous micropayments</p>
                  </div>
                </div>
                <ArrowUpRight size={16} className="text-text-muted group-hover:text-amber-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>

              <button
                onClick={() => navigate('/user/allowances')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-border bg-surface-1 hover:bg-surface-2 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600">
                    <Sliders size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-text-primary">Configure Allowances</p>
                    <p className="text-[10px] text-text-muted">Set daily agent spending rules</p>
                  </div>
                </div>
                <ArrowUpRight size={16} className="text-text-muted group-hover:text-purple-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Activity Section */}
      <Card title="Recent Activity Stream" description="Latest Web3 transactions and x402 agent executions">
        <div className="divide-y divide-border">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-xs text-text-muted">No recent transaction activity found.</div>
          ) : (
            transactions.slice(0, 5).map((tx) => (
              <div key={tx.processPaymentId} className="flex items-center justify-between py-3.5 px-2 hover:bg-surface-2/50 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                    <ArrowDownLeft size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-text-primary">x402 Agent Payment</span>
                      <span className="rounded bg-surface-3 px-1.5 py-0.5 text-[9px] font-medium text-text-secondary">Base Sepolia</span>
                    </div>
                    <p className="text-[10px] text-text-muted">Session: {tx.paymentSessionId}</p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-3">
                  <StatusBadge status={tx.status || 'DEMO'} />
                </div>
              </div>
            ))
          )}
        </div>
        <div className="mt-4 pt-3 border-t border-border flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => navigate('/user/history')}>
            View Full History →
          </Button>
        </div>
      </Card>
    </div>
  )
}
