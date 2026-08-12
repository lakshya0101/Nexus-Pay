import { useState } from 'react'
import { useUserStore } from '@/store'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ArrowUpRight, Sparkles, Receipt } from 'lucide-react'

export function History() {
  const { transactions } = useUserStore()
  const [filter, setFilter] = useState<'ALL' | 'COMPLETED' | 'AGENT'>('ALL')

  const filtered = transactions.filter((tx) => {
    if (filter === 'COMPLETED') return tx.status === 'COMPLETED' || tx.status === 'DEMO'
    if (filter === 'AGENT') return tx.paymentType === 'CRYPTO_X402'
    return true
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Transaction History</h1>
          <p className="text-xs text-text-secondary">
            Audit log of all manual transfers and automated x402 AI agent micropayments.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 bg-surface-2 p-1 rounded-xl border border-border">
          {(['ALL', 'COMPLETED', 'AGENT'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${filter === f ? 'bg-surface-1 text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'}`}
            >
              {f === 'ALL' ? 'All Activity' : f === 'COMPLETED' ? 'Executed / Demo' : 'AI Agent x402'}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <div className="divide-y divide-border">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-xs text-text-muted space-y-2">
              <Receipt size={32} className="mx-auto text-text-muted/50" />
              <p>No transaction history found for selected filter.</p>
            </div>
          ) : (
            filtered.map((tx) => {
              const isAgent = tx.paymentType === 'CRYPTO_X402'
              const isDemo = tx.status === 'DEMO'
              const formattedDate = tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() + ' ' + new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'

              return (
                <div key={tx.processPaymentId} className="flex items-center justify-between p-4 hover:bg-surface-2/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold ${isAgent ? 'bg-purple-500/10 text-purple-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                      {isAgent ? <Sparkles size={18} /> : <ArrowUpRight size={18} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-text-primary">{isAgent ? 'x402 AI Agent Micropayment' : 'Direct Web3 Transfer'}</span>
                        <span className="rounded bg-surface-3 px-1.5 py-0.5 text-[9px] font-semibold text-text-secondary">Base Sepolia</span>
                      </div>
                      <p className="text-[10px] text-text-muted font-mono">{tx.processPaymentId} • {formattedDate}</p>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-4">
                    <div>
                      <p className="text-xs font-bold text-text-primary">-12.50 USDC</p>
                      <p className="text-[10px] text-text-muted">{isDemo ? 'Demo Simulation' : isAgent ? 'Autonomous x402' : 'User Initiated'}</p>
                    </div>
                    <StatusBadge status={tx.status || 'DEMO'} />
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Card>
    </div>
  )
}
