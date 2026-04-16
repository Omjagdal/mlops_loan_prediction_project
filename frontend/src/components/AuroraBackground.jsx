import { useEffect, useRef } from 'react'

/**
 * AuroraBackground — Cinematic animated aurora/nebula effect
 * Creates a living, breathing background with animated gradient blobs
 */
export default function AuroraBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    let animationId
    let time = 0

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Aurora blob definitions
    const blobs = [
      { x: 0.3, y: 0.2, radius: 400, color: [255, 140, 66], speed: 0.0003, phase: 0 },
      { x: 0.7, y: 0.8, radius: 350, color: [255, 107, 107], speed: 0.0004, phase: 2 },
      { x: 0.5, y: 0.5, radius: 500, color: [255, 179, 102], speed: 0.0002, phase: 4 },
      { x: 0.2, y: 0.7, radius: 300, color: [251, 191, 36], speed: 0.00035, phase: 1 },
    ]

    const animate = () => {
      time += 1
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      blobs.forEach(blob => {
        const cx = canvas.width * (blob.x + Math.sin(time * blob.speed + blob.phase) * 0.15)
        const cy = canvas.height * (blob.y + Math.cos(time * blob.speed * 0.7 + blob.phase) * 0.1)
        const r = blob.radius + Math.sin(time * blob.speed * 1.5) * 50

        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
        gradient.addColorStop(0, `rgba(${blob.color.join(',')}, 0.06)`)
        gradient.addColorStop(0.5, `rgba(${blob.color.join(',')}, 0.025)`)
        gradient.addColorStop(1, 'rgba(0,0,0,0)')

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.fill()
      })

      // Subtle scanline effect
      ctx.fillStyle = 'rgba(255, 140, 66, 0.003)'
      for (let y = 0; y < canvas.height; y += 4) {
        if (y % 8 === 0) {
          ctx.fillRect(0, y, canvas.width, 1)
        }
      }

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="aurora-canvas"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.8,
      }}
    />
  )
}
