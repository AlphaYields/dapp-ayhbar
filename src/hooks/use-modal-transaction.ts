"use client";

import { useState, useEffect, useCallback } from "react";
import type { Hash } from "viem";

interface UseModalTransactionOptions {
  /** Steps during which the modal cannot be closed */
  busySteps: string[];
  /** Called when the modal is closed or reset (for modal-specific cleanup) */
  onReset?: () => void;
  /** Called when the modal is closed */
  onClose: () => void;
  /** Initial step value */
  initialStep?: string;
}

export function useModalTransaction({
  busySteps,
  onReset,
  onClose,
  initialStep = "idle",
}: UseModalTransactionOptions) {
  const [step, setStep] = useState(initialStep);
  const [mounted, setMounted] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<Hash | undefined>();
  const [isTxPending, setIsTxPending] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const reset = useCallback(() => {
    setStep(initialStep);
    setTxError(null);
    setTxHash(undefined);
    setIsTxPending(false);
    onReset?.();
  }, [initialStep, onReset]);

  const handleClose = useCallback(() => {
    if (!isTxPending && !busySteps.includes(step)) {
      reset();
      onClose();
    }
  }, [isTxPending, busySteps, step, reset, onClose]);

  return {
    step,
    setStep,
    mounted,
    txError,
    setTxError,
    txHash,
    setTxHash,
    isTxPending,
    setIsTxPending,
    reset,
    handleClose,
  };
}
