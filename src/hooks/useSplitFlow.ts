import { useCallback, useState } from 'react'
import { erc20Abi, parseEventLogs } from 'viem'
import { useAccount, usePublicClient, useReadContract, useSwitchChain, useWriteContract } from 'wagmi'
import { toast } from 'sonner'
import { CHAIN_ID, SPLITTER_ADDRESS, USDC_ADDRESS, splitterAbi } from '@/contract'
import { describeTxError } from '@/lib/errors'
import type { SplitPlan } from '@/lib/splits'

export type FlowAction = 'switch' | 'approve' | 'split'
export type FlowPhase = 'idle' | 'wallet' | 'confirming'

export interface SplitReceipt {
  hash: `0x${string}`
  splitId?: bigint
  total: bigint
  count: number
}

export function useSplitFlow(plan: SplitPlan, memo: string, onSent: () => void) {
  const { address, chainId, isConnected } = useAccount()
  const publicClient = usePublicClient({ chainId: CHAIN_ID })
  const { switchChainAsync } = useSwitchChain()
  const { writeContractAsync } = useWriteContract()

  const [action, setAction] = useState<FlowAction | null>(null)
  const [phase, setPhase] = useState<FlowPhase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [receipt, setReceipt] = useState<SplitReceipt | null>(null)

  const balance = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: CHAIN_ID,
    query: { enabled: Boolean(address), refetchInterval: 10_000 },
  })

  const allowance = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address && SPLITTER_ADDRESS ? [address, SPLITTER_ADDRESS] : undefined,
    chainId: CHAIN_ID,
    query: { enabled: Boolean(address && SPLITTER_ADDRESS), refetchInterval: 10_000 },
  })

  const busy = phase !== 'idle'
  const wrongChain = isConnected && chainId !== CHAIN_ID
  const balanceRaw = balance.data
  const allowanceRaw = allowance.data
  const insufficientBalance = balanceRaw !== undefined && plan.total > 0n && balanceRaw < plan.total
  const needsApproval = allowanceRaw !== undefined && plan.total > 0n && allowanceRaw < plan.total

  const run = useCallback(
    async (nextAction: FlowAction, send: () => Promise<`0x${string}`>) => {
      setError(null)
      setAction(nextAction)
      setPhase('wallet')
      try {
        const hash = await send()
        setPhase('confirming')
        if (!publicClient) throw new Error('network: no client for Arc Testnet')
        const result = await publicClient.waitForTransactionReceipt({ hash })
        if (result.status !== 'success') throw new Error('transaction reverted')
        return { hash, result }
      } catch (caught) {
        const message = describeTxError(caught)
        if (message) {
          setError(message)
          toast.error(message)
        }
        return null
      } finally {
        setPhase('idle')
        setAction(null)
      }
    },
    [publicClient],
  )

  const switchNetwork = useCallback(async () => {
    setAction('switch')
    setPhase('wallet')
    try {
      await switchChainAsync({ chainId: CHAIN_ID })
    } catch (caught) {
      const message = describeTxError(caught)
      if (message) setError(message)
    } finally {
      setPhase('idle')
      setAction(null)
    }
  }, [switchChainAsync])

  const approve = useCallback(async () => {
    const splitter = SPLITTER_ADDRESS
    if (!splitter || !plan.ready) return
    const done = await run('approve', () =>
      writeContractAsync({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'approve',
        args: [splitter, plan.total],
        chainId: CHAIN_ID,
      }),
    )
    if (done) await allowance.refetch()
  }, [allowance, plan.ready, plan.total, run, writeContractAsync])

  const send = useCallback(async () => {
    const splitter = SPLITTER_ADDRESS
    if (!splitter || !plan.ready) return
    const done = await run('split', () =>
      writeContractAsync({
        address: splitter,
        abi: splitterAbi,
        functionName: 'split',
        args: [plan.recipients, plan.shares, memo.trim()],
        chainId: CHAIN_ID,
      }),
    )
    if (!done) return
    const created = parseEventLogs({ abi: splitterAbi, eventName: 'SplitCreated', logs: done.result.logs })[0]
    setReceipt({
      hash: done.hash,
      splitId: created?.args.splitId,
      total: plan.total,
      count: plan.recipients.length,
    })
    await Promise.all([balance.refetch(), allowance.refetch()])
    onSent()
  }, [allowance, balance, memo, onSent, plan, run, writeContractAsync])

  return {
    address,
    isConnected,
    wrongChain,
    balanceRaw,
    insufficientBalance,
    needsApproval,
    action,
    phase,
    busy,
    error,
    receipt,
    clearReceipt: () => setReceipt(null),
    switchNetwork,
    approve,
    send,
  }
}
