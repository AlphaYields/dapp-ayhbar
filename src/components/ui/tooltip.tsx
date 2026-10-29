'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'

interface TooltipProps {
  content: string
  children: React.ReactNode
  className?: string
  innerClassName?: string
}

export function Tooltip({ content, children, className, innerClassName }: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false)
  const [position, setPosition] = React.useState({ x: 0, y: 0 })
  const triggerRef = React.useRef<HTMLDivElement>(null)

  const handleMouseEnter = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPosition({
        x: rect.left + rect.width / 2,
        y: rect.top
      })
    }
    setIsVisible(true)
  }

  return (
    <div
      ref={triggerRef}
      className={className ?? 'relative inline-block'}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsVisible(false)}
    >
      <div className={innerClassName ?? 'cursor-help'}>
        {children}
      </div>
      {isVisible && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed z-[9999] w-64 pointer-events-none"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: 'translate(-50%, calc(-100% - 8px))'
          }}
        >
          <div className="bg-[#4A4A4A] text-white text-sm font-manjari p-4 rounded-lg shadow-lg">
            {content}
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="border-8 border-transparent border-t-[#4A4A4A]"></div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

// Info icon component
export function InfoIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="8"
      height="8"
      viewBox="0 0 8 8"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 0.5C5.933 0.5 7.5 2.067 7.5 4C7.5 5.933 5.933 7.5 4 7.5H0.5V4C0.5 2.067 2.067 0.5 4 0.5Z"
        stroke="#F2ECE4"
      />
      <path
        d="M4.49288 1.87128C4.49288 1.98702 4.44658 2.09119 4.36555 2.18379C4.28453 2.26481 4.18036 2.31111 4.06461 2.31111C4.00674 2.31111 3.96044 2.29954 3.90257 2.27639C3.85627 2.25324 3.80997 2.21852 3.76367 2.18379C3.72895 2.14907 3.69423 2.10277 3.67108 2.0449C3.64793 1.98702 3.63635 1.94072 3.63635 1.87128C3.63635 1.8134 3.64793 1.7671 3.67108 1.72081C3.69423 1.67451 3.72895 1.62821 3.76367 1.58191C3.7984 1.54719 3.8447 1.51246 3.90257 1.48931C3.94887 1.46616 4.00674 1.45459 4.06461 1.45459C4.12249 1.45459 4.16879 1.46616 4.22666 1.48931C4.27296 1.51246 4.31926 1.54719 4.36555 1.58191C4.41185 1.61663 4.435 1.66293 4.45815 1.70923C4.4813 1.75553 4.49288 1.8134 4.49288 1.87128ZM4.44658 5.40154C4.44658 5.52886 4.41185 5.63303 4.34241 5.70248C4.27296 5.7835 4.18036 5.81823 4.06461 5.81823C3.94887 5.81823 3.85627 5.7835 3.78682 5.70248C3.71738 5.62146 3.68265 5.52886 3.68265 5.40154V3.31811C3.68265 3.19078 3.71738 3.08661 3.78682 3.01717C3.85627 2.93614 3.94887 2.90142 4.06461 2.90142C4.18036 2.90142 4.27296 2.93614 4.34241 3.01717C4.41185 3.09819 4.44658 3.19078 4.44658 3.31811V5.40154Z"
        fill="#F2ECE4"
      />
    </svg>
  )
}
