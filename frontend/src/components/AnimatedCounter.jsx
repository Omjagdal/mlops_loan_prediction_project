import { useState, useEffect, useRef } from 'react'

/**
 * Animated number counter — counts from 0 to target with easing
 */
export default function AnimatedCounter({
  target,
  duration = 1500,
  decimals = 0,
  prefix = '',
  suffix = '',
  style = {},
  className = '',
}) {
  const [current, setCurrent] = useState(0)
  const startTime = useRef(null)
  const frameRef = useRef(null)

  useEffect(() => {
    startTime.current = performance.now()

    const animate = (now) => {
      const elapsed = now - startTime.current
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCurrent(eased * target)

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate)
      }
    }

    frameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameRef.current)
  }, [target, duration])

  return (
    <span className={`animated-counter ${className}`} style={style}>
      {prefix}{current.toFixed(decimals)}{suffix}
    </span>
  )
}
