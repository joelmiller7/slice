import { useCallback, useMemo, useState } from 'react'
import { Header } from '@/components/Header'
import { Composer } from '@/components/Composer'
import { ActionPanel } from '@/components/ActionPanel'
import { Activity } from '@/components/Activity'
import { useSplitFlow } from '@/hooks/useSplitFlow'
import { computeSplit, newRow, type Row, type SplitMode } from '@/lib/splits'

const initialRows = (): Row[] => [newRow(), newRow()]

export default function App() {
  const [mode, setMode] = useState<SplitMode>('equal')
  const [rows, setRows] = useState<Row[]>(initialRows)
  const [totalInput, setTotalInput] = useState('')
  const [memo, setMemo] = useState('')
  const [activityKey, setActivityKey] = useState(0)

  const plan = useMemo(() => computeSplit(mode, rows, totalInput), [mode, rows, totalInput])
  const onSent = useCallback(() => setActivityKey((key) => key + 1), [])
  const flow = useSplitFlow(plan, memo, onSent)

  const reset = () => {
    flow.clearReceipt()
    setRows(initialRows())
    setTotalInput('')
    setMemo('')
  }

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div
          style={{
            position: 'absolute',
            top: '8%',
            left: '5%',
            width: 280,
            height: 280,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(133,177,237,0.22) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '8%',
            right: '8%',
            width: 260,
            height: 260,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,205,131,0.2) 0%, transparent 70%)',
            filter: 'blur(58px)',
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-md px-4 pb-24 pt-6">
        <Header />

        <div className="mb-5">
          <h1 className="display text-balance text-3xl font-bold" style={{ color: 'var(--ink)' }}>
            Pay everyone at once
          </h1>
          <p className="mt-1.5 text-pretty text-sm" style={{ color: 'var(--muted)' }}>
            Split one USDC payment across friends, teammates, or vendors. One approval, one transaction.
          </p>
        </div>

        <main className="space-y-3">
          <Composer
            mode={mode}
            setMode={setMode}
            rows={rows}
            setRows={setRows}
            totalInput={totalInput}
            setTotalInput={setTotalInput}
            memo={memo}
            setMemo={setMemo}
            plan={plan}
            balanceRaw={flow.balanceRaw}
            disabled={flow.busy || flow.receipt !== null}
          />
          <ActionPanel plan={plan} flow={flow} onReset={reset} />
          <Activity refreshKey={activityKey} />
        </main>
      </div>
    </div>
  )
}
