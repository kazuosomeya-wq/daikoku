import React from 'react';
import { Helmet } from 'react-helmet-async';
import './LandingPage.css';
import heroImg from '../assets/home/hero.webp';
import daikokuImg from '../assets/home/daikoku.webp';
import umihotaruImg from '../assets/home/umihotaru.webp';

const LandingPage = () => {
  return (
    <div className="landing-page-container">
      <Helmet>
        <title>Daikoku PA JDM Car Tour | Ride R34 GT-R in Tokyo – DAIKOKU HUNTERS</title>
        <meta name="description" content="Book a JDM night tour in Tokyo — ride in a real Nissan Skyline R34 GT-R to Daikoku PA car meet. Tours from ¥5,000. Hotel pickup from Shinjuku, Shibuya, and Roppongi." />
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": ["Organization", "LocalBusiness", "TouristInformationCenter"],
              "name": "DAIKOKU HUNTERS",
              "url": "https://www.daikokuhunter.com",
              "description": "JDM automotive tour experiences in Tokyo. Guided night rides in a Nissan Skyline R34 GT-R to Daikoku PA and Umihotaru PA — Japan's most famous car meet locations.",
              "priceRange": "¥¥",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Tokyo",
                "addressCountry": "JP"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": "35.6762",
                "longitude": "139.6503"
              },
              "sameAs": [
                "https://www.instagram.com/daikoku_hunters/"
              ],
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "reservations",
                "url": "https://reserve.daikokuhunter.com"
              }
            }
          `}
        </script>
      </Helmet>

      {/* Hero Section */}
      <section className="hero-section" style={{ backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.3), #0a0a0c), url(${heroImg})` }}>
        <h1>Tokyo R34 & JDM Night Experience</h1>
        <p>Ride the R34 GT-R, Supra and other JDM legends to the underground carmeet.</p>
        <a href="#tours" className="hero-cta-btn">BOOK NOW</a>
      </section>

      {/* Intro Section */}
      <section className="intro-section">
        <h2>Ride in modified R34</h2>
        <p>Cruise Tokyo in a cool R34 and hit the highway to a car meet! We'll take you on the hottest runs and to the best car meets.</p>
      </section>

      {/* Tours Grid */}
      <section className="tours-section" id="tours">
        <h2 className="section-title">Tour</h2>
        <div className="tours-grid">
           <a href="/tours/daikoku-pa" className="tour-card">
              <div className="tour-image" style={{ backgroundImage: `url(${daikokuImg})` }}>
                 <div className="view-more-overlay"><span>VIEW MORE</span></div>
              </div>
              <div className="tour-content">
                 <h3>Daikoku Tour</h3>
                 <span className="tour-price">From ¥5,000</span>
              </div>
           </a>
           <a href="/tours/umihotaru-pa" className="tour-card">
              <div className="tour-image" style={{ backgroundImage: `url(${umihotaruImg})` }}>
                 <div className="view-more-overlay"><span>VIEW MORE</span></div>
              </div>
              <div className="tour-content">
                 <h3>Midnight Tour (Fri-Sat only)</h3>
                 <span className="tour-price">From ¥5,000</span>
              </div>
           </a>
        </div>
      </section>

      {/* Crew & Cars Section */}
      <section className="crew-section">
        <h2 className="section-title">Car Lineup</h2>
        <div className="crew-text">
          <p>We're an underground car crew from Tokyo, living the true JDM street culture. Driving is what we live for.</p>
          <p>We know every twist, turn, and hidden spot of Tokyo's complex highways, right down to the smallest bumps and seams.</p>
          <p>Every car in our lineup is personally owned and customized by its driver.</p>
          <p>Choose your ride and join the ultimate night cruise.</p>
        </div>
      </section>

      {/* Booking CTA Section */}
      <section className="booking-cta-section">
        <h2>To book, send us a DM or use the booking link below</h2>
        <div className="cta-links">
          <a href="#tours" className="cta-button primary">BOOKING</a>
          <a href="https://www.instagram.com/daikoku_hunters/" target="_blank" rel="noopener noreferrer" className="cta-button secondary">instagram DM @daikoku_hunters</a>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
