import { useEffect, useRef } from 'react'

/**
 * Organic Particle System — Emerald Sanctuary
 * Subtle floating particles with emerald/sage tones on warm beige
 */
export default function ParticleSystem({ count = 25 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    let animationId
    let mouse = { x: -1000, y: -1000 }

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const handleMouse = (e) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }
    window.addEventListener('mousemove', handleMouse)

    // Emerald/sage particles
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 2 + 0.5,
      speedX: (Math.random() - 0.5) * 0.2,
      speedY: -Math.random() * 0.3 - 0.05,
      opacity: Math.random() * 0.3 + 0.05,
      pulseSpeed: Math.random() * 0.015 + 0.003,
      pulsePhase: Math.random() * Math.PI * 2,
      hue: Math.random() > 0.6 ? 145 : 130, // emerald hues
    }))

    // Soft ambient orbs
    const orbs = Array.from({ length: 3 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 100 + 60,
      speedX: (Math.random() - 0.5) * 0.08,
      speedY: (Math.random() - 0.5) * 0.08,
      opacity: Math.random() * 0.02 + 0.005,
      hue: Math.random() > 0.5 ? 145 : 25,
    }))

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw ambient orbs
      orbs.forEach(orb => {
        orb.x += orb.speedX
        orb.y += orb.speedY

        if (orb.x < -100 || orb.x > canvas.width + 100) orb.speedX *= -1
        if (orb.y < -100 || orb.y > canvas.height + 100) orb.speedY *= -1

        const gradient = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.size)
        gradient.addColorStop(0, `hsla(${orb.hue}, 60%, 50%, ${orb.opacity})`)
        gradient.addColorStop(1, 'hsla(0, 0%, 100%, 0)')
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(orb.x, orb.y, orb.size, 0, Math.PI * 2)
        ctx.fill()
      })

      // Draw particles
      particles.forEach(p => {
        p.x += p.speedX
        p.y += p.speedY
        p.pulsePhase += p.pulseSpeed

        // Mouse interaction — gentle drift
        const dx = p.x - mouse.x
        const dy = p.y - mouse.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 120) {
          const force = (120 - dist) / 120 * 0.3
          p.x += dx / dist * force
          p.y += dy / dist * force
        }

        // Wrap
        if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width }
        if (p.x < -10) p.x = canvas.width + 10
        if (p.x > canvas.width + 10) p.x = -10

        const currentOpacity = p.opacity * (0.5 + Math.sin(p.pulsePhase) * 0.5)

        ctx.shadowBlur = p.size * 3
        ctx.shadowColor = `hsla(${p.hue}, 55%, 45%, ${currentOpacity * 0.5})`

        ctx.fillStyle = `hsla(${p.hue}, 55%, 45%, ${currentOpacity})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()

        ctx.shadowBlur = 0
      })

      // Subtle connection lines (sage green)
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 100) {
            const alpha = (1 - dist / 100) * 0.03
            ctx.strokeStyle = `rgba(0, 109, 55, ${alpha})`
            ctx.lineWidth = 0.5
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouse)
    }
  }, [count])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}
