import { useEffect, useRef } from 'react'

/**
 * Cinematic Particle System — floating ember particles
 * Creates warm ambient particles that drift upward
 */
export default function ParticleSystem({ count = 30 }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const particles = []
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div')
      p.className = 'particle'
      const size = Math.random() * 3 + 1
      const left = Math.random() * 100
      const duration = Math.random() * 15 + 10
      const delay = Math.random() * 10
      const opacity = Math.random() * 0.4 + 0.1

      p.style.cssText = `
        left: ${left}%;
        width: ${size}px;
        height: ${size}px;
        animation-duration: ${duration}s;
        animation-delay: ${delay}s;
        filter: blur(${size > 2 ? 1 : 0}px);
        --max-opacity: ${opacity};
      `
      container.appendChild(p)
      particles.push(p)
    }

    return () => {
      particles.forEach(p => p.remove())
    }
  }, [count])

  return <div ref={containerRef} className="particles-container" />
}
