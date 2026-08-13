// Buyer library: displays the caller's digital purchases + saved media (order
// and purchase history). Settlement is stablecoin (USDC); no payment card data
// is handled here. If extended to card payments, PCI-DSS controls would apply.
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import * as api from '@/lib/api'
import { Library as LibraryIcon, Download, RefreshCw, FileText, Image as ImageIcon, AlertTriangle } from 'lucide-react'

const STOREFRONT_API = (import.meta.env.VITE_STOREFRONT_API_URL as string) || ''

type PurchaseItem = {
  kind: 'purchase'
  orderId: string
  name: string
  productId: string
  purchasedAt: string
  downloaded: boolean
  refundable: boolean
}
type GeneratedItem = {
  kind: 'generated'
  key: string
  name: string
  size: number
  createdAt: string
  url: string
}
type LibraryItem = PurchaseItem | GeneratedItem

// Simple check for image extension
function isImage(name: string) {
  return /\.(png|jpe?g|gif|webp|svg)$/i.test(name)
}

export function Library() {
  const [items, setItems] = useState<LibraryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = async () => {
    setLoading(true)
    setError('')
    try {
      const r = await api.getLibrary()
      setItems((r.items || []) as LibraryItem[])
    } catch (e: any) {
      setError(e.message || 'Failed to load library')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  const downloadHref = (orderId: string) =>
    `${STOREFRONT_API.replace(/\/+$/, '')}/orders/${orderId}/download`

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between border-b border-border/10 pb-4">
        <div>
          <h1 className="text-3xl font-bold font-serif text-text-primary tracking-tight">Library</h1>
          <p className="text-xs text-text-secondary mt-1 leading-relaxed font-medium">
            Your purchased digital goods and saved generated images. Downloading a purchased file makes it non-refundable.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={refresh} disabled={loading} icon={<RefreshCw size={13} className={loading ? 'animate-spin' : ''} />}>
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-danger/10 bg-danger-muted p-4">
          <p className="text-sm text-danger font-medium">{error}</p>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<LibraryIcon size={24} />}
          title="Your library is empty"
          description="Buy a digital product or generate an image with the agent, and it will appear here."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => (
            item.kind === 'generated' ? (
              <Card key={item.key} className="flex flex-col gap-4 border border-border shadow-sm bg-surface-1 hover:bg-surface-2 transition-all duration-300 ease-out hover:-translate-y-0.5">
                <div className="aspect-video rounded-lg bg-surface-2 flex items-center justify-center overflow-hidden border border-border/20 shadow-inner">
                  {isImage(item.name) ? (
                    <img src={item.url} alt={item.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <FileText size={32} className="text-text-secondary" />
                  )}
                </div>
                <div className="flex items-start gap-3 px-1">
                  <div className="rounded-lg bg-accent-muted p-2 text-accent border border-accent/10 shrink-0">
                    <ImageIcon size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-text-primary truncate">{item.name}</p>
                    <p className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider mt-0.5">Generated</p>
                  </div>
                </div>
                <a
                  href={item.url}
                  download={item.name}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-lg bg-accent text-white px-3 py-2 text-xs font-bold hover:bg-accent-hover transition-colors duration-300 shadow-sm shadow-accent/20"
                >
                  <Download size={13} /> Download
                </a>
              </Card>
            ) : (
              <Card key={item.orderId} className="flex flex-col gap-4 border border-border shadow-sm bg-surface-1 hover:bg-surface-2 transition-all duration-300 ease-out hover:-translate-y-0.5">
                <div className="aspect-video rounded-lg bg-surface-2 flex items-center justify-center border border-border/20 shadow-inner">
                  <FileText size={32} className="text-text-secondary animate-pulse" />
                </div>
                <div className="flex items-start gap-3 px-1">
                  <div className="rounded-lg bg-accent-muted p-2 text-accent border border-accent/10 shrink-0">
                    <FileText size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-text-primary truncate">{item.name}</p>
                    <p className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider mt-0.5">Purchased Product</p>
                  </div>
                </div>
                {item.refundable ? (
                  <div className="flex items-start gap-2 rounded-lg bg-warning-muted border border-warning/15 px-3 py-2.5 mx-1 shadow-inner">
                    <AlertTriangle size={13} className="text-warning mt-0.5 shrink-0" />
                    <p className="text-[10px] text-text-secondary leading-snug font-medium">
                      Downloading makes this order non-refundable.
                    </p>
                  </div>
                ) : (
                  <div className="bg-surface-2 border border-border/30 rounded-lg px-3 py-2 mx-1 text-center">
                    <p className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider">Downloaded · Non-refundable</p>
                  </div>
                )}
                <a
                  href={downloadHref(item.orderId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-lg bg-accent text-white px-3 py-2 text-xs font-bold hover:bg-accent-hover transition-colors duration-300 shadow-sm shadow-accent/20"
                >
                  <Download size={13} /> Download
                </a>
              </Card>
            )
          ))}
        </div>
      )}
    </div>
  )
}
