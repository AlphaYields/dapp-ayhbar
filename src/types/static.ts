export enum TokenId {
  AYHBAR = 'ayhbar',
}

export interface TokenOut {
  id: TokenId;
  name: string;
  color: string;
  strategiesActive: number;
  chainsSupported: number;
  icon: string;
  nativeIcon: string;
  nativeToken: string;
  desc: string;
  strategy: string;
  deposit: string;
  mintUrl: string;
}
