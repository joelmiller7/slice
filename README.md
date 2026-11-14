# Slice

Slice lets you send one USDC payment and split it across many people on Arc Testnet. Pick equal shares, percentages, or exact amounts, then everyone is paid directly from your wallet in a single transaction.

Built with [Arc Studio](https://studio.arc.io)

## Tech stack

- React, Vite, TypeScript, Tailwind CSS
- wagmi, viem, ConnectKit
- Solidity (Foundry) payment splitter contract on Arc Testnet

## Development

Prerequisites: [Bun](https://bun.sh) and [Foundry](https://getfoundry.sh).

```bash
bun install
bun run dev
```

Other commands:

```bash
bun run check            # lint and typecheck
bun run contracts:build  # compile the contract
bun run contracts:test   # run contract tests
```

### Environment variables

- `VITE_SPLITTER_ADDRESS`: address of the deployed payment splitter contract.
- `VITE_SPLITTER_DEPLOY_BLOCK`: block the contract was deployed at, used to limit how far back activity is searched.

You need test USDC on Arc Testnet to try it. It also pays for network fees.
