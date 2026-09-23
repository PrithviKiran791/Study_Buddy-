import React from 'react'
import { MinimalTimer } from './Counter'

export type FlipCountdownProps = {
  countFrom?: number | string | bigint
  countTo?: number | string | bigint
  value?: number | string | bigint
  className?: string
  cardBgColor?: string
  textColor?: string
}

export const FlipCountdown: React.FC<FlipCountdownProps> = ({
  value,
  className,
}) => {
  const numValue = typeof value === 'bigint' ? Number(value) : Number(value || 0)
  return <MinimalTimer timeLeft={numValue} className={className} />
}

export default FlipCountdown
