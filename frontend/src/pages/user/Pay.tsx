import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '@/store'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { isAuthConfigured } from '@/lib/auth'
import { getWalletDetails } from '@/lib/utils'
import { ArrowRight, Zap, CheckCircle2 } from 'lucide-react'

export function Pay() {
  const navigate = useNavigate()
  const { instruments, addTransaction } = useUserStore()
  const isConnected = isAuthConfigured()

  const [step, setStep] = useState<1 | 2>(1)
  const [selectedWalletId, setSelectedWalletId] = useState(instruments[0]?.paymentInstrumentId || '')
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('10.00')
  const [network, setNetwork] = useState<'BASE_SEPOLIA' | 'SOLANA_DEVNET'>('BASE_SEPOLIA')
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const selectedWallet = instruments.find((i) => i.paymentInstrumentId === selectedWalletId) || instruments[0]
  const rawAddr = selectedWallet ? getWalletDetails(selectedWallet).walletAddress : ''
  const walletTruncAddr = rawAddr ? (rawAddr.length > 12 ? rawAddr.slice(0, 6) + '…' + rawAddr.slice(-4) : rawAddr) : '0x71C7...976F'

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault()
    if (!recipient.trim() || !amount || parseFloat(amount) <= 0) return
    setStep(2)
  }

  const handleExecutePayment = async () => {
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 1200)) // smooth user feedback pause

    // Add local demo transaction record
    addTransaction({
      processPaymentId: `tx_nexus_demo_${Date.now().toString().slice(-6)}`,
      paymentManagerArn: selectedWallet?.paymentManagerArn || '',
      paymentSessionId: 'ps_nexus_manual_pay',
      paymentInstrumentId: selectedWallet?.paymentInstrumentId || '',
      paymentType: 'CRYPTO_DIRECT_PAY',
      status: 'DEMO',
      createdAt: new Date().toISOString(),
    })

    setSubmitting(false)
    setSuccessMsg(`Simulated transfer of ${amount} USDC on ${network}`)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Send Web3 Payment</h1>
        <p className="text-xs text-text-secondary">
          Initiate direct USDC transfers across Base Sepolia or Solana Devnet.
        </p>
      </div>

      {!isConnected && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600">
          <Zap size={16} className="shrink-0" />
          <span>
            <strong>Demo Mode — AWS payment backend not connected:</strong> Payments will execute as local simulations. No real funds are transferred.
          </span>
        </div>
      )}

      {successMsg ? (
        <Card>
          <div className="py-8 px-4 flex flex-col items-center justify-center text-center space-y-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
              <CheckCircle2 size={32} />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-text-primary">Demo Payment Simulated</h2>
              <p className="text-xs font-semibold text-amber-600">
                No real funds were transferred. AWS payment infrastructure is not connected.
              </p>
              <p className="text-[11px] text-text-muted">{successMsg} • Recipient: {recipient}</p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" size="sm" onClick={() => { setSuccessMsg(''); setStep(1); setRecipient('') }}>
                Make Another Payment
              </Button>
              <Button variant="primary" size="sm" onClick={() => navigate('/user/history')}>
                View in History →
              </Button>
            </div>
          </div>
        </Card>
      ) : step === 1 ? (
        <Card title="Payment Details" description="Step 1 of 2: Configure source wallet and recipient">
          <form onSubmit={handleNextStep} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1.5">Source Payment Wallet</label>
              <select
                value={selectedWalletId}
                onChange={(e) => setSelectedWalletId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-border bg-surface-1 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
              >
                {instruments.map((i) => {
                  const d = getWalletDetails(i)
                  const addr = d.walletAddress ? (d.walletAddress.length > 12 ? d.walletAddress.slice(0, 6) + '…' + d.walletAddress.slice(-4) : d.walletAddress) : i.paymentInstrumentId
                  return (
                    <option key={i.paymentInstrumentId} value={i.paymentInstrumentId}>
                      {d.network || 'BASE_SEPOLIA'} — {addr}
                    </option>
                  )
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1.5">Network & Token</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setNetwork('BASE_SEPOLIA')}
                  className={`flex items-center justify-between p-3 rounded-xl border text-xs font-medium transition-all ${network === 'BASE_SEPOLIA' ? 'border-accent bg-accent-muted text-accent font-semibold' : 'border-border bg-surface-1 text-text-secondary hover:bg-surface-2'}`}
                >
                  <span>Base Sepolia (EVM)</span>
                  <span className="text-[10px] font-bold">USDC</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNetwork('SOLANA_DEVNET')}
                  className={`flex items-center justify-between p-3 rounded-xl border text-xs font-medium transition-all ${network === 'SOLANA_DEVNET' ? 'border-purple-500 bg-purple-500/10 text-purple-600 font-semibold' : 'border-border bg-surface-1 text-text-secondary hover:bg-surface-2'}`}
                >
                  <span>Solana Devnet</span>
                  <span className="text-[10px] font-bold">USDC</span>
                </button>
              </div>
            </div>

            <Input
              label="Recipient Address or Merchant ID"
              placeholder="0x... or 7Xw..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              required
            />

            <Input
              label="Amount (USDC)"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="10.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />

            <div className="pt-2">
              <Button type="submit" variant="primary" className="w-full h-10" disabled={!recipient || !amount}>
                Review Payment Summary <ArrowRight size={14} />
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Card title="Review & Confirm Payment" description="Step 2 of 2: Verify transaction details">
          <div className="space-y-4 pt-2">
            <div className="rounded-xl bg-surface-2 p-4 space-y-3 border border-border">
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-muted">Payment Amount:</span>
                <span className="font-bold text-text-primary text-sm">${amount} USDC</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-muted">Target Network:</span>
                <span className="font-semibold text-text-primary">{network}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-muted">Source Wallet:</span>
                <span className="font-mono text-text-primary">{walletTruncAddr}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-muted">Recipient:</span>
                <span className="font-mono text-text-primary">{recipient}</span>
              </div>
              <div className="flex justify-between items-center text-xs pt-2 border-t border-border">
                <span className="text-text-muted">Estimated Network Fee:</span>
                <span className="font-medium text-emerald-600">0.00 USDC (Sponsored)</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1 h-10" onClick={() => setStep(1)} disabled={submitting}>
                ← Back to Edit
              </Button>
              <Button variant="primary" className="flex-1 h-10" onClick={handleExecutePayment} disabled={submitting}>
                {submitting ? 'Simulating Payment…' : 'Confirm & Simulate Demo Payment'}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
