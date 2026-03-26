import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/header_logo.webp';
import './SeoGuideDaikoku.css'; // Reusing the same CSS for identical layout

const SeoGuideUmihotaru = () => {

    useEffect(() => {
        // Update document title and meta description dynamically for this specific route
        document.title = "Umihotaru PA: The Floating Car Meet on Tokyo Bay | DAIKOKU HUNTER";
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute('content', 'Discover Umihotaru PA, the spectacular floating parking area on the Tokyo Bay Aqua-Line. Learn about its 360-degree views, car meets, and how to access it.');
        } else {
            const meta = document.createElement('meta');
            meta.name = 'description';
            meta.content = 'Discover Umihotaru PA, the spectacular floating parking area on the Tokyo Bay Aqua-Line. Learn about its 360-degree views, car meets, and how to access it.';
            document.head.appendChild(meta);
        }

        // Scroll to top on mount
        window.scrollTo(0, 0);

        return () => {
            document.title = "DAIKOKU HUNTER | #1 Supercar & GTR Tour in Tokyo";
        };
    }, []);

    // Image style
    const imgStyle = {
        width: '100%',
        height: 'auto',
        borderRadius: '8px',
        marginBottom: '2rem',
        marginTop: '1rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        objectFit: 'cover'
    };

    return (
        <div className="seo-guide-container">
            <nav className="dh-custom-header">
                <a href="https://www.daikokuhunter.com/" className="dh-header-logo">
                    <img src={logo} alt="DAIKOKU HUNTER" className="dh-header-logo-img" />
                </a>
                <div className="dh-header-nav">
                    <a href="https://www.daikokuhunter.com/products/daikoku-pa-tour" className="dh-nav-link">DAIKOKU TOUR</a>
                    <a href="https://www.daikokuhunter.com/products/r34-umihotaru-pa-tour-tokyo" className="dh-nav-link">MIDNIGHT TOUR</a>
                </div>
                <a href="https://reserve.daikokuhunter.com" className="dh-header-book-btn">BOOK NOW</a>
            </nav>

            <header className="guide-header">
                <h1>Umihotaru PA: The 360-Degree Floating Car Meet on Tokyo Bay</h1>
                <p className="guide-subtitle">An engineering marvel and secret gathering spot for Japanese auto enthusiasts.</p>
                <div style={{ display: 'flex', gap: '1rem', width: '100%', alignItems: 'center' }}>
                    <div style={{ flex: '45' }}>
                        <img src="/images/seo/umihotaru_header_rx7.jpg" alt="Modified Mazda RX-7 and Nissan Skyline at Umihotaru PA" style={{...imgStyle, marginBottom: 0, marginTop: 0}} loading="lazy" />
                    </div>
                    <div style={{ flex: '55', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <img src="/images/seo/umihotaru_header_supra.jpg" alt="White Toyota Supra arriving at Umihotaru PA" style={{...imgStyle, marginBottom: 0, marginTop: 0}} loading="lazy" />
                        <img src="/images/seo/umihotaru_header_tunnel.jpg" alt="Nissan Skyline R34 GT-R driving through the Aqua-Line tunnel" style={{...imgStyle, marginBottom: 0, marginTop: 0}} loading="lazy" />
                    </div>
                </div>
            </header>

            <div className="table-of-contents">
                <h3>Table of Contents</h3>
                <ul>
                    <li><a href="#engineering-marvel">1. The Architectural Marvel of the Aqua-Line</a></li>
                    <li><a href="#dark-history">2. The Dark History: The 300km/h Club</a></li>
                    <li><a href="#car-culture-umihotaru">3. Car Culture at Umihotaru PA</a></li>
                    <li><a href="#views-and-food">4. 360-Degree Views and Local Cuisines</a></li>
                    <li><a href="#how-to-get-there">5. Access: How Do You Get There?</a></li>
                    <li><a href="#umihotaru-tour">6. The R34 Skyline Midnight Tour</a></li>
                </ul>
            </div>

            <main className="guide-content">
                <section id="engineering-marvel">
                    <h2>The Architectural Marvel of the Tokyo Bay Aqua-Line</h2>
                    <p>
                        While Daikoku PA is famous for its massive spiraling ramps, <strong>Umihotaru Parking Area</strong> is famous for simply existing. It is an artificial island functioning as a rest area, hovering directly in the middle of Tokyo Bay. It forms the transition point of the Tokyo Bay Aqua-Line—a massive 14km toll highway that connects Kawasaki (Kanagawa Prefecture) to Kisarazu (Chiba Prefecture). Half of this highway is an underwater tunnel (the longest underwater tunnel in the world for cars), and the other half is a bridge spanning the bay.
                    </p>
                    <p>
                        Designed like a luxury cruise ship permanently docked in the ocean, Umihotaru boasts five stories of parking, observation decks, restaurants, and shops. The lower three levels contain parking for cars and large trucks, while the top two levels serve as commercial facilities with panoramic views of the entire Tokyo skyline, the Boso Peninsula, and Mount Fuji on a clear day.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                        <img src="/images/seo/umihotaru_wide_1.jpg" alt="Wide view of cars parked at Umihotaru PA" style={{...imgStyle, marginBottom: 0, marginTop: 0}} loading="lazy" />
                        <img src="/images/seo/umihotaru_wide_2.jpg" alt="Overhead view of Umihotaru PA parking lot at night" style={{...imgStyle, marginBottom: 0, marginTop: 0}} loading="lazy" />
                    </div>
                </section>

                <section id="dark-history">
                    <h2>The Dark History of the Aqua-Line: The 300km/h Club</h2>
                    <p>
                        When the Tokyo Bay Aqua-Line officially opened in 1997, it accidentally created the most dangerous underground racetrack in the world. The tunnel section spans nearly 10 kilometers of perfectly straight, heavily illuminated, and wind-shielded tarmac. For Japan's extreme top-speed runners, it was an irresistible proving ground.
                    </p>
                    <p>
                        Almost immediately after its completion, the tunnel became legendary for the "300km/h Club" (Sanbyaku Kiro Club). Tuning legends like Kazuhiko "Smoky" Nagata of Top Secret performed some of their earliest high-speed shakedowns here. Roaring through the reverberating concrete tube in violently modified Toyota Supras and Nissan GT-Rs, the ultimate goal was simple but terrifying: break the 300km/h (186 mph) barrier before emerging onto the Umihotaru floating island.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                        <img src="/images/seo/smoky_nagata.png" alt="Smoky Nagata performing a high-speed burnout in his Top Secret Supra" style={{ ...imgStyle, maxWidth: '50%', marginBottom: 0 }} loading="lazy" />
                    </div>
                    <div style={{ padding: '1.5rem', background: 'rgba(30, 30, 30, 0.05)', borderLeft: '4px solid #333', margin: '2rem 0', borderRadius: '4px' }}>
                        <h3 style={{ marginTop: 0, color: '#333' }}>Tragedy and The End of the Top Speed Era</h3>
                        <p style={{ marginBottom: 0 }}>
                            The relentless pursuit of maximum velocity came at a devastating cost. At over 300km/h, the narrow confines of the tunnel offer absolutely zero margin for error. A blown tire or a slight miscalculation often resulted in catastrophic, fatal accidents. Following a series of highly publicized tragedies involving legendary high-speed tuners, the police cracked down severely, installing speed cameras and strict patrols. Today, while Umihotaru remains a vibrant gathering point for the culture, the suicidal top-speed era of the Aqua-Line tunnel has passed into dark automotive folklore.
                        </p>
                    </div>
                </section>

                <section id="car-culture-umihotaru">
                    <h2>Car Culture at Umihotaru PA</h2>
                    <p>
                        Although Daikoku PA is the undisputed king of Japanese street car culture, Umihotaru serves a more exclusive, serene purpose within the community. Because the toll to cross the Aqua-Line is relatively high compared to standard city highways, Umihotaru tends to attract a different kind of gathering.
                    </p>
                    <p>
                        It is incredibly popular for <strong>Porsche clubs, Ferrari owners, and high-end Euro tuners</strong> taking morning drives. However, late on Friday and Saturday nights—especially when Daikoku is closed down early by police ("Daikoku Heisa")—the JDM crowd often relocates here. You will frequently find incredibly clean R34 GT-Rs, tuned Toyota Supras, and beautifully preserved classic Japanese sports cars lined up against the backdrop of the dark ocean.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                        <img src="/images/seo/umihotaru_parked_1.jpg" alt="JDM cars parked at Umihotaru PA" style={{...imgStyle, marginBottom: 0, marginTop: 0}} loading="lazy" />
                        <img src="/images/seo/umihotaru_parked_2.jpg" alt="Sports cars gathering at night in Tokyo Bay" style={{...imgStyle, marginBottom: 0, marginTop: 0}} loading="lazy" />
                        <img src="/images/seo/umihotaru_parked_3.jpg" alt="Custom JDM cars at Umihotaru" style={{...imgStyle, marginBottom: 0, marginTop: 0}} loading="lazy" />
                        <img src="/images/seo/umihotaru_parked_4.jpg" alt="Paul Walker style R34 GT-R parked at Umihotaru" style={{...imgStyle, marginBottom: 0, marginTop: 0}} loading="lazy" />
                    </div>
                </section>

                <section id="views-and-food">
                    <h2>360-Degree Views and Attractions</h2>
                    <p>
                        Even if you take the cars away, Umihotaru is a premier tourist destination. The 5th-floor observation deck offers 360-degree unobstructed views of the water. At night, watching airplanes descend into Haneda Airport while ships drift through Tokyo Bay is a mesmerizing experience.
                    </p>
                    <p>
                        Inside, you can find a variety of specialty foods. From Kisarazu clam ramen (Asari Ramen) to freshly baked melon pan from the popular bakery on the 4th floor, it is a fantastic place to grab a late-night meal or early morning breakfast while admiring the automotive machinery parked downstairs.
                    </p>
                </section>

                <section id="how-to-get-there">
                    <h2>Access: How Do You Get There?</h2>
                    <p>
                        Similar to Daikoku, <strong>there is absolutely no train access to Umihotaru PA.</strong> It is literally in the middle of the ocean.
                    </p>
                    <p>
                        While there is a highway bus service from Kawasaki Station and Kisarazu Station that stops at Umihotaru, it only operates during standard daytime hours and is practically useless for anyone wanting to experience the night-time car culture or a late-night cruise. To truly experience the Aqua-Line tunnel run and the gathering of cars at Umihotaru, you need a vehicle.
                    </p>
                    <div style={{ padding: '1.5rem', background: 'rgba(230, 0, 18, 0.1)', borderLeft: '4px solid #E60012', margin: '2rem 0', borderRadius: '4px' }}>
                        <h3 style={{ marginTop: 0, color: '#E60012' }}>The Challenge of the Aqua-Line</h3>
                        <p style={{ marginBottom: 0 }}>
                            Driving the Aqua-Line requires navigating massive, highly trafficked underground tunnels originating from central Tokyo or Kawasaki. For tourists without specific knowledge of the highway gates, securing a rental car and finding the entrance can be incredibly stressful, especially at night.
                        </p>
                    </div>
                </section>

                <section id="umihotaru-tour" className="booking-cta-section">
                    <h2>The R34 Skyline Midnight Tour</h2>
                    <p>
                        Riding shotgun through the world's longest underwater tunnel in an iconic Nissan Skyline R34 GT-R, surrounded by the roaring exhaust of the RB26 engine, is a Bucket List experience that perfectly merges engineering with automotive passion.
                    </p>
                    <p>
                        With <strong>DAIKOKU HUNTER</strong>, you aren't just getting a taxi ride to a parking lot. Our specialized Tokyo Bay Tour takes you blasting through the subterranean Aqua-Line tunnel in legendary JDM vehicles, emerging out onto the floating island of Umihotaru. We handle the navigation, the tolls, and parking alongside the best cars Tokyo has to offer.
                    </p>

                    <img src="/images/seo/umihotaru_tunnel_r34.jpg" alt="R34 GT-R driving through the Aqua-Line tunnel" style={imgStyle} loading="lazy" />

                    <div className="cta-action-box">
                        <h3>Book the Ultimate Tokyo Bay Run</h3>
                        <p>Experience the Aqua-Line tunnel and Umihotaru PA in a legendary JDM icon. Spots are limited.</p>
                        <Link
                            to="/"
                            className="guide-cta-btn"
                            onClick={() => window.scrollTo(0, 0)}
                        >
                            Book Your Midnight Tour Now
                        </Link>
                    </div>
                </section>

            </main>
        </div>
    );
};

export default SeoGuideUmihotaru;
