'use client';

import { TokenId } from '@/types/static';
import { HbarClaimModal } from './redeem/HbarClaimModal';

interface RedeemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tokenId?: TokenId;
}

/** "Withdraw →" after a request: the ayHBAR claim (HbarClaimModal). */
export function RedeemModal({ open, onOpenChange, tokenId = TokenId.AYHBAR }: RedeemModalProps) {
  return <HbarClaimModal open={open} onOpenChange={onOpenChange} tokenId={tokenId} />;
}
