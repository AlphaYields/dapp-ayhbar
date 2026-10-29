export interface VaultDataPoint {
  block: number;
  unix_time: number;
  time: string;
  share_price: number;
  nav: number;
  pnl_percent: number;
  drawdown: number;
  pnl_percent_diff: number;
  pnl_flow_diff: number;
  pnl_flow: number;
  pnl_usd: number;
}

export interface SubVault {
  name: string;
  denomination_token: string;
  amount: string;
  token_name: string;
  token_address: string;
  is_subvault: boolean;
  role: 'hub' | 'spoke';
  weight: string;
  apy_alltime: string;
  apy_1m: string;
  apy_3m: string;
  apy_7d: string;
  tags: string[] | null;
  description: string;
}

export interface VaultData {
  time_since_inception: number;
  last_share_price: number;
  pnl_since_inception: number;
  apy: number;
  apy_7d: number;
  apy_1m: number;
  apy_3m: number;
  /** Staking APY in raw KAT terms (percent) — null for every vault but ayKAT. */
  apy_kat?: number | null;
  apy_kat_7d?: number | null;
  apy_kat_1m?: number | null;
  apy_kat_3m?: number | null;
  under_maintenance: boolean;
  max_drawdown: number;
  nav_usd: number;
  total_pnl_usd: number;
  nav_denomination_token: number;
  total_pnl_denomination_token: number;
  sharpe_ratio?: number;
  data: VaultDataPoint[];
  sub_vaults: SubVault[] | null;
}

export interface VaultDataAPIResponse {
  general_info: {
    time_since_inception: number;
    last_share_price: number;
    pnl_since_inception: string;
    apy: string;
    apy_7d: string;
    apy_1m: string;
    apy_3m: string;
    apy_kat?: string | null;
    apy_kat_7d?: string | null;
    apy_kat_1m?: string | null;
    apy_kat_3m?: string | null;
    under_maintenance: boolean;
    max_drawdown: string;
    nav_denomination_token: string;
    nav_usd: string;
    total_pnl_denomination_token: string;
    total_pnl_usd: string;
    sharpe_ratio: string;
  };
  historical_data: {
    block: number;
    unix_time: number;
    time: string;
    share_price: number;
    nav: number;
    pnl_percent: number;
    drawdown: number;
    peak: number;
    pnl_percent_diff: number;
    pnl_flow_diff: number;
    pnl_flow: number;
    pnl_usd: number;
  }[];
  sub_vaults: SubVault[] | null;
}

export interface AccountingAPIResponse {
  vault_address: string;
  chain_id: number;
  wallet_address: string;
  snapshot_block: number;
  snapshot_ts: string;
  shares_balance: number;
  denomination_balance: number;
  pnl_denomination_token: number;
  pnl_pct: number;
  cost_basis: number;
  first_event_block: number;
  calculated_at: string;
}

interface ActivityLogGroup {
  description: string;
  first_transaction_time: string;
  transactions: {
    transaction_id: string;
    chain: string;
    timestamp: string;
  }[];
}

export interface ActivityLogAPIResponse {
  vault_address: string;
  total: number;
  limit: number;
  offset: number;
  groups: ActivityLogGroup[];
}
