import React from 'react';
import { Helmet } from 'react-helmet-async';
import Home from './Home';
import './TourDetails.css';
import daikokuImg from '../assets/home/daikoku.webp';

const TourDaikoku = () => {
  return (
    <>
      <Helmet>
        <title>R34 Daikoku PA Tour — Tokyo JDM Night Experience | DAIKOKU HUNTERS</title>
        <meta name="description" content="Ride shotgun in an R34 GT-R to Daikoku PA — Tokyo's legendary underground car meet. Join local JDM crew for a night you won't forget. ¥5,000, book now." />
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "TouristTrip",
              "name": "R34 Daikoku PA Tour — Tokyo JDM Night Experience",
              "description": "Cruise in a Nissan Skyline R34 GT-R to Daikoku PA — the world-famous JDM car meet on a man-made pier in Yokohama beneath the spiraling ramps of the Bayshore Route.",
              "url": "https://www.daikokuhunter.com/tours/daikoku-pa",
              "provider": {
                "@type": "Organization",
                "name": "DAIKOKU HUNTERS",
                "url": "https://www.daikokuhunter.com"
              },
              "offers": {
                "@type": "Offer",
                "price": "5000",
                "priceCurrency": "JPY",
                "availability": "https://schema.org/InStock",
                "url": "https://reserve.daikokuhunter.com/tours/daikoku-pa"
              },
              "touristType": ["Car enthusiasts", "JDM fans", "International tourists"],
              "subjectOf": {
                "@type": "Place",
                "name": "Daikoku PA (Daikoku Futo Parking Area)",
                "geo": {
                  "@type": "GeoCoordinates",
                  "latitude": "35.4698",
                  "longitude": "139.6483"
                },
                "sameAs": "https://www.wikidata.org/wiki/Q11597520"
              }
            }
          `}
        </script>
      </Helmet>
      <div className="tour-page-container">
        <div className="tour-hero" style={{ backgroundImage: `url(${daikokuImg})` }}>
          <div className="tour-hero-content">
            <h1>Daikoku Tour</h1>
            <p>Hitting the highway to the legendary car meet.</p>
          </div>
        </div>

        <section className="tour-details-section">
          <h2>Ride in modified R34</h2>
          <p>
            Cruise Tokyo in a cool R34 and hit the highway to a car meet! We'll take you on the hottest runs and to the best car meets. 
            We're an underground car crew from Tokyo, living the true JDM street culture. Driving is what we live for.
          </p>
          <p>
            We know every twist, turn, and hidden spot of Tokyo's complex highways, right down to the smallest bumps and seams.
            Every car in our lineup is personally owned and customized by its driver.
          </p>
          <div className="tour-price-badge">From ¥5,000 Deposit</div>
        </section>

        <div className="booking-engine-wrapper" id="booking-section">
          {/* We pass the tourType down to the existing booking engine component */}
          <Home tourType="Daikoku Tour" isDedicatedPage={true} />
        </div>
      </div>
    </>
  );
};

export default TourDaikoku;
