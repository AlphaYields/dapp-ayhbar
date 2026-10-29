'use client';

import { TxCard } from '@/components/deposit/TxCard';
import { ModalKeyframes } from '@/components/modals/shared';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useHbarVault } from '@/hooks/use-hbar-vault';
import { useModalTransaction } from '@/hooks/use-modal-transaction';
import { CHAIN_EXPLORER } from '@/lib/constants';
import { canReceiveHbarx, hbarCancelRequest, hbarErrorMessage, hbarRedeem } from '@/lib/hbar/vault';
import { TOKENS_OUT } from '@/data/tokens';
import { TokenId } from '@/types/static';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useCallback, useState } from 'react';
import { formatUnits } from 'viem';
import { useAccount, useSwitchChain, useWalletClient } from 'wagmi';

const IDLE = 'idle';
const SIGNING = 'signing';
const COMPLETE = 'complete';

interface HbarClaimModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tokenId: TokenId;
}

/**
 * Withdraw step 2 for ayHBAR: `redeem` the queued shares once the timelock has
 * passed (pays HBARX), or `cancelWithdrawRequest` to put them back in the wallet.
 */
export function HbarClaimModal({ open, onOpenChange, tokenId }: HbarClaimModalProps) {
  const { address, isConnected, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { openConnectModal } = useConnectModal();
  const { cfg, client, data: snap, refetch } = useHbarVault(address);
  const tokenName = TOKENS_OUT.find((t) => t.id === tokenId)?.name ?? tokenId;
  const { data: walletClient } = useWalletClient({ chainId: cfg.chain.id });
  const [receivedAssets, setReceivedAssets] = useState<bigint | null>(null);
  const [cancelled, setCancelled] = useState(false);

  const { step, setStep, mounted, txError, setTxError, txHash, setTxHash, isTxPending, setIsTxPending, handleClose } =
    useModalTransaction({
      busySteps: [SIGNING],
      onReset: () => {
        setReceivedAssets(null);
        setCancelled(false);
      },
      onClose: () => onOpenChange(false),
    });

  const user = snap?.user;
  const queued = user?.queuedShares ?? BigInt(0);
  const hasRequest = queued > BigInt(0);
  const unlockAt = Number(user?.unlockAt ?? BigInt(0));
  // maxRedeem already applies timelock, pause and liquidity.
  const canClaim = hasRequest && (user?.maxRedeem ?? BigInt(0)) > BigInt(0);
  const isWrongNetwork = isConnected && chainId !== cfg.chain.id;
  const walletReady = mounted && isConnected;
  const formattedShares = parseFloat(formatUnits(queued, cfg.shareDecimals)).toFixed(4);

  const send = useCallback(
    async (action: 'claim' | 'cancel') => {
      setTxError(null);
      if (!isConnected || !walletClient || !address || !user) return;
      if (isWrongNetwork) {
        try {
          await switchChainAsync({ chainId: cfg.chain.id });
        } catch (err) {
          setTxError(hbarErrorMessage(err));
        }
        return;
      }
      try {
        if (action === 'claim') {
          const assoc = await canReceiveHbarx(cfg, address);
          if (!assoc.ok) {
            setTxError(assoc.reason);
            return;
          }
        }
        setStep(SIGNING);
        setIsTxPending(true);
        if (action === 'claim') {
          // Claim what's claimable right now (normally the whole queue).
          const shares = user.maxRedeem < queued ? user.maxRedeem : queued;
          const { txHash: hash, assets } = await hbarRedeem(walletClient, client, cfg, shares, address);
          setTxHash(hash);
          setReceivedAssets(assets);
        } else {
          const { txHash: hash } = await hbarCancelRequest(walletClient, client, cfg);
          setTxHash(hash);
          setCancelled(true);
        }
        setIsTxPending(false);
        refetch();
        setTimeout(() => setStep(COMPLETE), 700);
      } catch (err) {
        setIsTxPending(false);
        console.error('[HBAR CLAIM]', err);
        setTxError(hbarErrorMessage(err));
        setStep(IDLE);
      }
    },
    [
      isConnected,
      walletClient,
      address,
      user,
      queued,
      isWrongNetwork,
      switchChainAsync,
      cfg,
      client,
      refetch,
      setStep,
      setIsTxPending,
      setTxHash,
      setTxError,
    ]
  );

  const buttonLabel = (() => {
    if (!walletReady) return 'Connect Wallet';
    if (isWrongNetwork) return `Switch to ${cfg.chain.name}`;
    if (!hasRequest) return 'No pending request';
    if (snap?.paused) return 'Vault paused';
    if (!canClaim) return 'Not unlocked yet';
    if (isTxPending) return 'Confirm in wallet...';
    return `Claim ${cfg.asset.symbol}`;
  })();
  const isButtonDisabled = walletReady && (isWrongNetwork ? false : !canClaim || isTxPending);
  const signing = step === SIGNING || isTxPending;

  const statusLine = !hasRequest
    ? 'You have no open withdrawal request.'
    : canClaim
      ? `Your request has unlocked. Claim to receive ${cfg.asset.symbol}.`
      : unlockAt * 1000 > Date.now()
        ? `Your request unlocks on ${new Date(unlockAt * 1000).toLocaleString()}.`
        : snap?.paused
          ? 'The vault is paused — claims resume when it is unpaused.'
          : 'Your request has unlocked, but the vault lacks the liquidity to pay it right now. Try again shortly.';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="!w-[400px] border-0 bg-transparent p-0 shadow-none [&>button]:hidden">
        <ModalKeyframes />
        <div className="wd-confirm-card">
          {step !== COMPLETE ? (
            <>
              <div className="wd-confirm-title">Claim withdrawal</div>
              <div className="wd-confirm-sub">{statusLine}</div>

              <div className="dep-tx-list">
                <TxCard
                  num={1}
                  title="Sign claim"
                  description={`Sign the transaction in your wallet to receive your ${cfg.asset.symbol}.`}
                  alwaysShowDescription
                  active={signing}
                  done={false}
                  showSpinner={signing}
                />
              </div>

              <div
                style={{
                  marginTop: 16,
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.04)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 13,
                }}
              >
                <span style={{ color: 'var(--muted)' }}>Queued</span>
                <span style={{ fontWeight: 600 }}>
                  {formattedShares} {tokenName}
                </span>
              </div>

              {txError && <div className="wd-error">{txError}</div>}

              <button
                onClick={() => (!walletReady && openConnectModal ? openConnectModal() : send('claim'))}
                disabled={isButtonDisabled}
                className="btn btn-green"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '12px',
                  fontSize: '14px',
                  borderRadius: '12px',
                  marginTop: 16,
                  opacity: isButtonDisabled ? 0.5 : 1,
                  cursor: isButtonDisabled ? 'not-allowed' : 'pointer',
                }}
              >
                {buttonLabel}
              </button>
              {walletReady && hasRequest && !isWrongNetwork && (
                <button
                  onClick={() => send('cancel')}
                  disabled={signing}
                  style={{
                    width: '100%',
                    marginTop: 10,
                    padding: '8px',
                    fontSize: 12,
                    background: 'none',
                    border: 'none',
                    color: 'var(--muted)',
                    cursor: signing ? 'not-allowed' : 'pointer',
                  }}
                >
                  Cancel request and return {tokenName} to my wallet
                </button>
              )}
            </>
          ) : (
            <div className="wd-confirm-success">
              <div className="dep-suc-icon" style={{ width: 64, height: 64, fontSize: 28, marginBottom: 16 }}>
                ✓
              </div>
              <div className="wd-confirm-success-title">
                {cancelled
                  ? `Cancelled. Your ${tokenName} is back in your wallet.`
                  : `Done. ${cfg.asset.symbol} is in your wallet.`}
              </div>
              <div className="wd-confirm-success-sub">
                {receivedAssets != null
                  ? `${parseFloat(formatUnits(receivedAssets, cfg.asset.decimals)).toLocaleString(undefined, { maximumFractionDigits: 6 })} ${cfg.asset.symbol} received.`
                  : ''}
              </div>
              {txHash && (
                <div style={{ marginBottom: 16, fontSize: 12 }}>
                  <a
                    href={`${CHAIN_EXPLORER[cfg.chain.id]}/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--green)', textDecoration: 'none' }}
                  >
                    View transaction ↗
                  </a>
                </div>
              )}
              <button
                onClick={handleClose}
                className="btn btn-green"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '12px',
                  borderRadius: '12px',
                  fontSize: '14px',
                }}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
