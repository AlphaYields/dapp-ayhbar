'use client';

import { TOKENS_OUT } from '@/data/tokens';
import { TokenId } from '@/types/static';
import { useCallback, useState } from 'react';
import { HbarDepositModal } from './deposit/HbarDepositModal';

interface DepositModalProps {
  defaultValue?: number;
  defaultToken?: TokenId;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  inline?: boolean;
  tokenOut?: TokenId;
  onTokenOutChange?: (id: TokenId) => void;
}

const findToken = (id: TokenId | undefined) => TOKENS_OUT.find((t) => t.id === id) ?? TOKENS_OUT[0];

/**
 * Deposit entry point. Owns the selected output token and renders the
 * Hedera deposit flow (HBAR or HBARX in → ayHBAR).
 */
export function DepositModal({ defaultToken = TokenId.AYHBAR, tokenOut: tokenOutProp, onTokenOutChange, ...rest }: DepositModalProps) {
  const [internalTokenOut, setInternalTokenOut] = useState(() => findToken(defaultToken));
  const tokenOut = tokenOutProp ? findToken(tokenOutProp) : internalTokenOut;
  const [preferredDepositAddress, setPreferredDepositAddress] = useState<string>();
  const setTokenOut = useCallback(
    (t: (typeof TOKENS_OUT)[number], depositAddress?: string) => {
      setPreferredDepositAddress(depositAddress);
      onTokenOutChange?.(t.id);
      if (!tokenOutProp) setInternalTokenOut(t);
    },
    [onTokenOutChange, tokenOutProp]
  );

  return <HbarDepositModal {...rest} tokenOut={tokenOut} setTokenOut={setTokenOut} instant={false} preferredDepositAddress={preferredDepositAddress} />;
}
