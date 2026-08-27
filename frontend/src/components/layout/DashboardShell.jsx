import React from 'react'
import { NavLink } from 'react-router-dom'
import './DashboardShell.css'

/**
 * Shared sidebar + content shell used by the traveler, agency and admin
 * dashboards. `items` is an array of { to, label, exact }.
 */
export default function DashboardShell({ title, subtitle, items, children }) {
  return (
    <div className="dash">
      <div className="container dash-inner">
        <aside className="dash-sidebar">
          <div className="dash-sidebar-head">
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <nav className="dash-nav">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={({ isActive }) => 'dash-nav-link' + (isActive ? ' active' : '')}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <section className="dash-content">{children}</section>
      </div>
    </div>
  )
}
