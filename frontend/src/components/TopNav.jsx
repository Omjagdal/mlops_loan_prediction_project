import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/predict', label: 'Predict' },
  { to: '/performance', label: 'Performance' },
  { to: '/experiments', label: 'Experiments' },
  { to: '/monitoring', label: 'Monitoring' },
]

export default function TopNav() {
  const location = useLocation()

  return (
    <motion.nav
      className="top-nav"
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
    >
      <div className="top-nav-content">
        <div className="top-nav-logo">
          <motion.div
            className="logo-icon"
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            L
          </motion.div>
          <span className="logo-text">LoanAI</span>
        </div>
        
        <div className="top-nav-links">
          {links.map((link, i) => {
            const isActive = location.pathname === link.to
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => `top-nav-link ${isActive ? 'active' : ''}`}
              >
                <motion.span
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.06, duration: 0.4 }}
                >
                  {link.label}
                </motion.span>
                {isActive && (
                  <motion.div
                    className="nav-active-indicator"
                    layoutId="nav-indicator"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
              </NavLink>
            )
          })}
        </div>
      </div>
    </motion.nav>
  )
}
