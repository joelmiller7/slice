import { isAddress, getAddress } from 'viem'
import { USDC_DECIMALS } from '@/onchain-facts'
import { AmountError, formatUnitsExact, parseUnitsExact } from '@/onchain-money'
import { MAX_RECIPIENTS } from '@/contract'

export type SplitMode = 'equal' | 'percent' | 'amount'

export interface Row {
  id: string
  address: string
  /** Percent (up to 2 decimals) in percent mode, USDC in amount mode. Unused in equal mode. */
  value: string
}

export interface SplitPlan {
  total: bigint
  shares: bigint[]
  recipients: `0x${string}`[]
  rowIssues: Record<string, string>
  issues: string[]
  ready: boolean
}

const PERCENT_DECIMALS = 2
const FULL_BPS = 10_000n

function tryParse(value: string, decimals: number): { raw?: bigint; issue?: string } {
  const trimmed = value.trim()
  if (!trimmed) return { raw: 0n }
  try {
    const raw = parseUnitsExact(trimmed, decimals)
    if (raw < 0n) return { issue: 'Must be positive' }
    return { raw }
  } catch (error) {
    if (error instanceof AmountError) {
      return {
        issue:
          error.code === 'TOO_MANY_FRACTION_DIGITS'
            ? `Use at most ${decimals} decimal places`
            : 'Enter a valid number',
      }
    }
    throw error
  }
}

const sum = (values: bigint[]) => values.reduce((acc, v) => acc + v, 0n)

export function computeSplit(mode: SplitMode, rows: Row[], totalInput: string): SplitPlan {
  const rowIssues: Record<string, string> = {}
  const issues: string[] = []

  const seen = new Set<string>()
  for (const row of rows) {
    const address = row.address.trim()
    if (!address) continue
    if (!isAddress(address)) {
      rowIssues[row.id] = 'Not a valid wallet address'
      continue
    }
    const key = address.toLowerCase()
    if (seen.has(key)) rowIssues[row.id] = 'Already in this split'
    seen.add(key)
  }
  const incomplete = rows.some((row) => !row.address.trim())

  let total = 0n
  let shares: bigint[] = rows.map(() => 0n)

  if (mode === 'amount') {
    shares = rows.map((row) => {
      const parsed = tryParse(row.value, USDC_DECIMALS)
      if (parsed.issue) rowIssues[row.id] ??= parsed.issue
      return parsed.raw ?? 0n
    })
    total = sum(shares)
  } else {
    const parsedTotal = tryParse(totalInput, USDC_DECIMALS)
    if (parsedTotal.issue) issues.push(parsedTotal.issue)
    total = parsedTotal.raw ?? 0n

    if (mode === 'equal') {
      const count = BigInt(Math.max(rows.length, 1))
      const base = total / count
      const extra = Number(total % count)
      shares = rows.map((_, index) => base + (index < extra ? 1n : 0n))
    } else {
      const bps = rows.map((row) => {
        const parsed = tryParse(row.value, PERCENT_DECIMALS)
        if (parsed.issue) rowIssues[row.id] ??= parsed.issue
        return parsed.raw ?? 0n
      })
      const totalBps = sum(bps)
      if (totalBps !== FULL_BPS) {
        issues.push(`Percentages add up to ${formatUnitsExact(totalBps, PERCENT_DECIMALS)}%, not 100%`)
      }
      shares = bps.map((b) => (total * b) / FULL_BPS)
      if (totalBps === FULL_BPS && shares.length > 0) {
        // Rounding dust (less than one cent of a cent) goes to the first recipient so the total is exact.
        shares[0] += total - sum(shares)
      }
    }
  }

  if (rows.length > MAX_RECIPIENTS) issues.push(`A split can include at most ${MAX_RECIPIENTS} people`)
  if (total > 0n && shares.some((s) => s === 0n)) {
    issues.push('Everyone in the split needs to receive more than 0')
  }

  const recipients = rows.map((row) => (isAddress(row.address.trim()) ? getAddress(row.address.trim()) : null))
  const ready =
    rows.length > 0 &&
    rows.length <= MAX_RECIPIENTS &&
    !incomplete &&
    Object.keys(rowIssues).length === 0 &&
    issues.length === 0 &&
    total > 0n &&
    shares.every((s) => s > 0n) &&
    recipients.every((r): r is `0x${string}` => r !== null)

  return {
    total,
    shares,
    recipients: ready ? (recipients) : [],
    rowIssues,
    issues,
    ready,
  }
}

export const newRow = (): Row => ({ id: crypto.randomUUID(), address: '', value: '' })

export const utf8Length = (value: string) => new TextEncoder().encode(value).length

/** Formats a USDC base-unit amount for display with 2 to 6 decimals. */
export function displayUsdc(raw: bigint): string {
  const exact = formatUnitsExact(raw, USDC_DECIMALS)
  const [whole, fraction = ''] = exact.split('.')
  const trimmed = fraction.padEnd(2, '0')
  const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${withCommas}.${trimmed}`
}
