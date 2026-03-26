import React from 'react';
import { Helmet } from 'react-helmet-async';
import './About.css';
import crewImg from '../assets/home/crew1.webp';

const About = () => {
  return (
    <div className="about-page-container">
      <Helmet>
        <title>About The Crew | DAIKOKU HUNTERS</title>
        <meta name="description" content="Meet the DAIKOKU HUNTERS crew. We are Tokyo locals who have been deeply involved in the underground JDM car scene for years, passionate about sharing this unique culture." />
      </Helmet>

      <section className="about-section">
        <h1>About the Crew</h1>
        <p className="about-intro">
          We are genuine Tokyo locals who have been breathing the exhaust fumes of the underground JDM car scene for years. 
          DAIKOKU HUNTERS was born from a simple desire: to safely share the authentic, unfiltered Tokyo car culture experience with international enthusiasts.
        </p>

        <div className="crew-grid">
           <div className="crew-card">
              <div className="crew-image-placeholder" style={{ backgroundImage: `url(${crewImg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
              <h3>Team Daikoku Hunters</h3>
              <p>On weekends, we cruise with over 10 R34s! Weekdays usually have at least 5 cars.</p>
           </div>
        </div>
      </section>
    </div>
  );
};

export default About;
