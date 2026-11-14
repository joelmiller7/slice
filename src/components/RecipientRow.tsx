import { X } from 'lucide-react'
import { displayUsdc, type Row, type SplitMode } from '@/lib/splits'

interface Props {
  row: Row
  index: number
  mode: SplitMode
  share: bigint
  issue?: string
  canRemove: boolean
  onChange: (patch: Partial<Row>) => void
  onRemove: () => void
}

const decimalOnly = (value: string) => value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')

export function RecipientRow({ row, index, mode, share, issue, canRemove, onChange, onRemove }: Props) {
  return (
    <div>
      <div
        className="field glass-inner flex items-center gap-2 rounded-2xl p-2 pr-2 transition-shadow"
        style={issue ? { borderColor: 'var(--danger)' } : undefined}
      >
        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums"
          style={{ background: 'var(--surface-muted)', color: 'var(--ink-2)' }}
          aria-hidden
        >
          {index + 1}
        </div>

        <input
          value={row.address}
          onChange={(event) => onChange({ address: event.target.value.trim() })}
          placeholder="Wallet address 0x..."
          aria-label={`Recipient ${index + 1} wallet address`}
          spellCheck={false}
          autoComplete="off"
          className="mono min-h-9 min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-slate-400"
          style={{ color: 'var(--ink)' }}
        />

        {mode === 'equal' ? (
          <span className="shrink-0 pr-1 text-sm font-semibold tabular-nums" style={{ color: 'var(--ink-2)' }}>
            {share > 0n ? displayUsdc(share) : '0.00'}
          </span>
        ) : (
          <div className="flex shrink-0 items-center gap-1 rounded-xl px-2" style={{ background: 'rgba(255,255,255,0.7)' }}>
            <input
              inputMode="decimal"
              value={row.value}
              onChange={(event) => onChange({ value: decimalOnly(event.target.value) })}
              placeholder={mode === 'percent' ? '0' : '0.00'}
              aria-label={mode === 'percent' ? `Recipient ${index + 1} percent` : `Recipient ${index + 1} amount in USDC`}
              className="min-h-9 w-16 bg-transparent text-right text-sm font-semibold tabular-nums outline-none placeholder:text-slate-300"
              style={{ color: 'var(--ink)' }}
            />
            <span className="text-xs" style={{ color: 'var(--subtle)' }}>
              {mode === 'percent' ? '%' : 'USDC'}
            </span>
          </div>
        )}

        <button
          onClick={onRemove}
          disabled={!canRemove}
          aria-label={`Remove recipient ${index + 1}`}
          className="flex size-9 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-black/5 disabled:opacity-25"
          style={{ color: 'var(--subtle)' }}
        >
          <X className="size-4" />
        </button>
      </div>

      {mode === 'percent' && share > 0n && !issue && (
        <p className="mt-1 pl-12 text-[11px] tabular-nums" style={{ color: 'var(--subtle)' }}>
          Receives {displayUsdc(share)} USDC
        </p>
      )}
      {issue && (
        <p className="mt-1 pl-12 text-[11px]" style={{ color: 'var(--danger)' }} role="alert">
          {issue}
        </p>
      )}
    </div>
  )
}
