/** Turns a wallet or RPC error into a short, user-facing sentence. Returns null when the user simply cancelled. */
export function describeTxError(error: unknown): string | null {
  const err = error as { code?: number; shortMessage?: string; message?: string } | null
  const message = `${err?.shortMessage ?? ''} ${err?.message ?? ''}`.toLowerCase()

  if (err?.code === 4001 || message.includes('user rejected') || message.includes('user denied')) return null
  if (message.includes('insufficient funds') || message.includes('exceeds balance')) {
    return 'Not enough USDC to cover this payment and the network fee.'
  }
  if (message.includes('transfer amount exceeds allowance') || message.includes('insufficient allowance')) {
    return 'The USDC allowance is too low. Allow the amount again and retry.'
  }
  if (message.includes('reverted')) {
    return 'The transaction was rejected by the contract. Check the addresses and amounts, then try again.'
  }
  if (message.includes('network') || message.includes('timeout') || message.includes('fetch')) {
    return 'Network issue. Check your connection and try again.'
  }
  return 'Something went wrong. Please try again.'
}
