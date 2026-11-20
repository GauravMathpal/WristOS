import { useState, useEffect } from 'react'

interface WordRevealProps {
  text: string
  animate?: boolean
  className?: string
  onComplete?: () => void
  speed?: number
}

export function WordReveal({ 
  text, 
  animate = true, 
  className = '', 
  onComplete,
  speed = 28 
}: WordRevealProps) {
  const words = text.split(' ')
  const [revealedCount, setRevealedCount] = useState(animate ? 0 : words.length)

  useEffect(() => {
    if (!animate) {
      setRevealedCount(words.length)
      return
    }

    setRevealedCount(0)
    let current = 0
    const interval = setInterval(() => {
      current += 1
      setRevealedCount(current)
      if (current >= words.length) {
        clearInterval(interval)
        onComplete?.()
      }
    }, speed)

    return () => clearInterval(interval)
  }, [text, animate, speed])

  if (!animate || revealedCount >= words.length) {
    return <span className={className}>{text}</span>
  }

  return (
    <span className={`inline ${className}`} style={{ contain: 'layout' }}>
      {words.slice(0, revealedCount).join(' ')}
      <span className="inline-block w-1.5 h-3.5 bg-pink-400 rounded-sm ml-1 align-middle animate-pulse" />
    </span>
  )
}
