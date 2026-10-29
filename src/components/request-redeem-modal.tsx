'use client';

import { TOKENS_OUT } from '@/data/tokens';
import { TokenId } from '@/types/static';
import { useState } from 'react';
import { HbarWithdrawModal } from './redeem/HbarWithdrawModal';

interface RequestRedeemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultToken?: TokenId;
}

/** Withdraw entry point: the ayHBAR request → claim flow. */
export function RequestRedeemModal({ open, onOpenChange, defaultToken = TokenId.AYHBAR }: RequestRedeemModalProps) {
  const [tokenOut, setTokenOut] = useState(() => TOKENS_OUT.find((t) => t.id === defaultToken) ?? TOKENS_OUT[0]);
  return <HbarWithdrawModal open={open} onOpenChange={onOpenChange} tokenOut={tokenOut} setTokenOut={setTokenOut} instant={false} />;
}
