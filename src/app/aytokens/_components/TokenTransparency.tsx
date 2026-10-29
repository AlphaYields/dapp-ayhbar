'use client';

import { useEffect, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TokenContent } from '@/app/data/tokenContent';
import { Collapsible } from './Collapsible';
import { Reveal } from '../../_components/Reveal';

type SubTx = { id: string; chain: string; date: string };
type TxGroup = { title: string; date: string; count: number; txs: SubTx[] };
type FlowItem = { method: string; hash: string };

// Block-explorer tx-URL resolution, mirrored from `lib/constants`. Unknown
// chains fall back to Hedera, the vault's chain.
const HUB_CHAIN_ID = 295;
const CHAIN_NAME_TO_ID: Record<string, number> = {
  hedera: 295,
};
const CHAIN_EXPLORER: Record<number, string> = {
  295: 'https://hashscan.io/mainnet/transaction',
};

function chainToId(chain: string): number {
  if (!chain) return HUB_CHAIN_ID;
  const key = chain.toLowerCase();
  if (CHAIN_NAME_TO_ID[key]) return CHAIN_NAME_TO_ID[key];
  const asNum = Number(chain);
  if (!Number.isNaN(asNum) && CHAIN_EXPLORER[asNum]) return asNum;
  return HUB_CHAIN_ID;
}

function explorerTxUrl(chain: string, hash: string): string {
  const base = CHAIN_EXPLORER[chainToId(chain)] ?? CHAIN_EXPLORER[HUB_CHAIN_ID];
  return `${base}/${hash}`;
}

function fmtDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  // Pinned locale so marketing dates are stable regardless of runtime locale.
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function shortHash(h: string): string {
  if (!h) return '';
  return h.length > 14 ? `${h.slice(0, 8)}…${h.slice(-6)}` : h;
}

/**
 * "Fully On-Chain" trust band — copy + pull quote on the left, an on-chain
 * transaction-history card on the right. Mirrors the dapp's token-detail
 * transparency section: ayHBAR reads `/api/transactions` and lists tx methods;
 * vaults without a chain entry below read `/api/activity-log` and group
 * operations with a count, each group expanding to its individual transactions. Seeds from the
 * curated content (so the page stays static `○`), then refetches; an empty
 * result shows "No transactions yet.".
 */
/** Chain each `/api/transactions` vault settles on, for explorer links. */
const TX_API_CHAIN: Record<string, string> = {
  ayHBAR: 'hedera',
};

