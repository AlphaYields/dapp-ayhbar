interface TrustWalletIconProps {
  className?: string;
}

export function TrustWalletIcon({ className }: TrustWalletIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="40" height="40" rx="8" fill="#0500FF" />
      <path
        d="M20 8L8 13V19C8 26.18 13.12 32.82 20 35C26.88 32.82 32 26.18 32 19V13L20 8Z"
        fill="white"
      />
      <path
        d="M20 10.5L10.5 14.5V19C10.5 24.82 14.62 30.22 20 32C25.38 30.22 29.5 24.82 29.5 19V14.5L20 10.5Z"
        fill="#0500FF"
      />
      <path
        d="M20 13L13 16V19C13 23.42 16.12 27.52 20 29C23.88 27.52 27 23.42 27 19V16L20 13Z"
        fill="white"
      />
    </svg>
  );
}
