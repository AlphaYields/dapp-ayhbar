"use client";

import { useEffect, useRef } from "react";
import { useAccount, useDisconnect, useReconnect } from "wagmi";

/**
 * Listens for accountsChanged events on the active wallet connector
 * (MetaMask, WalletConnect, or any injected wallet) and seamlessly
 * updates the connected account when the user switches wallets.
 */
export function useAccountChange() {
  const { isConnected, address, connector } = useAccount();
  const { disconnect } = useDisconnect();
  const { reconnect } = useReconnect();
  const addressRef = useRef(address);

  // Keep ref in sync so the event handler always sees the latest address
  useEffect(() => {
    addressRef.current = address;
  }, [address]);

  useEffect(() => {
    if (!isConnected || !connector) return;

    let provider: any = null;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
        return;
      }

      if (accounts[0].toLowerCase() !== addressRef.current?.toLowerCase()) {
        reconnect();
      }
    };

    if (typeof connector.getProvider !== "function") return;

    connector.getProvider().then((p: any) => {
      if (!p?.on) return;
      provider = p;
      provider.on("accountsChanged", handleAccountsChanged);
    });

    return () => {
      if (provider?.removeListener) {
        provider.removeListener("accountsChanged", handleAccountsChanged);
      }
    };
  }, [isConnected, connector, disconnect, reconnect]);
}
