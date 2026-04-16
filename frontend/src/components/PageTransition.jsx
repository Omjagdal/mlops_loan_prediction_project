import { motion } from 'framer-motion'

/**
 * Cinematic page transition wrapper
 * Uses layered animations: blur → scale → slide → fade
 * With an overlay flash effect during transition
 */

const pageVariants = {
  initial: {
    opacity: 0,
    y: 15,
    scale: 0.98,
    filter: 'blur(4px)',
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1], // Soft custom spring/ease-out
      staggerChildren: 0.08,
      when: 'beforeChildren',
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 1.01,
    filter: 'blur(2px)',
    transition: {
      duration: 0.35,
      ease: 'easeIn',
    },
  },
}

// Child item animation for stagger effects
export const itemVariants = {
  initial: { opacity: 0, y: 15, filter: 'blur(2px)' },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
}

// Card hover animation preset
export const cardHover = {
  rest: {
    scale: 1,
    boxShadow: '0 0 0 rgba(255, 140, 66, 0)',
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
  },
  hover: {
    scale: 1.02,
    y: -4,
    boxShadow: '0 8px 40px rgba(255, 140, 66, 0.15)',
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
}

// Glow pulse animation
export const glowPulse = {
  animate: {
    boxShadow: [
      '0 0 20px rgba(255, 140, 66, 0.1)',
      '0 0 40px rgba(255, 140, 66, 0.2)',
      '0 0 20px rgba(255, 140, 66, 0.1)',
    ],
    transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
  },
}

// Transition overlay — ember flash
function TransitionOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.03, 0] }}
      transition={{ duration: 1.0, ease: 'easeInOut' }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'radial-gradient(ellipse at center, rgba(255,140,66,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 999,
      }}
    />
  )
}

export default function PageTransition({ children, className = '' }) {
  return (
    <>
      <TransitionOverlay />
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={className}
      >
        {children}
      </motion.div>
    </>
  )
}
