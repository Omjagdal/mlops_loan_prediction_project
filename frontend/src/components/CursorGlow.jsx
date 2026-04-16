import { useEffect, useRef, useState } from 'react'

/**
 * CursorGlow — Cinematic cursor follower with ember glow trail
 * Creates a magnetic glow that follows the mouse with smooth easing,
 * plus a trail of fading orbs behind it.
 */
export default function CursorGlow() {
  const canvasRef = useRef(null)
  const mouse = useRef({ x: -200, y: -200 })
  const smoothMouse = useRef({ x: -200, y: -200 })
  const trail = useRef([])
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationId

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const handleMouseMove = (e) => {
      mouse.current = { x: e.clientX, y: e.clientY }
      if (!isVisible) setIsVisible(true)
    }

    const handleMouseLeave = () => {
      setIsVisible(false)
      mouse.current = { x: -200, y: -200 }
    }

    window.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseleave', handleMouseLeave)

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Smooth follow with lerp
      smoothMouse.current.x += (mouse.current.x - smoothMouse.current.x) * 0.12
      smoothMouse.current.y += (mouse.current.y - smoothMouse.current.y) * 0.12

      const mx = smoothMouse.current.x
      const my = smoothMouse.current.y

      // Add to trail
      trail.current.push({ x: mx, y: my, life: 1.0 })
      if (trail.current.length > 25) trail.current.shift()

      // Draw trail orbs (oldest to newest)
      trail.current.forEach((point, i) => {
        point.life -= 0.03

        if (point.life <= 0) return

        const alpha = point.life * 0.04
        const size = point.life * 40 + 10

        const gradient = ctx.createRadialGradient(
          point.x, point.y, 0,
          point.x, point.y, size
        )
        gradient.addColorStop(0, `rgba(255, 140, 66, ${alpha * 1.5})`)
        gradient.addColorStop(0.4, `rgba(255, 140, 66, ${alpha * 0.5})`)
        gradient.addColorStop(1, 'rgba(255, 140, 66, 0)')

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(point.x, point.y, size, 0, Math.PI * 2)
        ctx.fill()
      })

      // Main cursor glow (large soft ember)
      if (mx > 0 && my > 0) {
        // Outer glow
        const outerGlow = ctx.createRadialGradient(mx, my, 0, mx, my, 180)
        outerGlow.addColorStop(0, 'rgba(255, 140, 66, 0.06)')
        outerGlow.addColorStop(0.3, 'rgba(255, 140, 66, 0.03)')
        outerGlow.addColorStop(0.6, 'rgba(255, 107, 107, 0.01)')
        outerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)')
        ctx.fillStyle = outerGlow
        ctx.beginPath()
        ctx.arc(mx, my, 180, 0, Math.PI * 2)
        ctx.fill()

        // Inner bright core
        const innerGlow = ctx.createRadialGradient(mx, my, 0, mx, my, 30)
        innerGlow.addColorStop(0, 'rgba(255, 179, 102, 0.12)')
        innerGlow.addColorStop(0.5, 'rgba(255, 140, 66, 0.05)')
        innerGlow.addColorStop(1, 'rgba(255, 140, 66, 0)')
        ctx.fillStyle = innerGlow
        ctx.beginPath()
        ctx.arc(mx, my, 30, 0, Math.PI * 2)
        ctx.fill()
      }

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1,
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.5s ease',
      }}
    />
  )
}
