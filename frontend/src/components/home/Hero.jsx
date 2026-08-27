import React from 'react'
import { Link } from 'react-router-dom'
import { heroImages } from '../../data/mockData'
import './Hero.css'

// Each image is visible for SLIDE_SECONDS, with the crossfade blending into
// the transition itself so there is never a blank frame between photos.
const SLIDE_SECONDS = 6
const CYCLE_SECONDS = SLIDE_SECONDS * heroImages.length

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-slideshow" aria-hidden="true">
        {heroImages.map((src, i) => (
          <div
            key={src}
            className="hero-slide"
            style={{
              backgroundImage: `url(${src})`,
              animationDuration: `${CYCLE_SECONDS}s`,
              animationDelay: `${-i * SLIDE_SECONDS}s`,
            }}
          />
        ))}
        <div className="hero-scrim" />
      </div>

      <div className="container hero-content">
        <p className="hero-eyebrow">Bangladesh, end to end</p>
        <h1 className="hero-title">
          Plan your journey across <span>Bangladesh</span> with OVIZATRI
        </h1>
        <p className="hero-sub">
          Discover destinations, compare tour packages from local agencies, and book your next trip in one place.
        </p>
        <div className="hero-actions">
          <Link to="/destinations" className="btn btn-gold">
            Explore Destinations
          </Link>
          <Link to="/packages" className="btn btn-outline hero-btn-outline">
            Browse Tour Packages
          </Link>
        </div>
      </div>
    </section>
  )
}
