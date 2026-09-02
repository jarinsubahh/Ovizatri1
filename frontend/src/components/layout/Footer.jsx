import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <div className="footer-logo">
            <span>⋏</span> OVIZATRI
          </div>
          <p className="footer-tagline">
            Discover Bangladesh, plan your journey and make every trip unforgettable!
          </p>
        </div>

        <div className="footer-column">
          <h4 className="footer-column-title">Explore</h4>
          <ul className="footer-links">
            <li><Link to="/destinations">Destinations</Link></li>
            <li><Link to="/packages">Tour Packages</Link></li>
            <li><Link to="/blog">Blog</Link></li>
          </ul>
        </div>

        <div className="footer-column">
          <h4 className="footer-column-title">For Agencies</h4>
          <ul className="footer-links">
            <li><Link to="/agency/signin">Agency Sign In</Link></li>
            <li><Link to="/agency/signup">List Your Agency</Link></li>
          </ul>
        </div>

        <div className="footer-column">
          <h4 className="footer-column-title">Account</h4>
          <ul className="footer-links">
            <li><Link to="/signin">Traveler Sign In</Link></li>
            <li><Link to="/signup">Create an Account</Link></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2026 OVIZATRI.A live booking service.</p>
      </div>
    </footer>
  );
};

export default Footer;