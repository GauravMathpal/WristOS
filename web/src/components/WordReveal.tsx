import { motion } from 'motion/react'
import { useState, useEffect } from 'react'

interface WordRevealProps {
  text: string
  animate?: boolean
  className?: string
  onComplete?: () => void
  speed?: number // ms per word, default 40ms
}

export function WordReveal({ 
  text, 
  animate = true, 
  className = '', 
  onComplete,
  speed = 35 
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

  if (!animate) {
    return <span className={className}>{text}</span>
  }

  return (
    <span className={`inline-block ${className}`}>
      {words.slice(0, revealedCount).map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="inline-block mr-[0.28em]"
        >
          {word}
        </motion.span>
      ))}

      {revealedCount < words.length && (
        <motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: 0.6 }}
          className="inline-block w-1.5 h-3.5 bg-purple-400 rounded-sm ml-0.5 align-middle"
        />
      )}
    </span>
  )
}
