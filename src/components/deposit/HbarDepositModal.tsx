'use client';

import { DisclaimerDialog } from '@/components/disclaimer-dialog';
import { ModalKeyframes } from '@/components/modals/shared';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { TOKENS_OUT } from '@/data/tokens';
import { useHbarVault } from '@/hooks/use-hbar-vault';
import { useModalTransaction } from '@/hooks/use-modal-transaction';
import { useTokenPrices } from '@/hooks/use-token-prices';
import { useVaults } from '@/hooks/use-vaults';
import { CHAIN_EXPLORER } from '@/lib/constants';
import { hbarDeposit, hbarErrorMessage, isNativeHbar, previewHbarDeposit } from '@/lib/hbar/vault';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { formatUnits, parseUnits } from 'viem';
import { useAccount, useSwitchChain, useWalletClient } from 'wagmi';
import { DepositCompleteStep } from './DepositCompleteStep';
import { DepositInputStep } from './DepositInputStep';
import { DepositModalHeader, preventRainbowKitDismiss } from './DepositModalHeader';
import { DepositReviewStep } from './DepositReviewStep';
import { DepositWalletStep } from './DepositWalletStep';

type TokenOut = (typeof TOKENS_OUT)[number];

const IDLE = 'idle';
const INPUT = 'input';
const REVIEW = 'review';
const WALLET_READY = 'wallet_ready';
const APPROVING = 'approving';
const DEPOSITING = 'depositing';
const SUBMITTED = 'submitted';
const COMPLETE = 'complete';

const STEP_LABELS = ['Deposit', 'Review', 'Wallet', 'Done'];
const WALLET_STEPS = [WALLET_READY, APPROVING, DEPOSITING, SUBMITTED];

export interface HbarDepositModalProps {
  defaultValue?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  inline?: boolean;
  tokenOut: TokenOut;
  setTokenOut: (t: TokenOut, depositAddress?: string) => void;
  /** Mounted as a replacement for an open modal — skip the enter animation. */
  instant?: boolean;
  /** Deposit token to start on (picked from this vault's rows in another modal). */
  preferredDepositAddress?: string;
}

/**
 * Deposit flow for ayHBAR (Hedera). HBAR → one `depositHBAR` tx (the vault
 * stakes it to HBARX); HBARX → approve → deposit. Four visual steps; all chain access goes through `lib/hbar/vault.ts`.
 */
