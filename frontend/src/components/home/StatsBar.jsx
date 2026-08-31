import React from 'react'
import { agencies, tourPackages } from '../../data/mockData'
import { listBookings } from '../../data/store'
import './StatsBar.css'

// Agency and package counts reflect the live mock data set. Traveler and
// booking totals are illustrative platform figures for this frontend
// prototype (there is no real user base yet to count).
const STATS = [
  { key: 'agencies', label: 'Registered Agencies', value: agencies.length },
  { key: 'travelers', label: 'Travelers Served', value: 12400 },
  { key: 'packages', label: 'Curated Packages', value: tourPackages.length },
  { key: 'bookings', label: 'Successful Bookings', value: Math.max(listBookings().length, 3150) },
]

export default function StatsBar() {
  return (
    <section className="stats-bar">
      <div className="container stats-bar-inner">
        {STATS.map((s) => (
          <div className="stat-item" key={s.key}>
            <span className="stat-item-value">{s.value.toLocaleString()}+</span>
            <span className="stat-item-label">{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}