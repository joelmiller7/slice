import { Plus } from 'lucide-react'
import { TokenUSDC } from '@web3icons/react'
import { MAX_MEMO_BYTES, MAX_RECIPIENTS } from '@/contract'
import { displayUsdc, newRow, utf8Length, type Row, type SplitMode, type SplitPlan } from '@/lib/splits'
import { RecipientRow } from './RecipientRow'

interface Props {
  mode: SplitMode
  setMode: (mode: SplitMode) => void
  rows: Row[]
  setRows: (rows: Row[]) => void
  totalInput: string
  setTotalInput: (value: string) => void
  memo: string
  setMemo: (value: string) => void
  plan: SplitPlan
  balanceRaw: bigint | undefined
  disabled: boolean
}

const MODES: { id: SplitMode; label: string }[] = [
  { id: 'equal', label: 'Equal' },
  { id: 'percent', label: 'Percent' },
  { id: 'amount', label: 'Amounts' },
]

export function Composer({
  mode,
  setMode,
  rows,
  setRows,
  totalInput,
  setTotalInput,
  memo,
  setMemo,
  plan,
  balanceRaw,
  disabled,
}: Props) {
  const memoBytes = utf8Length(memo)

  return (
    <section className="glass-card overflow-hidden rounded-3xl">
      <div className="spectral h-1" />
      <div className="space-y-4 p-5">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
              {mode === 'amount' ? 'Total to send' : 'Amount to split'}
            </span>
            {balanceRaw !== undefined && (
              <span className="text-xs tabular-nums" style={{ color: 'var(--subtle)' }}>
                Balance {displayUsdc(balanceRaw)} USDC
              </span>
            )}
          </div>
          <div className="field glass-inner flex items-center gap-2 rounded-2xl px-4 py-3 transition-shadow">
            {mode === 'amount' ? (
              <span className="display w-full text-4xl font-bold tabular-nums" style={{ color: 'var(--ink)' }}>
                {displayUsdc(plan.total)}
              </span>
            ) : (
              <input
                inputMode="decimal"
                value={totalInput}
                disabled={disabled}
                onChange={(event) => {
                  const value = event.target.value.replace(/[^0-9.]/g, '')
                  if (/^\d*\.?\d*$/.test(value)) setTotalInput(value)
                }}
                placeholder="0.00"
                aria-label="Total amount in USDC"
                className="display w-full min-w-0 bg-transparent text-4xl font-bold tabular-nums outline-none placeholder:text-slate-300"
                style={{ color: 'var(--ink)' }}
              />
            )}
            <span className="flex shrink-0 items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--subtle)' }}>
              <TokenUSDC variant="branded" size={20} />
              USDC
            </span>
          </div>
        </div>

        <div role="tablist" aria-label="How to split" className="grid grid-cols-3 gap-1 rounded-2xl p-1" style={{ background: 'var(--surface-muted)' }}>
          {MODES.map((item) => (
            <button
              key={item.id}
              role="tab"
              aria-selected={mode === item.id}
              disabled={disabled}
              onClick={() => setMode(item.id)}
              className="min-h-10 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
              style={
                mode === item.id
                  ? { background: 'white', color: 'var(--ink)', boxShadow: '0 1px 4px rgba(18,45,69,0.12)' }
                  : { color: 'var(--muted)' }
              }
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
              Who gets paid
            </span>
            <span className="text-xs tabular-nums" style={{ color: 'var(--subtle)' }}>
              {rows.length} of {MAX_RECIPIENTS}
            </span>
          </div>

          {rows.map((row, index) => (
            <RecipientRow
              key={row.id}
              row={row}
              index={index}
              mode={mode}
              share={plan.shares[index] ?? 0n}
              issue={plan.rowIssues[row.id]}
              canRemove={rows.length > 1 && !disabled}
              onChange={(patch) => setRows(rows.map((r) => (r.id === row.id ? { ...r, ...patch } : r)))}
              onRemove={() => setRows(rows.filter((r) => r.id !== row.id))}
            />
          ))}

          <button
            onClick={() => setRows([...rows, newRow()])}
            disabled={disabled || rows.length >= MAX_RECIPIENTS}
            className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed text-xs font-semibold transition-colors hover:bg-white/60 disabled:opacity-40"
            style={{ borderColor: 'var(--border-strong)', color: 'var(--ink-2)' }}
          >
            <Plus className="size-3.5" />
            Add person
          </button>
        </div>

        <div>
          <div className="field glass-inner flex items-center gap-2 rounded-2xl px-4 transition-shadow">
            <input
              value={memo}
              disabled={disabled}
              onChange={(event) => {
                if (utf8Length(event.target.value) <= MAX_MEMO_BYTES) setMemo(event.target.value)
              }}
              placeholder="What is this for? (optional)"
              aria-label="Note"
              className="min-h-11 w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              style={{ color: 'var(--ink)' }}
            />
            <span className="shrink-0 text-[11px] tabular-nums" style={{ color: 'var(--subtle)' }}>
              {memoBytes}/{MAX_MEMO_BYTES}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
