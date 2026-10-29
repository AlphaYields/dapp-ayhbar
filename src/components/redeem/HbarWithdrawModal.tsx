'use client';

import { DepositModalHeader } from '@/components/deposit/DepositModalHeader';
import { ModalKeyframes } from '@/components/modals/shared';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { TOKENS_OUT } from '@/data/tokens';
import { useHbarVault } from '@/hooks/use-hbar-vault';
import { useModalTransaction } from '@/hooks/use-modal-transaction';
import { useTokenPrices } from '@/hooks/use-token-prices';
import { CHAIN_EXPLORER } from '@/lib/constants';
import { canReceiveHbarx, hbarErrorMessage, hbarRequestWithdraw, previewHbarRedeem } from '@/lib/hbar/vault';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { formatUnits, parseUnits } from 'viem';
import { useAccount, useSwitchChain, useWalletClient } from 'wagmi';
import { RequestRedeemAmountStep } from './RequestRedeemAmountStep';
import { RequestRedeemNoticeStep } from './RequestRedeemNoticeStep';
import { RequestRedeemQueuedStep } from './RequestRedeemQueuedStep';
import { RequestRedeemSignStep } from './RequestRedeemSignStep';

type TokenOut = (typeof TOKENS_OUT)[number];

const NOTICE = 'notice';
const AMOUNT = 'amount';
const SIGNING = 'signing';
const SIGNED = 'signed';
const QUEUED = 'queued';

const STEP_LABELS = ['Notice', 'Withdraw', 'Sign', 'Done'];

export interface HbarWithdrawModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tokenOut: TokenOut;
  setTokenOut: (t: TokenOut) => void;
  /** Mounted as a replacement for an open modal — skip the enter animation. */
  instant?: boolean;
}

/** "1 day", "6 hours", "45 minutes" — for the vault's timelock (≥ 60s; shorter is "quick"). */
function waitLabel(seconds: number) {
  if (seconds >= 86400) return `${Math.round(seconds / 86400)} day${seconds >= 172800 ? 's' : ''}`;
  if (seconds >= 3600) return `${Math.round(seconds / 3600)} hours`;
  return `${Math.round(seconds / 60)} minutes`;
}

/**
 * Withdraw step 1 for ayHBAR: `requestWithdraw(shares)`. The shares move into
 * the vault's queue (still earning) and become claimable as HBARX after the
 * timelock, via `HbarClaimModal` from the dashboard.
 */
