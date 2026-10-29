'use client'

import React from 'react'

interface TxCardProps {
  num: number | string
  title: string
  description?: string
  alwaysShowDescription?: boolean
  active?: boolean
  done?: boolean
  showSpinner?: boolean
  children?: React.ReactNode
}

export function TxCard({
  num, title, description, alwaysShowDescription,
  active, done, showSpinner, children,
}: TxCardProps) {
  const showDesc = alwaysShowDescription || active || done
  return (
    <div className={`dep-tx-item${done ? ' done' : active ? ' active' : ''}`}>
      <div className="dep-tx-num">{done ? '✓' : num}</div>
      <div className="dep-tx-body">
        <div className="dep-tx-title">{title}</div>
        {showDesc && description && <div className="dep-tx-desc">{description}</div>}
        {children}
      </div>
      {showSpinner && <div className="dep-tx-spinner" />}
    </div>
  )
}
