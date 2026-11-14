import { ConnectKitButton } from 'connectkit'
import { Wallet } from 'lucide-react'
import { TokenUSDC } from '@web3icons/react'
import { CHAIN_NAME, shortAddress } from '@/contract'

export function Header() {
  return (
    <header className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div
          className="flex size-9 items-center justify-center rounded-xl"
          style={{ background: 'var(--accent)' }}
          aria-hidden
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round">
            <path d="M5 12h6M13 6l6 6-6 6" />
            <path d="M5 6h3M5 18h3" />
          </svg>
        </div>
        <div>
          <div className="display text-lg font-bold leading-none" style={{ color: 'var(--ink)' }}>
            Slice
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px]" style={{ color: 'var(--subtle)' }}>
            <TokenUSDC variant="branded" size={12} />
            {CHAIN_NAME}
          </div>
        </div>
      </div>

      <ConnectKitButton.Custom>
        {({ isConnected, show, address }) => (
          <button
            onClick={show}
            className="flex min-h-11 items-center gap-2 rounded-full px-4 text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2"
            style={
              isConnected
                ? { background: 'rgba(255,255,255,0.7)', color: 'var(--ink)', border: '1px solid var(--border)' }
                : { background: 'var(--accent)', color: 'white' }
            }
          >
            <Wallet className="size-3.5" />
            <span className={isConnected ? 'mono' : ''}>{isConnected && address ? shortAddress(address) : 'Connect'}</span>
          </button>
        )}
      </ConnectKitButton.Custom>
    </header>
  )
}
