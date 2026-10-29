/**
 * Link shim for the ported aytokens marketing components (Phase D). The dapp
 * token pages live at real in-app routes; "Trust Center"/Research are marketing
 * destinations on the public website. Deposit CTAs no longer link out — they
 * open the in-app DepositModal — so `app.*` is kept only as a harmless fallback.
 */
export const LINKS = {
  routes: {
    aytokens: '/aytokens',
    ayhbar: '/aytokens/ayhbar',
    research: 'https://alphayields.ai/research',
    researchArchive: 'https://alphayields.ai/research#archive',
    trustcenter: 'https://alphayields.ai/trustcenter#explorer',
  },
  app: {
    ayhbar: '/aytokens/ayhbar',
  },
  docs: 'https://alphayields.ai/docs',
  riskFramework: 'https://alphayields.ai/docs/risk-scoring',
} as const;
