# Slice

> Built with Arc Studio - money-powered apps in minutes

This is the **project memory** - what Arc Studio remembers about building this app. It helps future agents (or humans) understand and extend the project.

---

## What This App Does

Slice splits one USDC payment across up to 50 recipients (equal, percent, or exact amounts) in a single transaction. A stateless PaymentSplitter contract pulls USDC from the payer with transferFrom and pays each recipient directly; it never holds funds. Payer approves the exact total first, then calls split.

## Deployed contracts

- PaymentSplitter on Arc Testnet: 0xc2b809537460d1fd9a4dfe4c6bfe839ff8a68535 (constructor token = Arc USDC). Address and deploy block (72287014) live in `.env` as VITE_SPLITTER_ADDRESS and VITE_SPLITTER_DEPLOY_BLOCK.

## Tech Stack

- Frontend: React 18, Vite, TypeScript, Tailwind CSS
- Web3: wagmi v2, viem v2, ConnectKit
- Contracts: Solidity 0.8.28 + Foundry. Sources in `contracts/`, unit tests in `contracts/test/*.t.sol`. Build with `bun run contracts:build` (`forge build`), test with `bun run contracts:test` (`forge test`).
- Wallet: injected (MetaMask, etc.)
- Chain: Arc Testnet (Chain ID: 5042002, imported from `viem/chains`)
- Token: USDC (6 decimals) (Address: 0x3600000000000000000000000000000000000000, Chain: Arc Testnet)
- Toasts: Sonner

## Key Files

- `src/App.tsx` - Composition root and form state
- `src/lib/splits.ts` - split math (equal, percent, amounts) and validation
- `src/hooks/useSplitFlow.ts` - balance, allowance, approve, split
- `src/hooks/useSplitActivity.ts` - recent splits from SplitCreated logs
- `src/contract.ts` - ABI and contract constants
- `src/components/` - UI components
- `src/config.ts` - wagmi config (chains, connectors, transports)

## Share links

- Starter apps already ship `getShareBase`, `buildShareLink` and `installShareSync` in `src/lib/share.ts`; import them instead of rewriting them.
- Keep shareable state in the URL path or query, not in the `#fragment`.
- Never put a secret (private key, claim secret, seed phrase, session token, API key) in the URL path or query, encoded or not: every in-app path and query is mirrored to the visitor's studio.arc.io address bar and browser history and reaches servers. A bearer claim secret goes only in the `#fragment` appended to the share link (`` `${await buildShareLink('/claim')}#${secret}` ``) and is read from `location.hash` on load. A link to the app's own share URL shown inside the app must be copy-only or open in a new tab with `target="_blank" rel="noopener noreferrer"`.
- Build every link a user copies or sends with `buildShareLink()` from `src/lib/share.ts`.
- Keep the `installShareSync()` call in `src/main.tsx` when editing it; it keeps the Studio address bar in step with in-app navigation.
- Navigate inside the app with relative links.

## To Run

```bash
bun install
bun run dev
```
