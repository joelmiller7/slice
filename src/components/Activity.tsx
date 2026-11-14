import { ExternalLink, History } from 'lucide-react'
import { useAccount } from 'wagmi'
import { txUrl } from '@/contract'
import { displayUsdc } from '@/lib/splits'
import { useSplitActivity } from '@/hooks/useSplitActivity'

export function Activity({ refreshKey }: { refreshKey: number }) {
  const { address } = useAccount()
  const { data, isLoading, isError } = useSplitActivity(address, refreshKey)

  return (
    <section className="glass-card rounded-3xl p-5">
      <div className="mb-3 flex items-center gap-2">
        <History className="size-4" style={{ color: 'var(--muted)' }} />
        <h2 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
          Your recent splits
        </h2>
      </div>

      {!address && (
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          Connect your wallet to see splits you have sent.
        </p>
      )}
      {address && isLoading && (
        <div className="space-y-2" aria-busy>
          {[0, 1].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-2xl" style={{ background: 'var(--surface-muted)' }} />
          ))}
        </div>
      )}
      {address && isError && (
        <p className="text-xs" style={{ color: 'var(--danger)' }}>
          Could not load activity right now. Try refreshing.
        </p>
      )}
      {address && data && data.items.length === 0 && (
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          No splits yet{data.partial ? ' in the recent blocks searched' : ''}. Your first one will show up here.
        </p>
      )}
      {data && data.items.length > 0 && (
        <ul className="space-y-2">
          {data.items.map((item) => (
            <li key={item.hash} className="glass-inner flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                  {item.memo || `Split #${item.splitId.toString()}`}
                </div>
                <div className="text-[11px] tabular-nums" style={{ color: 'var(--subtle)' }}>
                  {item.recipientCount} {item.recipientCount === 1 ? 'person' : 'people'}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--ink)' }}>
                  {displayUsdc(item.total)}
                </span>
                <a
                  href={txUrl(item.hash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`View split ${item.splitId.toString()} on explorer`}
                  className="flex size-8 items-center justify-center rounded-full hover:bg-black/5"
                  style={{ color: 'var(--accent-hover)' }}
                >
                  <ExternalLink className="size-3.5" />
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
      {data?.partial && data.items.length > 0 && (
        <p className="mt-3 text-[11px]" style={{ color: 'var(--subtle)' }}>
          Showing the most recent splits found in the latest {data.scannedBlocks.toString()} blocks.
        </p>
      )}
    </section>
  )
}
