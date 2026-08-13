/**
 * Connect Agent — Privy session-signer attach page.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  usePrivy,
  useSessionSigners,
  useLoginWithEmail,
  type LinkedAccountWithMetadata,
  type WalletWithMetadata,
} from '@privy-io/react-auth'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/store/auth'
import { Info, ShieldCheck, ArrowLeft, Mail } from 'lucide-react'

const PRIVY_SIGNER_ID = import.meta.env.VITE_PRIVY_SIGNER_ID as string | undefined

export function ConnectAgent() {
  const navigate = useNavigate()
  const { email: userEmail } = useAuthStore()
  const { user, authenticated: isPrivyAuthenticated } = usePrivy()
  const { addSessionSigners } = useSessionSigners()
  const { sendCode, loginWithCode } = useLoginWithEmail()

  // Email OTP state — only used when the user isn't signed into Privy yet.
  const [otpEmail, setOtpEmail] = useState(userEmail || '')
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpSending, setOtpSending] = useState(false)
  const [otpVerifying, setOtpVerifying] = useState(false)

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  // Privy embedded wallets on the signed-in account.
  const privyWallets = (
    user?.linkedAccounts ?? ([] as LinkedAccountWithMetadata[])
  ).filter(
    (a: LinkedAccountWithMetadata): a is WalletWithMetadata =>
      a.type === 'wallet' && (a as WalletWithMetadata).walletClientType === 'privy',
  )

  const handleSendOtp = async () => {
    setOtpSending(true); setError('')
    try {
      await sendCode({ email: otpEmail })
      setOtpSent(true)
    } catch (err: any) {
      setError(err?.message || 'Failed to send verification code')
    } finally {
      setOtpSending(false)
    }
  }

  const handleVerifyOtp = async () => {
    setOtpVerifying(true); setError('')
    try {
      await loginWithCode({ code: otpCode })
      // Privy session is now active; the wallet list resolves on re-render.
    } catch (err: any) {
      setError(err?.message || 'Invalid verification code')
    } finally {
      setOtpVerifying(false)
    }
  }

  const handleGiveAccess = async () => {
    if (!PRIVY_SIGNER_ID) {
      setError('Signer ID is not configured (VITE_PRIVY_SIGNER_ID).')
      return
    }
    if (privyWallets.length === 0) {
      setError('No Privy wallets found on this account. Create a Privy instrument first, then return here.')
      return
    }

    setBusy(true); setError('')
    try {
      await Promise.all(
        privyWallets.map((wallet) =>
          addSessionSigners({
            address: wallet.address,
            signers: [{ signerId: PRIVY_SIGNER_ID, policyIds: [] }],
          }).catch((err: unknown) => {
            const msg = err instanceof Error ? err.message : String(err)
            // Idempotent — Privy throws "already exists" when the signer is
            // already attached. Treat that as success.
            if (!msg.toLowerCase().includes('already')) throw err
          }),
        ),
      )
      setDone(true)
    } catch (err: any) {
      setError(err?.message || 'Failed to connect agent. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between border-b border-border/10 pb-4">
        <div>
          <h1 className="text-3xl font-bold font-serif text-text-primary tracking-tight">Connect Agent</h1>
          <p className="text-xs text-text-secondary mt-1 leading-relaxed font-medium">
            Authorize the agent to sign payments from your Privy wallets
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => navigate('/user')} icon={<ArrowLeft size={14} />}>
          Back to Instruments
        </Button>
      </div>

      <Card className="mx-auto max-w-lg space-y-6 p-8 border border-border shadow-xl">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-accent-muted p-2.5 text-accent border border-accent/15">
            <ShieldCheck size={22} strokeWidth={1.8} />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-sm font-bold text-text-primary tracking-wide">
              Give your agent access to your wallets
            </h2>
            <p className="text-xs leading-relaxed text-text-secondary font-medium">
              Your agent will be able to send transactions and spend funds from your
              Privy wallets on your behalf. You can revoke access at any time from the
              Privy dashboard.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-border/40 bg-surface-2 px-3.5 py-3 shadow-inner">
          <Info className="mt-0.5 size-4 shrink-0 text-text-secondary" />
          <p className="text-xs leading-relaxed text-text-secondary font-medium">
            Transactions initiated by your agent cannot be reversed.
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-danger-muted border border-danger/10 px-3.5 py-2.5 text-xs text-danger leading-relaxed animate-fade-in-up">{error}</div>
        )}

        {done ? (
          <div className="rounded-lg bg-success-muted border border-success/10 px-3.5 py-3.5 text-xs text-success leading-relaxed animate-fade-in-up">
            Agent connected. The session signer is attached to{' '}
            <span className="font-bold">{privyWallets.length === 1 ? 'your wallet' : `${privyWallets.length} wallets`}</span> —
            the agent can now sign x402 payments. You can close this page.
          </div>
        ) : !isPrivyAuthenticated ? (
          // ── Step 1: sign into Privy with the wallet owner's email ──
          <div className="space-y-4 pt-2 border-t border-border/10">
            <p className="text-xs text-text-secondary font-semibold">
              Sign in with the email that owns your Privy wallets to continue.
            </p>
            {!otpSent ? (
              <div className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  value={otpEmail}
                  onChange={(e) => setOtpEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
                <Button
                  className="w-full mt-2"
                  disabled={otpSending || !otpEmail}
                  onClick={handleSendOtp}
                  icon={<Mail size={14} />}
                >
                  {otpSending ? 'Sending…' : 'Send verification code'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Input
                  label={`Verification code sent to ${otpEmail}`}
                  type="text"
                  inputMode="numeric"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  required
                  autoFocus
                />
                <Button
                  className="w-full mt-2"
                  disabled={otpVerifying || !otpCode}
                  onClick={handleVerifyOtp}
                >
                  {otpVerifying ? 'Verifying…' : 'Verify and continue'}
                </Button>
                <button
                  type="button"
                  className="w-full text-center text-xs text-text-muted hover:text-text-primary transition-colors duration-300 font-semibold mt-1"
                  onClick={() => { setOtpSent(false); setOtpCode('') }}
                >
                  Use a different email
                </button>
              </div>
            )}
          </div>
        ) : (
          // ── Step 2: attach the session signer across all Privy wallets ──
          <div className="space-y-4 pt-2 border-t border-border/10">
            <p className="text-xs text-text-secondary font-medium">
              {privyWallets.length === 0
                ? 'No Privy wallets found on this account yet. Create a Privy instrument first, then return here.'
                : `Found ${privyWallets.length} Privy wallet${privyWallets.length === 1 ? '' : 's'} on this account.`}
            </p>
            <Button
              className="w-full mt-2"
              disabled={busy || privyWallets.length === 0}
              onClick={handleGiveAccess}
              icon={<ShieldCheck size={14} />}
            >
              {busy ? 'Connecting your agent…' : 'Give access'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
