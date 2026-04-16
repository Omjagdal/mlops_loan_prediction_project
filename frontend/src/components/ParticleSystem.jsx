import { useEffect, useRef } from 'react'

/**
 * Enhanced Cinematic Particle System
 * Float particles + glowing orbs + occasional light streaks
 */
export default function ParticleSystem({ count = 35 }) {
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

    // Generate particles
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 2.5 + 0.5,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: -Math.random() * 0.5 - 0.1,
      opacity: Math.random() * 0.5 + 0.1,
      pulseSpeed: Math.random() * 0.02 + 0.005,
      pulsePhase: Math.random() * Math.PI * 2,
      hue: Math.random() > 0.7 ? 20 : 30, // warm hues
    }))

    // Glowing orbs (larger, softer)
    const orbs = Array.from({ length: 5 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 80 + 40,
      speedX: (Math.random() - 0.5) * 0.15,
      speedY: (Math.random() - 0.5) * 0.15,
      opacity: Math.random() * 0.04 + 0.01,
      hue: Math.random() > 0.5 ? 25 : 0,
    }))

    // Light streaks
    const streaks = []
    let streakTimer = 0

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw glowing orbs
      orbs.forEach(orb => {
        orb.x += orb.speedX
        orb.y += orb.speedY

        if (orb.x < -100 || orb.x > canvas.width + 100) orb.speedX *= -1
        if (orb.y < -100 || orb.y > canvas.height + 100) orb.speedY *= -1

        const gradient = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.size)
        gradient.addColorStop(0, `hsla(${orb.hue}, 100%, 65%, ${orb.opacity})`)
        gradient.addColorStop(1, 'hsla(0, 0%, 0%, 0)')
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

        // Mouse interaction — subtle repulsion
        const dx = p.x - mouse.x
        const dy = p.y - mouse.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 150) {
          const force = (150 - dist) / 150 * 0.5
          p.x += dx / dist * force
          p.y += dy / dist * force
        }

        // Wrap around
        if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width }
        if (p.x < -10) p.x = canvas.width + 10
        if (p.x > canvas.width + 10) p.x = -10

        const currentOpacity = p.opacity * (0.6 + Math.sin(p.pulsePhase) * 0.4)

        // Glow
        ctx.shadowBlur = p.size * 4
        ctx.shadowColor = `hsla(${p.hue}, 100%, 70%, ${currentOpacity * 0.8})`

        ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${currentOpacity})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()

        ctx.shadowBlur = 0
      })

      // Draw connection lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            const alpha = (1 - dist / 120) * 0.06
            ctx.strokeStyle = `rgba(255, 140, 66, ${alpha})`
            ctx.lineWidth = 0.5
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }

      // Occasional light streaks
      streakTimer++
      if (streakTimer > 300 + Math.random() * 400) {
        streakTimer = 0
        streaks.push({
          x: Math.random() * canvas.width,
          y: 0,
          length: Math.random() * 200 + 100,
          speed: Math.random() * 4 + 3,
          opacity: 0.15,
          angle: Math.PI / 4 + (Math.random() - 0.5) * 0.3,
        })
      }

      streaks.forEach((s, idx) => {
        s.x += Math.cos(s.angle) * s.speed
        s.y += Math.sin(s.angle) * s.speed
        s.opacity *= 0.995

        const endX = s.x - Math.cos(s.angle) * s.length
        const endY = s.y - Math.sin(s.angle) * s.length

        const gradient = ctx.createLinearGradient(s.x, s.y, endX, endY)
        gradient.addColorStop(0, `rgba(255, 179, 102, ${s.opacity})`)
        gradient.addColorStop(1, 'rgba(255, 179, 102, 0)')

        ctx.strokeStyle = gradient
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(s.x, s.y)
        ctx.lineTo(endX, endY)
        ctx.stroke()

        if (s.opacity < 0.01 || s.y > canvas.height + 100) {
          streaks.splice(idx, 1)
        }
      })

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
