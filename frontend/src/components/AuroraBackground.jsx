import { useEffect, useRef } from 'react'

/**
 * AuroraBackground — Organic Sanctuary warm glow effect
 * Creates subtle, living gradient blobs with emerald & terracotta
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

    // Organic blobs — emerald, sage, and terracotta
    const blobs = [
      { x: 0.3, y: 0.15, radius: 450, color: [46, 204, 113], speed: 0.0002, phase: 0 },
      { x: 0.75, y: 0.7, radius: 380, color: [152, 71, 42], speed: 0.00025, phase: 2 },
      { x: 0.5, y: 0.4, radius: 500, color: [0, 109, 55], speed: 0.00015, phase: 4 },
      { x: 0.2, y: 0.8, radius: 320, color: [181, 241, 192], speed: 0.0003, phase: 1 },
    ]

    const animate = () => {
      time += 1
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      blobs.forEach(blob => {
        const cx = canvas.width * (blob.x + Math.sin(time * blob.speed + blob.phase) * 0.12)
        const cy = canvas.height * (blob.y + Math.cos(time * blob.speed * 0.7 + blob.phase) * 0.08)
        const r = blob.radius + Math.sin(time * blob.speed * 1.5) * 40

        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
        gradient.addColorStop(0, `rgba(${blob.color.join(',')}, 0.04)`)
        gradient.addColorStop(0.5, `rgba(${blob.color.join(',')}, 0.015)`)
        gradient.addColorStop(1, 'rgba(254,249,240,0)')

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.fill()
      })

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
        opacity: 0.6,
      }}
    />
  )
}
