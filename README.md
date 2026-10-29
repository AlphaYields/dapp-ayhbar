# ayHBAR dapp

Web app for **ayHBAR**, the AlphaYields leveraged HBAR staking vault on Hedera.
Deposit HBAR or HBARX, track your position, and withdraw back to HBARX.

- Vault: [`0x226e4aec419f92e819aed5e8b38efbca56ff3fe9`](https://hashscan.io/mainnet/contract/0x226e4aec419f92e819aed5e8b38efbca56ff3fe9) (Hedera mainnet, chain 295)
- Asset: Stader HBARX (`0.0.834116`)
- Vault contracts: [AlphaYields/hbarx-vault](https://github.com/AlphaYields/hbarx-vault)

## How it works

| Action | On-chain call |
| --- | --- |
| Deposit HBAR | `depositHBAR` — the vault stakes it to HBARX through Stader in the same tx |
| Deposit HBARX | `approve` → `deposit` |
| Withdraw | `requestWithdraw`, then `redeem` once `withdrawTimelock` has passed (a pending request can be cancelled) |

Withdrawals pay out in HBARX. HBARX is an HTS token, so the receiving account must be
associated with it; the withdraw modal checks this before sending.

All chain access lives in `src/lib/hbar/vault.ts` (viem, through the Hashio JSON-RPC relay,
which needs legacy transactions and a fixed gas limit). Vault stats, positions and history
come from the AlphaYields accounting API through the `src/app/api/*` routes.

## Pages

- `/aytokens/ayhbar` — vault page: live APY, share price, NAV, strategy, risk, FAQ, deposit
- `/dashboard` — connected wallet's position, PnL, withdraw / claim

## Getting started

Requires Node.js 18+ and Yarn 1.

```bash
yarn
cp .env.example .env.local   # then fill in ACCOUNTING_API_KEY
yarn dev
```

Open http://localhost:3000.

| Variable | Used for |
| --- | --- |
| `ACCOUNTING_API_KEY` | Server-side key for `accounting.alphayields.ai` (vault data, user data, PnL, transactions). Without it the vault page shows seeded figures and the dashboard can't load positions. |

```bash
yarn build   # production build
yarn lint
```

## Wallets

MetaMask, OneKey and Brave are offered through RainbowKit. Any EVM wallet connected to
Hedera mainnet (chain 295) works; HashPack users can import their account into MetaMask.

## Stack

Next.js 15 (App Router), React 19, wagmi 2 + viem, RainbowKit, TanStack Query, Tailwind CSS,
Recharts.
