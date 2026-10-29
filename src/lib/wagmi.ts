import { http, createConfig, createStorage, cookieStorage } from "wagmi";
import { hedera } from "wagmi/chains";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  oneKeyWallet,
  braveWallet,
} from "@rainbow-me/rainbowkit/wallets";

export { hedera };

const projectId = "unused";

const connectors = typeof window !== "undefined"
  ? connectorsForWallets(
    [
      {
        groupName: "Recommended",
        wallets: [metaMaskWallet, oneKeyWallet, braveWallet],
      },
    ],
    {
      appName: "AlphaYields",
      projectId,
    }
  )
  : [];

export const config = createConfig({
  chains: [hedera],
  connectors,
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
  transports: {
    // Hashio relay; no batching (the SDK disables it too).
    [hedera.id]: http("https://mainnet.hashio.io/api"),
  },
});

export function getMetaMaskProvider(): any | undefined {
  if (typeof window === "undefined") return undefined;

  let eip6963Provider: any = null;
  const handler = (e: any) => {
    if (e.detail?.info?.rdns === "io.metamask")
      eip6963Provider = e.detail.provider;
  };
  window.addEventListener("eip6963:announceProvider", handler);
  window.dispatchEvent(new Event("eip6963:requestProvider"));
  window.removeEventListener("eip6963:announceProvider", handler);
  if (eip6963Provider) return eip6963Provider;

  const providers: any[] = (window as any).ethereum?.providers;
  if (providers?.length) {
    return providers.find(
      (p: any) => p.isMetaMask && !p.isRainbow && !p.isBraveWallet
    );
  }

  const eth = (window as any).ethereum;
  if (
    eth?.isMetaMask &&
    !eth?.isRainbow &&
    typeof eth?._metamask !== "undefined"
  )
    return eth;
  return undefined;
}

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
