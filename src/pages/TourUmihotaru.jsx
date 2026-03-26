import React from 'react';
import { Helmet } from 'react-helmet-async';
import Home from './Home';
import './TourDetails.css';
import umihotaruImg from '../assets/home/umihotaru.webp';

const TourUmihotaru = () => {
  return (
    <>
      <Helmet>
        <title>R34 Midnight Tour — Tokyo Bay Custom Car Meet | DAIKOKU HUNTERS</title>
        <meta name="description" content="Friday & Saturday nights only. Cruise Tokyo Bay in an R34 GT-R to Umihotaru PA — the floating car meet island on the Aqua-Line. ¥5,000." />
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "TouristTrip",
              "name": "R34 Umihotaru PA Tour — Tokyo Bay Custom Car Meet",
              "description": "Cruise in a Nissan Skyline R34 GT-R across Tokyo Bay to Umihotaru PA — the floating island custom car meet on the Aqua-Line expressway.",
              "url": "https://www.daikokuhunter.com/tours/umihotaru-pa",
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
                "url": "https://reserve.daikokuhunter.com/tours/umihotaru-pa"
              },
              "touristType": ["Car enthusiasts", "JDM fans", "International tourists"],
              "subjectOf": {
                "@type": "Place",
                "name": "Umihotaru PA (Kisarazu Artificial Island)",
                "geo": {
                  "@type": "GeoCoordinates",
                  "latitude": "35.4636",
                  "longitude": "139.8732"
                },
                "sameAs": "https://ja.wikipedia.org/wiki/%E6%B5%B7%E3%81%BB%E3%81%9F%E3%82%8B%E3%83%91%E3%83%BC%E3%82%AD%E3%83%B3%E3%82%B0%E3%82%A8%E3%83%AA%E3%82%A2"
              }
            }
          `}
        </script>
      </Helmet>
      <div className="tour-page-container">
        <div className="tour-hero" style={{ backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.5), #0a0a0c), url(${umihotaruImg})` }}>
          <div className="tour-hero-content">
            <h1>Midnight Tour</h1>
            <p>Cruise Tokyo Bay in an R34 GT-R.</p>
          </div>
        </div>

        <section className="tour-details-section">
          <h2>Friday & Saturday Nights Only</h2>
          <p>
            Cruise Tokyo Bay in an R34 GT-R to Umihotaru PA — the floating car meet island on the Aqua-Line. 
            Enjoy the spectacular night view of Tokyo from the middle of the bay, surrounded by custom JDM rides.
          </p>
          <p>
            This exclusive weekend route takes you across the Rainbow Bridge and through the undersea tunnel 
            to one of Japan's most unique parking areas.
          </p>
          <div className="tour-price-badge">From ¥5,000 Deposit</div>
        </section>

        <div className="booking-engine-wrapper" id="booking-section">
          {/* Passing Umihotaru explicitly to the booking engine */}
          <Home tourType="Umihotaru Tour" isDedicatedPage={true} />
        </div>
      </div>
    </>
  );
};

export default TourUmihotaru;
