import { NextResponse, type NextRequest } from 'next/server';
import { VAULT_MAP } from '@/lib/contracts';

const MAINTENANCE_PATH = '/maintenance';
const UPSTREAM = 'https://accounting.alphayields.ai/vaultdata';

// Cache the maintenance status in module scope so we don't hit the upstream API
// on every single request. Serverless/edge instances are reused, so this keeps
// the check cheap while still picking up status changes within ~30s.
const CACHE_TTL_MS = 30_000;
let cache: { value: boolean; expiresAt: number } | null = null;

async function isAnyVaultUnderMaintenance(): Promise<boolean> {
  if (cache && cache.expiresAt > Date.now()) {
    return cache.value;
  }

  const apiKey = process.env.ACCOUNTING_API_KEY;

  if (!apiKey) {
    // Fail open: without credentials we can't check status, don't lock users out.
    console.error('[vault-data] ACCOUNTING_API_KEY is not set in this environment');
    return false;
  }

  let underMaintenance = false;
  try {
    const responses = await Promise.allSettled(
      Object.values(VAULT_MAP).map((vaultAddress) =>
        fetch(`${UPSTREAM}?vaultAddress=${vaultAddress}`, { headers: { 'x-api-key': apiKey } })
      )
    );

    for (const response of responses) {
      if (response.status === 'fulfilled' && response.value.ok) {
        const data = await response.value.json();
        if (data?.general_info?.under_maintenance) {
          underMaintenance = true;
          break;
        }
      }
    }

    cache = { value: underMaintenance, expiresAt: Date.now() + CACHE_TTL_MS };
  } catch (error) {
    // Fail open: if we can't determine status, don't lock users out of the app.
    console.error('Maintenance check failed:', error);
    return false;
  }

  return underMaintenance;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const onMaintenancePage = pathname === MAINTENANCE_PATH;

  const underMaintenance = await isAnyVaultUnderMaintenance();

  if (underMaintenance && !onMaintenancePage) {
    const url = request.nextUrl.clone();
    url.pathname = MAINTENANCE_PATH;
    return NextResponse.redirect(url);
  }

  if (!underMaintenance && onMaintenancePage) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Run on all routes except API routes, Next.js internals and static files.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
