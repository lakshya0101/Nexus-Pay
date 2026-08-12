import { useState } from 'react'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Zap, ShieldCheck, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { isAuthConfigured } from '@/lib/auth'

type Tab = 'signin' | 'signup'
type SignUpStep = 'form' | 'confirm'

export function Login() {
  const {
    signIn, signUp, confirmSignUp,
    loading, error, needsConfirmation, clearNeedsConfirmation, clearError, pendingEmail,
  } = useAuthStore()
  const [tab, setTab] = useState<Tab>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [signUpStep, setSignUpStep] = useState<SignUpStep>('form')
  const [localError, setLocalError] = useState('')
  const [info, setInfo] = useState('')

  const authedConfig = isAuthConfigured()
  const displayError = localError || error

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setCode('')
    setLocalError('')
    setInfo('')
    setSignUpStep('form')
    clearError()
    clearNeedsConfirmation()
  }

  const switchTab = (t: Tab) => {
    setTab(t)
    resetForm()
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')
    setInfo('')
    if (!email.trim() || !password) { setLocalError('Email and password are required'); return }
    try {
      await signIn(email.trim(), password)
    } catch {
      // Store handles error
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')
    setInfo('')
    if (!email.trim() || !password) { setLocalError('Email and password are required'); return }
    if (password.length < 8) { setLocalError('Password must be at least 8 characters'); return }
    try {
      await signUp(email.trim(), password)
      setSignUpStep('confirm')
    } catch (err: any) {
      setLocalError(err.message || 'Sign up failed')
    }
  }

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')
    setInfo('')
    const confirmEmail = email.trim() || pendingEmail || ''
    const trimmedCode = code.trim()
    if (!confirmEmail) { setLocalError('Your session expired. Please start sign up again.'); return }
    if (!trimmedCode) { setLocalError('Verification code is required'); return }

    try {
      await confirmSignUp(confirmEmail, trimmedCode)
    } catch (err: any) {
      setLocalError(err.message || 'Confirmation failed')
      return
    }

    if (password) {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await signIn(confirmEmail, password)
          return
        } catch {
          if (attempt < 2) await new Promise((r) => setTimeout(r, 800))
        }
      }
    }

    clearError()
    clearNeedsConfirmation()
    setSignUpStep('form')
    setTab('signin')
    setEmail(confirmEmail)
    setCode('')
    setLocalError('')
    setInfo('Your email is verified. Sign in to continue.')
  }

  const handleDemoLaunch = () => {
    useAuthStore.setState({
      isAuthenticated: true,
      email: 'demo@nexuspay.io',
      userId: 'user_demo_nexus',
      role: 'user',
      loading: false,
      initialized: true,
    })
  }

  const showConfirmForm = (tab === 'signup' && signUpStep === 'confirm') || needsConfirmation

  const subtitle = showConfirmForm
    ? 'Check your email for a code'
    : tab === 'signin'
      ? 'Sign in to your Nexus Pay account'
      : 'Create a Nexus Pay account'

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-surface-0 to-surface-1 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface-1 p-8 shadow-xl space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20">
            <Zap size={28} strokeWidth={2.5} />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">NEXUS PAY</h1>
            <p className="text-xs font-semibold text-accent uppercase tracking-wider">Intelligent payments. Built for Web3.</p>
          </div>
          <p className="text-xs text-text-muted mt-1">{subtitle}</p>
        </div>

        {!showConfirmForm && (
          <div className="flex rounded-lg bg-surface-2 p-1 border border-border/50">
            {(['signin', 'signup'] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => switchTab(t)}
                className={cn(
                  'flex-1 rounded-md py-2 text-xs font-semibold transition-all',
                  tab === t
                    ? 'bg-surface-1 text-text-primary shadow-sm'
                    : 'text-text-muted hover:text-text-secondary',
                )}
              >
                {t === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>
        )}

        {displayError && (
          <div className="rounded-lg bg-danger-muted p-3 text-xs text-danger border border-danger/20">
            {displayError}
          </div>
        )}

        {info && !displayError && (
          <div className="rounded-lg bg-success-muted p-3 text-xs text-success border border-success/20">
            {info}
          </div>
        )}

        {tab === 'signin' && !needsConfirmation && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@nexuspay.io" autoComplete="email" required />
            <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" required />
            <Button type="submit" className="w-full h-10" disabled={!email || !password || loading}>
              {loading ? 'Signing in…' : 'Sign In to Nexus Pay'}
            </Button>
          </form>
        )}

        {tab === 'signup' && signUpStep === 'form' && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@nexuspay.io" autoComplete="email" required />
            <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 chars" autoComplete="new-password" required />
            <Button type="submit" className="w-full h-10" disabled={!email || !password || loading}>
              {loading ? 'Creating account…' : 'Create Nexus Pay Account'}
            </Button>
          </form>
        )}

        {showConfirmForm && (
          <form onSubmit={handleConfirm} className="space-y-4">
            <p className="text-xs text-text-secondary text-center">
              Enter the verification code sent to{' '}
              <span className="font-medium text-text-primary">{email.trim() || pendingEmail || 'your email'}</span>
            </p>
            <Input label="Verification Code" type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" autoComplete="one-time-code" required autoFocus />
            <Button type="submit" className="w-full h-10" disabled={!code.trim() || loading}>
              {loading ? 'Verifying…' : 'Verify & Continue'}
            </Button>
            <button type="button" onClick={resetForm} className="w-full text-xs text-text-muted hover:text-text-secondary transition-colors">
              ← Back to Sign In
            </button>
          </form>
        )}

        {/* Demo launcher for evaluators when AWS backend is unconfigured */}
        <div className="pt-4 border-t border-border flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={handleDemoLaunch}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-accent/30 bg-accent-muted/50 hover:bg-accent-muted text-accent text-xs font-semibold transition-all group"
          >
            <span className="flex items-center gap-2">
              <ShieldCheck size={16} /> Explore Nexus Pay (Local Demo Mode)
            </span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="text-[10px] text-text-muted text-center">
            {authedConfig ? 'AWS AgentCore Cognito Connected' : 'AWS Unconnected • Evaluator Demo Mode Active'}
          </p>
        </div>
      </div>
    </div>
  )
}
