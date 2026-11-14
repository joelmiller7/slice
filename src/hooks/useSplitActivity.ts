import { useQuery } from '@tanstack/react-query'
import { getAbiItem } from 'viem'
import { usePublicClient } from 'wagmi'
import { CHAIN_ID, SPLITTER_ADDRESS, SPLITTER_DEPLOY_BLOCK, splitterAbi } from '@/contract'

const splitCreated = getAbiItem({ abi: splitterAbi, name: 'SplitCreated' })

const CHUNK = 5_000n
const MAX_CHUNKS = 8
const WANTED = 8

export interface ActivityItem {
  splitId: bigint
  total: bigint
  recipientCount: number
  memo: string
  hash: `0x${string}`
  blockNumber: bigint
}

export interface ActivityResult {
  items: ActivityItem[]
  /** True when the scan stopped before reaching the contract's deployment block. */
  partial: boolean
  scannedBlocks: bigint
}

/**
 * Reads the payer's recent splits from SplitCreated logs. Scans backwards from the chain head in bounded
 * chunks and never goes earlier than the contract's deployment block.
 */
export function useSplitActivity(payer: `0x${string}` | undefined, refreshKey: number) {
  const client = usePublicClient({ chainId: CHAIN_ID })

  return useQuery<ActivityResult>({
    queryKey: ['split-activity', payer, refreshKey],
    enabled: Boolean(client && payer && SPLITTER_ADDRESS),
    queryFn: async () => {
      if (!client || !payer || !SPLITTER_ADDRESS) return { items: [], partial: false, scannedBlocks: 0n }

      const head = await client.getBlockNumber()
      const floor = SPLITTER_DEPLOY_BLOCK
      const items: ActivityItem[] = []
      let to = head
      let chunks = 0

      while (to >= floor && chunks < MAX_CHUNKS && items.length < WANTED) {
        const from = to + 1n - CHUNK > floor ? to + 1n - CHUNK : floor
        const logs = await client.getLogs({
          address: SPLITTER_ADDRESS,
          event: splitCreated,
          args: { payer },
          fromBlock: from,
          toBlock: to,
        })
        for (const log of [...logs].reverse()) {
          items.push({
            splitId: log.args.splitId ?? 0n,
            total: log.args.total ?? 0n,
            recipientCount: Number(log.args.recipientCount ?? 0n),
            memo: log.args.memo ?? '',
            hash: log.transactionHash,
            blockNumber: log.blockNumber,
          })
        }
        to = from - 1n
        chunks += 1
      }

      return { items: items.slice(0, WANTED), partial: to >= floor, scannedBlocks: head - to }
    },
  })
}
