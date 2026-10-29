'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Footer } from '@/components/footer';

export default function MaintenancePage() {
  const router = useRouter();

  // Periodically re-check: once the vault(s) leave maintenance, the middleware
  // redirects the user back to the app on the next navigation/refresh.
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 30000);
    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center px-5 py-16 text-center">
        <div className="w-full max-w-[480px]">
          <div className="mb-8 flex justify-center">
            <Image src="/logo.svg" alt="AlphaYields" width={48} height={48} className="h-12 w-auto object-contain" />
          </div>

          <div
            className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: 'rgba(166,237,69,0.12)', boxShadow: '0 0 30px rgba(166,237,69,0.18)' }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#A6ED45"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Under maintenance</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            We&apos;re performing scheduled maintenance on our vaults. The app is temporarily unavailable and will be
            back shortly. Thanks for your patience.
          </p>

          <p className="mt-6 text-xs text-muted-foreground/70">This page refreshes automatically.</p>
        </div>
      </div>

      <div className="-mb-[40px] w-full">
        <Footer />
      </div>
    </div>
  );
}
