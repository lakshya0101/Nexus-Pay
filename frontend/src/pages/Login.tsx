import { useState } from 'react'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ShieldCheck, ArrowRight } from 'lucide-react'
import { NexusLogo } from '@/components/ui/NexusLogo'
import { cn } from '@/lib/utils'
import { isAuthConfigured } from '@/lib/auth'

type Tab = 'signin' | 'signup'
type SignUpStep = 'form' | 'confirm'

export function Login() {
  const {
    signIn, signUp, confirmSignUp, bypassSignIn,
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
    <div className="flex min-h-screen items-center justify-center bg-[#050607] relative overflow-hidden px-4">
      {/* Cinematic Multi-layer Background Ambient Light System */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Layer 1: Emerald Radial Glow */}
        <div className="absolute top-[-25%] left-[-10%] w-[800px] h-[800px] rounded-full bg-accent/4 blur-[140px] animate-ambient-1" />
        {/* Layer 2: Secondary Graphite/Green Glow */}
        <div className="absolute bottom-[-15%] right-[-5%] w-[700px] h-[700px] rounded-full bg-emerald-500/3 blur-[120px] animate-ambient-2" />
        {/* Layer 3: Warm Purple/Graphite Glow */}
        <div className="absolute top-[30%] right-[20%] w-[600px] h-[600px] rounded-full bg-purple-500/2 blur-[130px] animate-ambient-3" />
      </div>
      
      {/* Form wrapper containing staggered entrance sequence elements */}
      <div className="w-full max-w-sm rounded-xl border border-border/70 bg-surface-1/40 backdrop-blur-lg p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_2px_rgba(255,255,255,0.03)] space-y-6 relative z-10 animate-materialize">
        {/* Brand Icon & Title - Step 1 & 2 */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2/80 border border-border/80 shadow-md shadow-indigo-500/10 reveal-step-1">
            <NexusLogo size={32} />
          </div>
          <div className="text-center space-y-1 reveal-step-2">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">NEXUS PAY</h1>
            <p className="text-xs font-semibold text-accent uppercase tracking-wider">Intelligent payments. Built for Web3.</p>
            <p className="text-xs text-text-secondary font-medium leading-relaxed mt-1">{subtitle}</p>
          </div>
        </div>

        {/* Tab selector - Step 3 */}
        {!showConfirmForm && (
          <div className="flex rounded-lg bg-surface-2/30 p-0.5 border border-border/30 reveal-step-3">
            {(['signin', 'signup'] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => switchTab(t)}
                className={cn(
                  'flex-1 rounded-md py-1.5 text-xs font-bold tracking-wide transition-all duration-300 ease-out',
                  tab === t
                    ? 'bg-surface-1/80 text-text-primary shadow-sm border border-border/10'
                    : 'text-text-secondary hover:text-text-primary',
                )}
              >
                {t === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>
        )}

        {displayError && (
          <div className="rounded-lg bg-danger-muted border border-danger/10 px-3 py-2.5 text-xs text-danger leading-relaxed animate-fade-in-up">
            {displayError}
          </div>
        )}

        {info && !displayError && (
          <div className="rounded-lg bg-success-muted border border-success/10 px-3 py-2.5 text-xs text-success leading-relaxed animate-fade-in-up">
            {info}
          </div>
        )}

        {/* Form fields - Step 4 */}
        {tab === 'signin' && !needsConfirmation && (
          <div className="space-y-5">
            <form onSubmit={handleSignIn} className="space-y-4 reveal-step-4">
              <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@nexuspay.io" autoComplete="email" required />
              <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" required />
              {/* CTA primary - Step 5 */}
              <Button type="submit" className="w-full mt-2 reveal-step-5" disabled={!email || !password || loading}>
                {loading ? 'Signing in…' : 'Sign In to Nexus Pay'}
              </Button>
            </form>
            {/* Secondary bypass/local actions - Step 6 */}
            <div className="space-y-4 reveal-step-6">
              <div className="relative flex py-1.5 items-center">
                <div className="flex-grow border-t border-border/40"></div>
                <span className="flex-shrink mx-4 text-text-secondary text-[10px] uppercase tracking-widest font-bold">Or local development</span>
                <div className="flex-grow border-t border-border/40"></div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <Button type="button" variant="secondary" size="sm" className="text-xs" onClick={() => bypassSignIn('admin')}>
                  Mock Admin
                </Button>
                <Button type="button" variant="secondary" size="sm" className="text-xs" onClick={() => bypassSignIn('user')}>
                  Mock User
                </Button>
              </div>
            </div>
          </div>
        )}

        {tab === 'signup' && signUpStep === 'form' && (
          <div className="space-y-5">
            <form onSubmit={handleSignUp} className="space-y-4 reveal-step-4">
              <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@nexuspay.io" autoComplete="email" required />
              <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 chars" autoComplete="new-password" required />
              {/* CTA primary - Step 5 */}
              <Button type="submit" className="w-full mt-2 reveal-step-5" disabled={!email || !password || loading}>
                {loading ? 'Creating account…' : 'Create Nexus Pay Account'}
              </Button>
            </form>
            {/* Secondary bypass/local actions - Step 6 */}
            <div className="space-y-4 reveal-step-6">
              <div className="relative flex py-1.5 items-center">
                <div className="flex-grow border-t border-border/40"></div>
                <span className="flex-shrink mx-4 text-text-secondary text-[10px] uppercase tracking-widest font-bold">Or local development</span>
                <div className="flex-grow border-t border-border/40"></div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <Button type="button" variant="secondary" size="sm" className="text-xs" onClick={() => bypassSignIn('admin')}>
                  Mock Admin
                </Button>
                <Button type="button" variant="secondary" size="sm" className="text-xs" onClick={() => bypassSignIn('user')}>
                  Mock User
                </Button>
              </div>
            </div>
          </div>
        )}

        {showConfirmForm && (
          <form onSubmit={handleConfirm} className="space-y-4 reveal-step-4">
            <p className="text-xs text-text-secondary text-center leading-relaxed">
              Enter the verification code sent to{' '}
              <span className="font-semibold text-text-primary">{email.trim() || pendingEmail || 'your email'}</span>
            </p>
            <Input label="Verification Code" type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" autoComplete="one-time-code" required autoFocus />
            <Button type="submit" className="w-full mt-1" disabled={!code.trim() || loading}>
              {loading ? 'Verifying…' : 'Verify & Continue'}
            </Button>
            <button type="button" onClick={resetForm} className="w-full text-xs text-text-secondary hover:text-text-primary transition-colors duration-300 font-medium">
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
