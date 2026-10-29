import { LINKS } from '@/data/links';
import { TokenId, TokenOut } from '../types/static';

export const TOKENS_OUT: TokenOut[] = [
  {
    id: TokenId.AYHBAR,
    name: 'ayHBAR',
    icon: '/ayhbar-token.svg',
    nativeToken: 'HBARX',
    nativeIcon: '/hedera-icon.svg',
    desc: 'Leveraged HBAR staking on Hedera — stakes HBAR into HBARX, borrows HBAR against it and stakes again.',
    strategy:
      'Recursive staking loop on Hedera. Converts HBAR to Stader HBARX, supplies it as collateral, borrows HBAR and re-stakes — earning the spread between staking yield and borrow cost, in HBAR.',
    deposit: 'HBAR',
    mintUrl: LINKS.app.ayhbar,
    color: '#8259EF',
    strategiesActive: 1,
    chainsSupported: 1,
  },
];
