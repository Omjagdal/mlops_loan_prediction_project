import { NavLink } from 'react-router-dom'

export default function TopNav() {
  const links = [
    { to: '/', label: 'Dashboard' },
    { to: '/predict', label: 'Predict' },
    { to: '/performance', label: 'Performance' },
    { to: '/experiments', label: 'Experiments' },
    { to: '/monitoring', label: 'Monitoring' },
  ]

  return (
    <nav className="top-nav">
      <div className="top-nav-content">
        <div className="top-nav-logo">
          <div className="logo-icon">L</div>
          <span className="logo-text">LoanAI</span>
        </div>
        
        <div className="top-nav-links">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `top-nav-link ${isActive ? 'active' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
