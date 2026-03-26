import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';
import logoUrl from '../assets/header_logo.webp'; // Re-using existing asset 

const Header = () => {
  return (
    <header className="global-header">
      <div className="header-container">
        <Link to="/" className="header-logo-link">
          <img src={logoUrl} alt="DAIKOKU HUNTERS Logo" className="header-logo" />
        </Link>
        <nav className="header-nav">
          <Link to="/tours/daikoku-pa" className="nav-link">Daikoku Tour</Link>
          <Link to="/tours/umihotaru-pa" className="nav-link">Midnight Tour</Link>
          <Link to="/about" className="nav-link">About Crew</Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