export function HbarWithdrawModal({ open, onOpenChange, tokenOut, setTokenOut, instant }: HbarWithdrawModalProps) {
  const router = useRouter();
  const { address, isConnected, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { openConnectModal } = useConnectModal();
  const { usd } = useTokenPrices();
  const { cfg, client, data: snap, refetch } = useHbarVault(address);
  const { data: walletClient } = useWalletClient({ chainId: cfg.chain.id });

  const [amount, setAmount] = useState('');
  const [receiveAssets, setReceiveAssets] = useState<bigint | null>(null);
  const num = parseFloat(amount) || 0;

  const { step, setStep, mounted, txError, setTxError, txHash, setTxHash, isTxPending, setIsTxPending, handleClose } =
    useModalTransaction({
      busySteps: [SIGNING],
      initialStep: NOTICE,
      onReset: () => {
        setAmount('');
        setReceiveAssets(null);
      },
      onClose: () => onOpenChange(false),
    });

  useEffect(() => {
    if (!open) return;
    setAmount('');
    setStep(NOTICE);
    setTxError(null);
  }, [open, tokenOut.id, setStep, setTxError]);

  const shareDecimals = cfg.shareDecimals;
  const assetDecimals = cfg.asset.decimals;
  const userShares = snap?.user?.shares ?? BigInt(0);
  const queuedShares = snap?.user?.queuedShares ?? BigInt(0);
  const balanceNumber = parseFloat(formatUnits(userShares, shareDecimals));
  const shares = num > 0 ? parseUnits(amount, shareDecimals) : BigInt(0);
  // Read from the vault, never guessed: the notice waits for the first snapshot.
  const timelock = snap ? Number(snap.withdrawTimelock) : null;
  const quick = timelock !== null && timelock < 60;
  const wait = timelock !== null && !quick ? waitLabel(timelock) : '';
  const isWrongNetwork = isConnected && chainId !== cfg.chain.id;
  const walletReady = mounted && isConnected;

  useEffect(() => {
    if (shares <= BigInt(0)) {
      setReceiveAssets(null);
      return;
    }
    const t = setTimeout(async () => {
      try {
        setReceiveAssets(await previewHbarRedeem(client, cfg, shares));
      } catch {
        setReceiveAssets(null);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [shares, client, cfg]);

  const submit = useCallback(async () => {
    setTxError(null);
    if (!isConnected || !walletClient || !address) return;
    if (isWrongNetwork) {
      try {
        await switchChainAsync({ chainId: cfg.chain.id });
      } catch (err) {
        setTxError(hbarErrorMessage(err));
      }
      return;
    }
    if (shares <= BigInt(0) || shares > userShares) return;

    try {
      // The claim pays HBARX — refuse up front rather than strand the request.
      const assoc = await canReceiveHbarx(cfg, address);
      if (!assoc.ok) {
        setTxError(assoc.reason);
        return;
      }
      setStep(SIGNING);
      setIsTxPending(true);
      const { txHash: hash } = await hbarRequestWithdraw(walletClient, client, cfg, shares);
      setTxHash(hash);
      setIsTxPending(false);
      setStep(SIGNED);
      refetch();
      setTimeout(() => setStep(QUEUED), 800);
    } catch (err) {
      setIsTxPending(false);
      console.error('[HBAR WITHDRAW]', err);
      setTxError(hbarErrorMessage(err));
      setStep(AMOUNT);
    }
  }, [
    isConnected,
    walletClient,
    address,
    isWrongNetwork,
    switchChainAsync,
    cfg,
    client,
    shares,
    userShares,
    refetch,
    setStep,
    setIsTxPending,
    setTxHash,
    setTxError,
  ]);

  const buttonLabel = (() => {
    if (!walletReady) return 'Connect Wallet';
    if (isWrongNetwork) return `Switch to ${cfg.chain.name}`;
    if (snap?.paused) return 'Vault paused';
    if (isTxPending) return 'Confirm in wallet...';
    if (num <= 0) return 'Enter amount';
    if (num > balanceNumber) return 'Insufficient balance';
    return 'Request withdrawal →';
  })();
  const isButtonDisabled = walletReady && !isWrongNetwork && (num <= 0 || num > balanceNumber || !!snap?.paused);

  const sharePrice = snap ? parseFloat(formatUnits(snap.assetsPerShare, assetDecimals)) : 1;
  const formattedReceive =
    receiveAssets != null
      ? parseFloat(formatUnits(receiveAssets, assetDecimals)).toLocaleString(undefined, { maximumFractionDigits: 6 })
      : num > 0
        ? (num * sharePrice).toFixed(6)
        : '0';
  const explorerBase = CHAIN_EXPLORER[cfg.chain.id];
  const stepIndex = step === NOTICE ? 0 : step === AMOUNT ? 1 : step === SIGNING || step === SIGNED ? 2 : 3;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent instant={instant} className="!w-[468px] border-0 bg-transparent p-0 shadow-none [&>button]:hidden">
        <ModalKeyframes hideNumberSpinners />
        <div className="dep-modal-card">
          <DepositModalHeader
            stepIndex={stepIndex}
            labels={STEP_LABELS}
            showBack={step === NOTICE || step === AMOUNT}
            onBack={() => (step === AMOUNT ? setStep(NOTICE) : handleClose())}
            onClose={handleClose}
            showLogo={false}
          />

          <div className="dep-modal-body">
            {step === NOTICE &&
              (timelock === null ? (
                <div className="wd-info-note">Checking the withdrawal wait time…</div>
              ) : quick ? (
                <RequestRedeemNoticeStep
                  waitLabel="Two quick steps"
                  waitDesc={`Request your withdrawal, then claim your ${cfg.asset.symbol} from the dashboard a few seconds later. You can cancel the request any time before you claim.`}
                  onContinue={() => setStep(AMOUNT)}
                />
              ) : (
                <RequestRedeemNoticeStep
                  waitLabel={`Claimable after ${wait}`}
                  waitDesc={`Withdrawing is two steps: request now, then claim your ${cfg.asset.symbol} from the dashboard once the ${wait} timelock has passed. Queued ${tokenOut.name} leaves your wallet but keeps earning until it is claimed, and you can cancel the request at any time before then. Adding to an open request restarts its timer.`}
                  onContinue={() => setStep(AMOUNT)}
                />
              ))}

            {step === AMOUNT && (
              <>
                <RequestRedeemAmountStep
                  amount={amount}
                  onAmountChange={setAmount}
                  num={num}
                  tokenOut={tokenOut}
                  setTokenOut={setTokenOut}
                  receiveSymbol={cfg.asset.symbol}
                  receiveIcon={tokenOut.nativeIcon}
                  formattedBalance={formatUnits(userShares, shareDecimals)}
                  balanceNumber={balanceNumber}
                  formattedReceive={formattedReceive}
                  sharePriceLabel={`1 ${tokenOut.name} = ${sharePrice.toFixed(6)} ${cfg.asset.symbol}`}
                  txError={txError}
                  usdValue={usd(cfg.asset.symbol, num * sharePrice)}
                  mounted={mounted}
                  isConnected={isConnected}
                  onSubmit={() => (!walletReady && openConnectModal ? openConnectModal() : submit())}
                  buttonLabel={buttonLabel}
                  isButtonDisabled={isButtonDisabled}
                  existingRequest={null}
                  vaultDecimals={shareDecimals}
                  assetDecimals={assetDecimals}
                />
                {queuedShares > BigInt(0) && (
                  <div className="wd-info-note" style={{ marginTop: 12 }}>
                    {`You already have ${parseFloat(formatUnits(queuedShares, shareDecimals)).toFixed(4)} ${tokenOut.name} queued. Requesting more adds to it` +
                      (quick ? '.' : ` and restarts the ${wait} timer on the whole amount.`)}
                  </div>
                )}
              </>
            )}

            {(step === SIGNING || step === SIGNED) && (
              <RequestRedeemSignStep
                active={step === SIGNING}
                done={step === SIGNED}
                txHash={txHash ?? null}
                explorerBase={explorerBase}
              />
            )}

            {step === QUEUED && (
              <RequestRedeemQueuedStep
                arriveLabel={
                  quick
                    ? `Your ${cfg.asset.symbol} is claimable in a few seconds — claim it from the dashboard.`
                    : `Claim your ${cfg.asset.symbol} from the dashboard after ${wait}.`
                }
                txHash={txHash ?? null}
                explorerBase={explorerBase}
                onDashboard={() => {
                  handleClose();
                  router.push('/dashboard');
                }}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
