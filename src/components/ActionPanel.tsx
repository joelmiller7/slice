import { ConnectKitButton } from 'connectkit'
import { CheckCircle2, ExternalLink, Loader2 } from 'lucide-react'
import { CHAIN_NAME, SPLITTER_ADDRESS, txUrl } from '@/contract'
import { displayUsdc, type SplitPlan } from '@/lib/splits'
import type { useSplitFlow } from '@/hooks/useSplitFlow'

type Flow = ReturnType<typeof useSplitFlow>

interface Props {
  plan: SplitPlan
  flow: Flow
  onReset: () => void
}

function ctaClass(extra = '') {
  return `flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 ${extra}`
}

export function ActionPanel({ plan, flow, onReset }: Props) {
  const { receipt } = flow
  const total = displayUsdc(plan.total)

  if (receipt) {
    return (
      <section className="glass-card rounded-3xl p-5" aria-live="polite">
        <div className="flex items-center gap-2" style={{ color: 'var(--success)' }}>
          <CheckCircle2 className="size-5" />
          <span className="text-sm font-semibold">Split sent</span>
        </div>
        <p className="display mt-3 text-3xl font-bold tabular-nums" style={{ color: 'var(--ink)' }}>
          {displayUsdc(receipt.total)} <span className="text-lg font-medium" style={{ color: 'var(--subtle)' }}>USDC</span>
        </p>
        <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
          Paid to {receipt.count} {receipt.count === 1 ? 'person' : 'people'} in one transaction
          {receipt.splitId !== undefined ? ` (split #${receipt.splitId.toString()})` : ''}.
        </p>
        <a
          href={txUrl(receipt.hash)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold"
          style={{ color: 'var(--accent-hover)' }}
        >
          View on explorer <ExternalLink className="size-3" />
        </a>
        <button onClick={onReset} className={ctaClass('mt-4')} style={{ background: 'var(--accent)' }}>
          Start a new split
        </button>
      </section>
    )
  }

  const working = flow.busy
  const spinner = (text: string) => (
    <>
      <Loader2 className="size-4 animate-spin" />
      {text}
    </>
  )

  let button: React.ReactNode
  if (!SPLITTER_ADDRESS) {
    button = (
      <button disabled className={ctaClass()} style={{ background: 'var(--accent)' }}>
        Splitter contract not configured
      </button>
    )
  } else if (!flow.isConnected) {
    button = (
      <ConnectKitButton.Custom>
        {({ show }) => (
          <button onClick={show} className={ctaClass()} style={{ background: 'var(--accent)' }}>
            Connect wallet
          </button>
        )}
      </ConnectKitButton.Custom>
    )
  } else if (flow.wrongChain) {
    button = (
      <button onClick={() => void flow.switchNetwork()} disabled={working} className={ctaClass()} style={{ background: 'var(--accent)' }}>
        {working ? spinner('Check your wallet...') : `Switch to ${CHAIN_NAME}`}
      </button>
    )
  } else if (!plan.ready) {
    const hint =
      plan.issues[0] ??
      (Object.keys(plan.rowIssues).length > 0 ? 'Fix the highlighted fields' : 'Add an amount and every address')
    button = (
      <button disabled className={ctaClass()} style={{ background: 'var(--accent)' }}>
        {hint}
      </button>
    )
  } else if (flow.insufficientBalance) {
    button = (
      <button disabled className={ctaClass()} style={{ background: 'var(--accent)' }}>
        Not enough USDC
      </button>
    )
  } else if (flow.needsApproval) {
    button = (
      <button onClick={() => void flow.approve()} disabled={working} className={ctaClass()} style={{ background: 'var(--accent)' }}>
        {flow.phase === 'wallet' ? spinner('Confirm in wallet...') : flow.phase === 'confirming' ? spinner('Confirming...') : `Allow ${total} USDC`}
      </button>
    )
  } else {
    button = (
      <button onClick={() => void flow.send()} disabled={working} className={ctaClass()} style={{ background: 'var(--accent)' }}>
        {flow.phase === 'wallet' ? spinner('Confirm in wallet...') : flow.phase === 'confirming' ? spinner('Confirming...') : `Send ${total} USDC`}
      </button>
    )
  }

  const showSteps = plan.ready && flow.isConnected && !flow.wrongChain && !flow.insufficientBalance

  return (
    <section className="glass-card rounded-3xl p-5">
      {plan.total > 0n && (
        <div className="mb-4 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span style={{ color: 'var(--muted)' }}>Total</span>
            <span className="font-semibold tabular-nums" style={{ color: 'var(--ink)' }}>
              {total} USDC
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: 'var(--muted)' }}>Recipients</span>
            <span className="font-semibold tabular-nums" style={{ color: 'var(--ink)' }}>
              {plan.shares.length}
            </span>
          </div>
          {showSteps && (
            <div className="flex items-center justify-between">
              <span style={{ color: 'var(--muted)' }}>Step</span>
              <span className="font-semibold" style={{ color: 'var(--ink)' }}>
                {flow.needsApproval ? '1 of 2: allow USDC' : flow.needsApproval === false ? 'Ready to send' : 'Checking allowance'}
              </span>
            </div>
          )}
        </div>
      )}

      {button}

      {flow.error && (
        <p className="mt-3 text-xs" style={{ color: 'var(--danger)' }} role="alert">
          {flow.error}
        </p>
      )}
      <p className="mt-3 text-center text-[11px] text-pretty" style={{ color: 'var(--subtle)' }}>
        Everyone is paid directly from your wallet in a single transaction. Nothing is held by the contract. Network fees are paid in USDC.
        {flow.insufficientBalance ? ' Use Get test USDC in the sidebar to add test funds.' : ''}
      </p>
    </section>
  )
}
