import { VaultData } from '@/types/data';

function bsearchClosest(
  data: VaultData['data'],
  key: (p: VaultData['data'][0]) => number,
  target: number
): VaultData['data'][0] {
  let lo = 0,
    hi = data.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (key(data[mid]) < target) lo = mid + 1;
    else hi = mid;
  }
  if (lo > 0 && Math.abs(key(data[lo - 1]) - target) <= Math.abs(key(data[lo]) - target)) return data[lo - 1];
  return data[lo];
}

export function findSharePriceAtBlock(data: VaultData['data'], block: number): number {
  if (!data.length) return 1;
  return bsearchClosest(data, (p) => p.block, block).share_price;
}

export function findSharePriceAtUnixTime(data: VaultData['data'], unixTimeSecs: number): number {
  if (!data.length) return 1;
  return bsearchClosest(data, (p) => p.unix_time, unixTimeSecs).share_price;
}