export function TokenTransparency({ token }: { token: TokenContent }) {
  // Vaults whose history comes from `/api/transactions` (flat method list)
  // rather than `/api/activity-log` (grouped operations).
  const txChain = TX_API_CHAIN[token.symbol];
  const usesTxApi = !!txChain;
  const [groups, setGroups] = useState<TxGroup[]>(
    token.transparency.txs.map((t) => ({
      title: t.title,
      date: t.date,
      count: t.count,
      txs: [],
    }))
  );
  const [items, setItems] = useState<FlowItem[]>([]);
  const [open, setOpen] = useState<Record<number, boolean>>({});

  useEffect(() => {
    let alive = true;
    if (usesTxApi) {
      fetch(`/api/transactions?address=${token.address}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (alive && Array.isArray(d?.items)) {
            setItems(
              d.items.slice(0, 10).map((it: { method: string; tx_hash: string }) => ({
                method: it.method,
                hash: it.tx_hash,
              }))
            );
          }
        })
        .catch(() => {
          /* keep empty on failure */
        });
    } else {
      fetch(`/api/activity-log?vaultAddress=${token.address}&limit=20&offset=0`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (alive && Array.isArray(d?.groups) && d.groups.length) {
            setGroups(
              d.groups.map(
                (g: {
                  description: string;
                  first_transaction_time: string;
                  transactions?: {
                    transaction_id: string;
                    chain: string;
                    timestamp: string;
                  }[];
                }) => ({
                  title: g.description,
                  date: fmtDate(g.first_transaction_time),
                  count: g.transactions?.length ?? 0,
                  txs: (g.transactions ?? []).map((tx) => ({
                    id: tx.transaction_id,
                    chain: tx.chain,
                    date: fmtDate(tx.timestamp),
                  })),
                })
              )
            );
            setOpen({});
          }
        })
        .catch(() => {
          /* keep seeded rows on failure */
        });
    }
    return () => {
      alive = false;
    };
  }, [usesTxApi, txChain, token.address]);

  return (
    <section className="border-t border-white/[0.06] bg-surface-deep">
      <div className="mx-auto grid max-w-[1240px] items-center gap-12 px-6 py-[104px] sm:px-10 lg:grid-cols-2 lg:gap-[72px]">
        <Reveal>
          <div className="mb-[22px] font-mono text-[11.5px] font-medium uppercase tracking-[0.2em] text-foreground/45">
            Trust Center
          </div>
          {/* T1/D4: heading scale normalised to the homepage section scale. */}
          <h2 className="font-display text-[clamp(33px,6.5vw,48px)] font-extrabold leading-[1.05] tracking-[-0.02em]">
            Fully On-Chain
          </h2>
          <p className="mt-6 max-w-[480px] text-pretty font-sans text-[16.5px] font-light leading-[1.65] text-foreground/60">
            {token.transparency.body}
          </p>
          {/* T5: quotation marks removed (in content); left green border + italic. */}
          <blockquote className="mt-[30px] max-w-[460px] border-l-[3px] border-brand pl-5 font-sans text-[16.5px] italic leading-[1.6] text-foreground/[0.82]">
            {token.transparency.quote}
          </blockquote>
        </Reveal>

        <Reveal className="overflow-hidden rounded-[18px] border border-white/[0.08] bg-surface">
          <div className="flex items-center justify-between border-b border-white/[0.07] px-[22px] py-[18px]">
            <div className="flex items-center gap-[10px]">
              <span className="size-[9px] rounded-full bg-brand" />
              <span className="font-mono text-[11.5px] font-semibold uppercase tracking-[0.13em] text-foreground">
                Transaction History
              </span>
            </div>
            <span className="font-mono text-[11px] text-foreground/40">On-chain · verified</span>
          </div>

          <div className="border-b border-white/[0.05] px-[22px] py-[14px] font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/35">
            {usesTxApi ? 'Method' : 'Details'}
          </div>

          {usesTxApi ? (
            items.length > 0 ? (
              items.map((it, i) => (
                <a
                  key={`${it.hash}-${i}`}
                  href={explorerTxUrl(txChain, it.hash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-4 border-t border-white/[0.05] px-[22px] py-[15px] transition-colors hover:bg-white/[0.03]"
                >
                  <span className="rounded-[7px] border border-white/10 bg-white/[0.04] px-[11px] py-[5px] font-mono text-[10.5px] tracking-[0.04em] text-foreground/[0.62]">
                    {it.method}
                  </span>
                  {/* T6b: tx hash in brand accent, links to the explorer. */}
                  <span className="inline-flex items-center gap-1 font-mono text-[11.5px] text-[#C8EA8C] transition-colors hover:text-brand">
                    {shortHash(it.hash)}
                    <ArrowUpRight className="size-[12px]" />
                  </span>
                </a>
              ))
            ) : (
              <EmptyState />
            )
          ) : groups.length > 0 ? (
            groups.map((g, i) => {
              const isOpen = !!open[i];
              const canExpand = g.txs.length > 0;
              return (
                <div key={`${g.title}-${i}`} className="border-t border-white/[0.05]">
                  <button
                    type="button"
                    disabled={!canExpand}
                    aria-expanded={isOpen}
                    onClick={() => setOpen((p) => ({ ...p, [i]: !p[i] }))}
                    className="flex w-full items-center justify-between gap-4 px-[22px] py-[15px] text-left transition-colors enabled:hover:bg-white/[0.02] disabled:cursor-default"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-sans text-[14px] font-medium text-foreground">{g.title}</div>
                      <div className="mt-1 font-mono text-[11px] text-foreground/40">{g.date}</div>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-[6px] whitespace-nowrap font-mono text-[11.5px] text-foreground/55">
                      {g.count} {g.count === 1 ? 'tx' : 'txs'}
                      {/* T4c: larger, higher-contrast chevron (was a faint 9px). */}
                      <span
                        className={cn(
                          'text-[18px] text-foreground/80 transition-transform',
                          isOpen && 'rotate-180',
                          !canExpand && 'opacity-30'
                        )}
                      >
                        ▾
                      </span>
                    </span>
                  </button>
                  <Collapsible open={isOpen}>
                    <div className="min-h-0">
                      <div className="max-h-[220px] overflow-y-auto">
                        {g.txs.map((tx, j) => (
                          <a
                            key={`${tx.id}-${j}`}
                            href={explorerTxUrl(tx.chain, tx.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 border-t border-white/[0.04] bg-background/40 px-[22px] py-[10px] transition-colors hover:bg-white/[0.03]"
                          >
                            <span className="font-mono text-[11px] text-foreground/45">{tx.date}</span>
                            <span className="rounded-[6px] border border-white/10 bg-white/[0.04] px-2 py-[3px] font-mono text-[10px] tracking-[0.04em] text-foreground/55">
                              {tx.chain}
                            </span>
                            {/* T4a/T4d: tx hash in brand accent to differentiate it. */}
                            <span className="ml-auto inline-flex items-center gap-1 font-mono text-[11px] text-[#C8EA8C] transition-colors hover:text-brand">
                              {shortHash(tx.id)}
                              <ArrowUpRight className="size-[12px]" />
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  </Collapsible>
                </div>
              );
            })
          ) : (
            <EmptyState />
          )}
        </Reveal>
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[170px] items-center justify-center px-[22px] py-10">
      <span className="font-sans text-[14px] font-light text-foreground/40">No transactions yet.</span>
    </div>
  );
}
