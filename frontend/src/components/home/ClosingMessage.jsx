import React from 'react'
import { Link } from 'react-router-dom'
import './ClosingMessage.css'

export default function ClosingMessage() {
  return (
    <section className="closing-message">
      <div className="container closing-message-inner">
        <svg className="river-divider" viewBox="0 0 64 14" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ margin: '0 auto 18px' }}>
          <path d="M2 10 C 18 10, 18 3, 32 3 C 46 3, 46 10, 62 10" />
        </svg>
        <p className="eyebrow closing-eyebrow">Your journey starts here</p>
        <h2>Bangladesh is waiting to be discovered</h2>
        <p className="closing-lead">
          From the cloud-covered hills of Sajek to the tidal creeks of the Sundarbans, OVIZATRI brings together
          trusted local agencies and honest traveler reviews so you can plan your next trip with confidence.
        </p>
        <Link to="/destinations" className="btn btn-gold">
          Start Exploring
        </Link>
      </div>
    </section>
  )
}