export function HbarDepositModal({
  defaultValue = 0,
  open,
  onOpenChange,
  inline = false,
  tokenOut,
  setTokenOut,
  instant,
  preferredDepositAddress,
}: HbarDepositModalProps) {
  const router = useRouter();
  const { address, isConnected, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { openConnectModal } = useConnectModal();
  const { data: vaultsData } = useVaults();
  const { usd } = useTokenPrices();

  const { cfg, client, data: snap, loading: snapLoading, refetch } = useHbarVault(address);
  const { data: walletClient, refetch: refetchWalletClient } = useWalletClient({ chainId: cfg.chain.id });
  const [depositSel, setDepositSel] = useState<string | null>(
    () => cfg.depositTokens.find((t) => t.address.toLowerCase() === preferredDepositAddress)?.symbol ?? null
  );
  const depositToken = cfg.depositTokens.find((t) => t.symbol === depositSel) ?? cfg.depositTokens[0];
  const depositDecimals = depositToken.decimals;
  const isHbarRoute = isNativeHbar(depositToken);

  const [amount, setAmount] = useState(defaultValue ? String(defaultValue) : '');
  const num = parseFloat(amount) || 0;
  const [previewShares, setPreviewShares] = useState<bigint | null>(null);
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  const pendingDepositRef = useRef(false);

  const {
    step,
    setStep,
    mounted,
    txError,
    setTxError,
    txHash,
    setTxHash,
    isTxPending,
    setIsTxPending,
    handleClose,
    reset,
  } = useModalTransaction({
    busySteps: [APPROVING, DEPOSITING],
    onReset: () => {
      setAmount('');
      setPreviewShares(null);
    },
    onClose: () => onOpenChange?.(false),
  });

  const assetDecimals = cfg.asset.decimals;
  const formatShares = (shares: bigint) =>
    parseFloat(formatUnits(shares, cfg.shareDecimals)).toLocaleString(undefined, { maximumFractionDigits: 4 });

  const usdValue = usd(depositToken.symbol, num);
  const vaultApy = vaultsData?.[tokenOut.id]?.apy_1m;
  const apyDisplay = vaultApy != null ? vaultApy.toFixed(1) : '--';
  const annualYieldUsd = usd(depositToken.symbol, (num * (vaultApy ?? 0)) / 100);
  const annualYield = num > 0 && vaultApy != null && annualYieldUsd != null ? annualYieldUsd.toFixed(2) : null;
  const isUnderMaintenance = !!vaultsData?.[tokenOut.id]?.under_maintenance;
  const isVaultPaused = !!snap?.paused;
  const isVaultFull = !!snap && snap.maxDeposit === BigInt(0);
  const isWrongNetwork = isConnected && chainId !== cfg.chain.id;
  const walletReady = mounted && isConnected;

  // Debounced preview (HBAR is quoted to HBARX through the vault's route first).
  useEffect(() => {
    if (num <= 0) {
      setPreviewShares(null);
      return;
    }
    const t = setTimeout(async () => {
      try {
        setPreviewShares(await previewHbarDeposit(client, cfg, depositToken, parseUnits(amount, depositDecimals)));
      } catch {
        setPreviewShares(null);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [num, amount, client, cfg, depositToken, depositDecimals]);

  useEffect(() => {
    if (step !== SUBMITTED) return;
    const t = setTimeout(() => setStep(COMPLETE), 3000);
    return () => clearTimeout(t);
  }, [step, setStep]);

  const startDeposit = useCallback(async () => {
    setTxError(null);
    if (num <= 0 || !isConnected || !address) return;
    try {
      setIsTxPending(true);
      let wc = walletClient;
      if (isWrongNetwork || !wc) {
        await switchChainAsync({ chainId: cfg.chain.id });
        wc = (await refetchWalletClient()).data;
        if (!wc)
          throw new Error(
            `Could not connect to your wallet on ${cfg.chain.name} — switch the network in your wallet and try again`
          );
      }
      const { txHash: hash } = await hbarDeposit(
        wc,
        client,
        cfg,
        depositToken,
        parseUnits(amount, depositDecimals),
        address,
        (s) => setStep(s === 'depositing' ? DEPOSITING : APPROVING)
      );
      setTxHash(hash);
      setIsTxPending(false);
      refetch();
      setStep(SUBMITTED);
    } catch (err) {
      setIsTxPending(false);
      console.error('[HBAR DEPOSIT]', err);
      setTxError(hbarErrorMessage(err));
      setStep(IDLE);
    }
  }, [
    num,
    isConnected,
    walletClient,
    refetchWalletClient,
    address,
    isWrongNetwork,
    switchChainAsync,
    cfg,
    client,
    depositToken,
    amount,
    depositDecimals,
    refetch,
    setStep,
    setTxError,
    setTxHash,
    setIsTxPending,
  ]);

  const proceedAfterDisclaimer = async () => {
    if (!walletReady && openConnectModal) {
      openConnectModal();
      return;
    }
    if (isWrongNetwork) {
      if (isTxPending) return;
      setTxError(null);
      setIsTxPending(true);
      try {
        await switchChainAsync({ chainId: cfg.chain.id });
      } catch (err) {
        setTxError(hbarErrorMessage(err));
      } finally {
        setIsTxPending(false);
      }
      return;
    }
    setStep(REVIEW);
  };

  const handleDepositClick = () => {
    let accepted = false;
    try {
      accepted = !!localStorage.getItem('ay_disclaimer_accepted');
    } catch {
      /* ignore */
    }
    if (!accepted) {
      pendingDepositRef.current = true;
      setDisclaimerOpen(true);
      return;
    }
    proceedAfterDisclaimer();
  };

  const buttonLabel = (() => {
    if (snapLoading && !snap) return 'Loading Vault Status...';
    if (isUnderMaintenance) return 'Vault under maintenance';
    if (!walletReady) return 'Connect Wallet';
    if (isWrongNetwork) return `Switch to ${cfg.chain.name}`;
    if (isVaultPaused) return 'Vault Paused';
    if (isVaultFull) return 'Vault Full';
    if (isTxPending) return 'Confirm in wallet...';
    if (num > 0) return `Deposit ${depositToken.symbol}`;
    return 'Enter amount';
  })();
  const isButtonDisabled =
    (walletReady && !isWrongNetwork && num <= 0 && !isTxPending) || isVaultFull || isVaultPaused || isUnderMaintenance;

  const sharePrice = snap ? parseFloat(formatUnits(snap.assetsPerShare, assetDecimals)).toFixed(4) : '--';
  const explorerBase = CHAIN_EXPLORER[cfg.chain.id];
  const stepIndex = step === IDLE || step === INPUT ? 0 : step === REVIEW ? 1 : WALLET_STEPS.includes(step) ? 2 : 3;
  const isInputStep = stepIndex === 0;
  const isWalletStep = stepIndex === 2;

  const inputProps = {
    amount,
    onAmountChange: (val: string) => {
      setAmount(val);
      if (step !== INPUT) setStep(INPUT);
    },
    num,
    tokenOut,
    setTokenOut,
    depositableTokens: cfg.depositTokens.map((t) => ({ ...t, name: t.symbol })),
    selectedDepositToken: { ...depositToken, name: depositToken.symbol },
    onSelectToken: (t: { symbol: string }) => setDepositSel(t.symbol),
    tokensLoading: false,
    isVaultPaused,
    isVaultFull,
    isUnderMaintenance,
    isLoadingVaultStatus: snapLoading && !snap,
    statusLoaded: !!snap,
    txError,
    usdValue,
    formattedBalance: snap?.user
      ? formatUnits(snap.user.balances[depositToken.symbol] ?? BigInt(0), depositDecimals)
      : '0',
    previewShares,
    formatShares,
    apyDisplay,
    apyByToken: Object.fromEntries(TOKENS_OUT.map((t) => [t.id, vaultsData?.[t.id]?.apy_1m as number | undefined])),
    mounted,
    isConnected,
    onDepositClick: handleDepositClick,
    isButtonDisabled,
    buttonLabel,
    isButtonLoading: snapLoading && !snap,
    onResume: () => {},
    annualYield,
    sharePriceLabelText: `1 ${tokenOut.name} = ${sharePrice} ${cfg.asset.symbol}`,
    remainingCapacity: snap?.maxDeposit ?? null,
    totalAssets: snap?.totalAssets ?? null,
    capacityDecimals: assetDecimals,
    capacitySymbol: cfg.asset.symbol,
    walletAddress: address,
    vaultKey: tokenOut.id,
  };

  const walletStepProps = {
    step,
    depositTokenSymbol: depositToken.symbol,
    // HBAR goes in natively — no approval, just the deposit.
    preSteps: isHbarRoute ? [] : undefined,
    isBridging: false,
    pollStatus: null,
    txHash: txHash ?? null,
    explorerBase,
    referralStep: 'none' as const,
    referralCode: null,
    onStart: startDeposit,
    onBack: () => setStep(REVIEW),
  };
  const reviewProps = {
    tokenOutName: tokenOut.name,
    selectedTokenSymbol: depositToken.symbol,
    num,
    address,
    previewShares,
    formatShares,
    apyDisplay,
    networkName: cfg.chain.name,
    onConfirm: () => setStep(WALLET_READY),
    onBack: () => setStep(INPUT),
  };
  const completeProps = {
    txHash: txHash ?? null,
    explorerBase,
    note: isHbarRoute
      ? 'Your HBAR was converted to HBARX inside the vault. Withdrawals are a request followed by a claim, and pay out in HBARX.'
      : 'Withdrawals are a request followed by a claim, and pay out in HBARX.',
    onReset: reset,
    onDashboard: () => {
      handleClose();
      router.push('/dashboard');
    },
  };
  const disclaimer = (
    <DisclaimerDialog
      open={disclaimerOpen}
      address={address}
      onAgree={() => {
        setDisclaimerOpen(false);
        if (pendingDepositRef.current) {
          pendingDepositRef.current = false;
          proceedAfterDisclaimer();
        }
      }}
      onCancel={() => {
        setDisclaimerOpen(false);
        pendingDepositRef.current = false;
      }}
    />
  );

  if (inline) {
    const wrap = (node: React.ReactNode) => (
      <div className="widget" style={{ paddingTop: 24, paddingBottom: 20 }}>
        {node}
      </div>
    );
    return (
      <>
        <ModalKeyframes hideNumberSpinners />
        {isInputStep && <DepositInputStep {...inputProps} />}
        {step === REVIEW && wrap(<DepositReviewStep {...reviewProps} inline />)}
        {isWalletStep && wrap(<DepositWalletStep {...walletStepProps} inline />)}
        {step === COMPLETE && wrap(<DepositCompleteStep {...completeProps} />)}
        {disclaimer}
      </>
    );
  }

  return (
    <Dialog open={open ?? false} onOpenChange={handleClose}>
      <DialogContent
        instant={instant}
        className="!max-h-[90dvh] !w-[min(470px,calc(100vw-24px))] !max-w-none border-0 bg-transparent p-0 shadow-none [&>button]:hidden"
        onPointerDownOutside={preventRainbowKitDismiss}
        onInteractOutside={preventRainbowKitDismiss}
      >
        <div className="dep-modal-card">
          <ModalKeyframes hideNumberSpinners />
          <DepositModalHeader
            stepIndex={stepIndex}
            labels={STEP_LABELS}
            showBack={step === REVIEW || step === WALLET_READY}
            onBack={() => setStep(step === WALLET_READY ? REVIEW : INPUT)}
            onClose={handleClose}
          />
          <div className="dep-modal-body">
            {isInputStep && <DepositInputStep {...inputProps} isModal />}
            {step === REVIEW && <DepositReviewStep {...reviewProps} />}
            {isWalletStep && <DepositWalletStep {...walletStepProps} />}
            {step === COMPLETE && <DepositCompleteStep {...completeProps} />}
          </div>
          {disclaimer}
        </div>
      </DialogContent>
    </Dialog>
  );
}
