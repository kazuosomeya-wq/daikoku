import React from 'react';

const TourTypeSelector = ({ selectedTour, onSelect, selectedDate, dateSlots = {} }) => {

    // Helper to determine times
    let daikokuTime = "Start 8:00 PM";
    let umihotaruTime = "Start 8:30 PM";

    // Availability Flags
    const daikokuSlots = dateSlots.slots;
    const umihotaruSlots = dateSlots.umihotaru;
    const isDaikokuFull = daikokuSlots !== undefined && daikokuSlots <= 0;
    const isUmihotaruFull = umihotaruSlots !== undefined && umihotaruSlots <= 0;

    // Day Logic
    let isFriSatSun = false;
    let isFriSat = false;

    if (selectedDate) {
        const day = selectedDate.getDay(); // 0=Sun
        isFriSatSun = day === 0 || day === 5 || day === 6;
        isFriSat = day === 5 || day === 6;

        // Daikoku Time
        daikokuTime = isFriSatSun ? "Start 5:00 PM" : "Start 8:00 PM";
    }

    // Determine Availability & Text
    let isDaikokuAvailable = !isDaikokuFull;
    let isUmihotaruAvailable = isFriSat && !isUmihotaruFull;

    // Text overrides if full
    if (isDaikokuFull) {
        daikokuTime = "SOLD OUT";
    }

    if (isUmihotaruFull && isFriSat) {
        umihotaruTime = "SOLD OUT";
    } else if (!isFriSat && selectedDate) {
        umihotaruTime = "Not Available";
    }

    return (
        <div style={{ padding: '0', marginBottom: '2rem', width: '100%', maxWidth: '600px', margin: '0 auto 2rem auto' }}>
            <h3 style={{
                borderLeft: '4px solid #E60012',
                paddingLeft: '10px',
                marginBottom: '1rem',
                color: 'white'
            }}>
                Select Tour Type
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                {/* Daikoku Option */}
                <div
                    onClick={() => isDaikokuAvailable && onSelect('Daikoku Tour')}
                    style={{
                        background: selectedTour === 'Daikoku Tour' ? '#E60012' : '#333',
                        color: 'white',
                        padding: '0.8rem',
                        borderRadius: '12px',
                        textAlign: 'center',
                        cursor: isDaikokuAvailable ? 'pointer' : 'not-allowed',
                        border: selectedTour === 'Daikoku Tour' ? '2px solid #E60012' : '2px solid transparent',
                        opacity: isDaikokuAvailable ? 1 : 0.4,
                        transition: 'all 0.2s',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>DAIKOKU TOUR</span>
                        <span style={{
                            fontSize: '1.0rem',
                            fontWeight: 'bold',
                            color: isDaikokuFull ? '#ff9999' : (selectedTour === 'Daikoku Tour' ? 'white' : '#ccc')
                        }}>
                            {daikokuTime}
                        </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '2px' }}>Standard Plan</div>
                    {selectedTour === 'Daikoku Tour' && (
                        <div style={{
                            position: 'absolute',
                            top: '5px',
                            right: '5px',
                            background: 'white',
                            color: '#E60012',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 'bold'
                        }}>✓</div>
                    )}
                </div>

                {/* Umihotaru Option */}
                <div
                    onClick={() => isUmihotaruAvailable && onSelect('Umihotaru Tour')}
                    style={{
                        background: selectedTour === 'Umihotaru Tour' ? '#0066cc' : '#333',
                        color: 'white',
                        padding: '0.8rem',
                        borderRadius: '12px',
                        textAlign: 'center',
                        cursor: isUmihotaruAvailable ? 'pointer' : 'not-allowed',
                        border: selectedTour === 'Umihotaru Tour' ? '2px solid #0066cc' : '2px solid transparent',
                        opacity: isUmihotaruAvailable ? 1 : 0.4,
                        transition: 'all 0.2s',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>UMIHOTARU TOUR</span>
                        <span style={{
                            fontSize: '1.0rem',
                            fontWeight: 'bold',
                            color: isUmihotaruFull ? '#ff9999' : (selectedTour === 'Umihotaru Tour' ? 'white' : '#ccc')
                        }}>
                            {umihotaruTime}
                        </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '4px' }}>Midnight Plan</div>
                    {selectedTour === 'Umihotaru Tour' && (
                        <div style={{
                            position: 'absolute',
                            top: '5px',
                            right: '5px',
                            background: 'white',
                            color: '#0066cc',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 'bold'
                        }}>✓</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TourTypeSelector;
