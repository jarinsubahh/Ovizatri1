import React from 'react'
import { Link } from 'react-router-dom'
import { destinations } from '../../data/mockData'
import StarRating from '../common/StarRating'
import './TopDestinations.css'

export default function TopDestinations() {
  const topDestinations = [...destinations].sort((a, b) => b.avgRating - a.avgRating).slice(0, 4)

  return (
    <section className="top-destinations container">
      <div className="section-head">
        <div>
          <p className="eyebrow">Handpicked</p>
          <h2>Top Rated Destinations</h2>
          <p className="section-lead">The destinations travelers rate highest across Bangladesh.</p>
        </div>
        <Link to="/destinations" className="btn btn-outline">
          View All Destinations
        </Link>
      </div>

      <div className="top-destinations-grid">
        {topDestinations.map((d) => (
          <Link to={`/destinations/${d.destinationID}`} key={d.destinationID} className="dest-card">
            <div className="dest-card-media">
              <img src={d.image} alt={d.name} loading="lazy" />
              <span className="badge badge-gold dest-card-badge">{d.category}</span>
            </div>
            <div className="dest-card-body">
              <h3>{d.name}</h3>
              <span className="dest-card-meta">{d.division} Division</span>
              <div className="dest-card-rating">
                <StarRating value={d.avgRating} size={13} />
                <span>{d.avgRating.toFixed(1)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}