import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Shell } from '@/components/layout/Shell'
import { useAuthStore } from '@/store/auth'
import { useAdminStore, useUserStore } from '@/store'
import * as api from '@/lib/api'
import { Login } from '@/pages/Login'

const AdminOverview = lazy(() => import('@/pages/admin/Overview').then(m => ({ default: m.AdminOverview })))
const CredentialProviders = lazy(() => import('@/pages/admin/CredentialProviders').then(m => ({ default: m.CredentialProviders })))
const PaymentManagers = lazy(() => import('@/pages/admin/PaymentManagers').then(m => ({ default: m.PaymentManagers })))
const PaymentConnectors = lazy(() => import('@/pages/admin/PaymentConnectors').then(m => ({ default: m.PaymentConnectors })))
const AdminHowItWorks = lazy(() => import('@/pages/admin/HowItWorks').then(m => ({ default: m.AdminHowItWorks })))
const SellerSetup = lazy(() => import('@/pages/admin/SellerSetup').then(m => ({ default: m.SellerSetup })))
const SellerOrders = lazy(() => import('@/pages/admin/SellerOrders').then(m => ({ default: m.SellerOrders })))

const Dashboard = lazy(() => import('@/pages/user/Dashboard').then(m => ({ default: m.Dashboard })))
const Pay = lazy(() => import('@/pages/user/Pay').then(m => ({ default: m.Pay })))
const History = lazy(() => import('@/pages/user/History').then(m => ({ default: m.History })))
const Instruments = lazy(() => import('@/pages/user/Instruments').then(m => ({ default: m.Instruments })))
const ConnectAgent = lazy(() => import('@/pages/user/ConnectAgent').then(m => ({ default: m.ConnectAgent })))
const Sessions = lazy(() => import('@/pages/user/Sessions').then(m => ({ default: m.Sessions })))
const AgentChat = lazy(() => import('@/pages/user/AgentChat').then(m => ({ default: m.AgentChat })))

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
    </div>
  )
}

export default function App() {
  const { isAuthenticated, initialized, role, checkSession } = useAuthStore()

  useEffect(() => { checkSession() }, [checkSession])

  const adminStore = useAdminStore()
  const userStore = useUserStore()

  // Prefetch data based on role
  useEffect(() => {
    if (!isAuthenticated || !role) return

    const isAdmin = role === 'admin'

    if (isAdmin && !adminStore._prefetched) {
      const prefetchAdmin = async () => {
        try {
          const [cpRes, mgRes] = await Promise.allSettled([
            api.listCredentialProviders(),
            api.listPaymentManagers(),
          ])

          if (cpRes.status === 'fulfilled')
            adminStore.setCredentialProviders(cpRes.value.credentialProviders || [])

          if (mgRes.status === 'fulfilled') {
            const managers = mgRes.value.paymentManagers || []
            adminStore.setPaymentManagers(managers)

            const connResults = await Promise.allSettled(
              managers.map((m: any) =>
                api.listPaymentConnectors(m.paymentManagerId)
                  .then(d => (d.paymentConnectors || []).map((c: any) => ({ ...c, paymentManagerId: m.paymentManagerId })))
              )
            )
            const allConnectors = connResults
              .filter((r): r is PromiseFulfilledResult<any[]> => r.status === 'fulfilled')
              .flatMap(r => r.value)
            adminStore.setPaymentConnectors(allConnectors)
          }
        } catch { /* best-effort */ }
        adminStore.markPrefetched()
      }
      prefetchAdmin()
    }

    if (!isAdmin && !userStore._prefetched) {
      const prefetchUser = async () => {
        try {
          const optsRes = await api.getPaymentOptions().catch(() => null)
          const options = optsRes?.paymentOptions || []

          const managers = options.map((o) => ({
            paymentManagerId: o.paymentManagerId,
            paymentManagerArn: o.paymentManagerArn,
            name: o.managerName,
            status: o.status,
          }))
          adminStore.setPaymentManagers(managers as any)

          const allConnectors = options.flatMap((o) =>
            (o.connectors || []).map((c) => ({
              paymentConnectorId: c.paymentConnectorId,
              paymentManagerId: o.paymentManagerId,
              name: c.connectorName,
              type: c.type,
              status: c.status,
            }))
          )
          adminStore.setPaymentConnectors(allConnectors as any)

          const managerArns = managers.map((m) => m.paymentManagerArn).filter(Boolean)

          const [instrRes, sessRes] = await Promise.all([
            api.listAllInstruments(managerArns).catch(() => ({ paymentInstruments: [] })),
            api.listAllSessions(managerArns).catch(() => ({ paymentSessions: [] })),
          ])

          const listedInstruments = instrRes.paymentInstruments || []
          const enrichedInstruments = await Promise.all(
            listedInstruments.map(async (inst: any) => {
              const managerArn = inst.paymentManagerArn
              const connectorId = inst.paymentConnectorId
              if (!managerArn || !connectorId) return inst
              try {
                const full = await api.getInstrument(inst.paymentInstrumentId, { managerArn, connectorId })
                return { ...inst, ...(full.paymentInstrument || {}) }
              } catch {
                return inst
              }
            })
          )
          if (enrichedInstruments.length > 0) userStore.setInstruments(enrichedInstruments)
          if ((sessRes.paymentSessions || []).length > 0) userStore.setSessions(sessRes.paymentSessions || [])
        } catch { /* best-effort */ }
        userStore.markPrefetched()
      }
      prefetchUser()
    }
  }, [isAuthenticated, role])

  if (!initialized) return <PageLoader />
  if (!isAuthenticated) return <Login />

  const defaultPath = role === 'admin' ? '/admin' : '/user'

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<Shell />}>
          {/* Admin routes — only for admin role */}
          {role === 'admin' && (
            <>
              <Route path="/admin" element={<AdminOverview />} />
              <Route path="/admin/credential-providers" element={<CredentialProviders />} />
              <Route path="/admin/payment-managers" element={<PaymentManagers />} />
              <Route path="/admin/payment-connectors" element={<PaymentConnectors />} />
              <Route path="/admin/seller-setup" element={<SellerSetup />} />
              <Route path="/admin/seller-orders" element={<SellerOrders />} />
              <Route path="/admin/how-it-works" element={<AdminHowItWorks />} />
            </>
          )}

          {/* Nexus Pay User routes */}
          {(role === 'user' || !role) && (
            <>
              <Route path="/user" element={<Dashboard />} />
              <Route path="/user/pay" element={<Pay />} />
              <Route path="/user/wallets" element={<Instruments />} />
              <Route path="/user/agent" element={<AgentChat />} />
              <Route path="/user/allowances" element={<Sessions />} />
              <Route path="/user/history" element={<History />} />
              {/* Backwards compat aliases */}
              <Route path="/user/sessions" element={<Navigate to="/user/allowances" replace />} />
              <Route path="/user/connect-agent" element={<ConnectAgent />} />
            </>
          )}

          <Route path="/" element={<Navigate to={defaultPath} replace />} />
          <Route path="*" element={<Navigate to={defaultPath} replace />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
