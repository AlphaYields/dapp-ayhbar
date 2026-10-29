'use client';

/**
 * Header chrome shared by every deposit / withdraw modal: brand mark, the
 * four progress dots, the current step label and the back / close buttons.
 */
export function DepositModalHeader({
  stepIndex,
  labels,
  showBack,
  onBack,
  onClose,
  showLogo = true,
}: {
  stepIndex: number;
  labels: string[];
  showBack: boolean;
  onBack: () => void;
  onClose: () => void;
  showLogo?: boolean;
}) {
  return (
    <div className="dep-modal-head">
      <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
        {showLogo && <BrandMark />}
        <div className="dep-dots-wrap">
          {labels.map((_, i) => (
            <div key={i} className={`dep-pdot ${i < stepIndex ? 'done' : i === stepIndex ? 'active' : ''}`} />
          ))}
        </div>
        <span className="dep-head-label">{labels[stepIndex]}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {showBack && (
          <button onClick={onBack} className="dep-icon-btn" title="Back">
            ←
          </button>
        )}
        <button onClick={onClose} className="dep-icon-btn" title="Close">
          ✕
        </button>
      </div>
    </div>
  );
}

function BrandMark() {
  return (
    <svg width="20" height="23.4" viewBox="0 0 466.72 545.87" style={{ display: 'block', flexShrink: 0 }} aria-hidden>
      <path
        d="M387.05,284.11c-5.1-18.41-5.59-53.3.3-67.79,13.81-33.94,24.62-47.89,37.22-56.78,40.21-28.39,47.17-51.35,32.41-93.82s-43.57-53.86-87.2-58.46C338.34,3.94,306.65,13.94,279,29.69c-18.71,10.66-29.11,16.9-41.32,26.38C216,73,189.51,82.24,162.27,81.87c-12-.17-24.09-.48-35.77,1.1-36,4.89-68,28.65-88.6,59.42s-30.54,68-34,105.17c-5.28,57,5.15,117.43,38.74,163.13s92.91,73.32,146.84,59C210.59,464,232,452.41,253,458.46c27.57,8,38.91,41.29,60.12,61.09,25.21,23.53,65.73,25.69,95.14,8s47.2-52.46,48.53-87.45-12.6-69.56-34.62-96.27C407.18,325.7,393.39,307,387.05,284.11Zm-19.87,10.8c-17.4,51.36-60.72,74-89.36,89-30.84,16.15-90.92,47.61-141,18.29C80.41,369.25,80.41,285,80.41,269.51A185.76,185.76,0,0,1,98.65,189c5.89-12.1,44.94-92.26,123.12-96.4,69.63-3.68,114,55.91,120.38,64.7C347.68,165,390.42,226.33,367.18,294.91Z"
        fill="#A6ED45"
      />
    </svg>
  );
}

/**
 * Keep a modal open when the interaction targets RainbowKit's portal
 * ([data-rk]) or the disclaimer overlay ([data-disclaimer]) — both render
 * outside DialogContent, so Radix would otherwise treat the click as
 * "outside" and dismiss the modal.
 */
export function preventRainbowKitDismiss(e: Event) {
  const target = (e as CustomEvent).detail?.originalEvent?.target as Element | null;
  if (target?.closest?.('[data-rk]') || target?.closest?.('[data-disclaimer]')) e.preventDefault();
}
