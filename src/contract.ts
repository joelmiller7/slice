import { parseAbi, isAddress } from 'viem'
import { arcTestnet } from 'viem/chains'
import { getUsdc, buildTxExplorerUrl, buildAddressExplorerUrl } from '@/onchain-facts'

export const CHAIN_ID = arcTestnet.id
export const CHAIN_NAME = 'Arc Testnet'
export const MAX_RECIPIENTS = 50
export const MAX_MEMO_BYTES = 140

const usdc = getUsdc(CHAIN_ID)
if (!usdc) {
  throw new Error(`USDC is not registered for chain ${CHAIN_ID}`)
}
export const USDC_ADDRESS = usdc.address as `0x${string}`

const rawAddress = import.meta.env.VITE_SPLITTER_ADDRESS as string | undefined
export const SPLITTER_ADDRESS: `0x${string}` | undefined =
  rawAddress && isAddress(rawAddress) ? rawAddress : undefined

const rawBlock = import.meta.env.VITE_SPLITTER_DEPLOY_BLOCK as string | undefined
export const SPLITTER_DEPLOY_BLOCK: bigint = rawBlock && /^\d+$/.test(rawBlock) ? BigInt(rawBlock) : 0n

export const splitterAbi = parseAbi([
  'function split(address[] recipients, uint256[] amounts, string memo) returns (uint256 splitId)',
  'function splitCount() view returns (uint256)',
  'event SplitCreated(uint256 indexed splitId, address indexed payer, uint256 total, uint256 recipientCount, string memo)',
  'event SplitPaid(uint256 indexed splitId, address indexed payer, address indexed recipient, uint256 amount)',
])

export const txUrl = (hash: string) => buildTxExplorerUrl(CHAIN_ID, hash)
export const addressUrl = (address: string) => buildAddressExplorerUrl(CHAIN_ID, address)

export const shortAddress = (value: string) => `${value.slice(0, 6)}...${value.slice(-4)}`
