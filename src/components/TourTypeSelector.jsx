import React from 'react';

const TourTypeSelector = ({ selectedTour, onSelect, selectedDate }) => {

    // Helper to determine times
    let daikokuTime = "Start 8:00 PM";
    let umihotaruTime = "Start 8:30 PM";
    let isUmihotaruAvailable = true;

    if (selectedDate) {
        const day = selectedDate.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
        const isFriSatSun = day === 0 || day === 5 || day === 6;
        const isFriSat = day === 5 || day === 6;

        // Daikoku: Fri-Sun 17:00, Weekday 20:00
        if (isFriSatSun) {
            daikokuTime = "Start 5:00 PM";
        } else {
            daikokuTime = "Start 8:00 PM";
        }

        // Umihotaru: Fri-Sat Only
        if (!isFriSat) {
            isUmihotaruAvailable = false;
        }
    } else {
        // Default text when no date selected
        daikokuTime = "Weekdays 8:00 PM / Fri-Sun 5:00 PM";
        umihotaruTime = "Fri & Sat Only 8:30 PM";
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

            {/* Daikoku Option */}
            <div
                onClick={() => onSelect('Daikoku Tour')}
                style={{
                    background: selectedTour === 'Daikoku Tour' ? '#E60012' : '#333',
                    color: 'white',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    border: selectedTour === 'Daikoku Tour' ? '2px solid #E60012' : '2px solid transparent',
                    transition: 'all 0.2s',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>DAIKOKU TOUR</span>
                    <span style={{ fontSize: '1.0rem', fontWeight: 'bold', color: selectedTour === 'Daikoku Tour' ? 'white' : '#ccc' }}>
                        {daikokuTime}
                    </span>
                </div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '4px' }}>Standard Plan</div>
                {selectedTour === 'Daikoku Tour' && (
                    <div style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'white',
                        color: '#E60012',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: 'bold'
                    }}>✓</div>
                )}
            </div>

            {/* Umihotaru Option */}
            <div
                onClick={() => isUmihotaruAvailable && onSelect('Umihotaru Tour')}
                style={{
                    background: selectedTour === 'Umihotaru Tour' ? '#E60012' : '#333',
                    color: 'white',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    textAlign: 'center',
                    cursor: isUmihotaruAvailable ? 'pointer' : 'not-allowed',
                    border: selectedTour === 'Umihotaru Tour' ? '2px solid #E60012' : '2px solid transparent',
                    opacity: isUmihotaruAvailable ? 1 : 0.4,
                    transition: 'all 0.2s',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>UMIHOTARU TOUR</span>
                    <span style={{ fontSize: '1.0rem', fontWeight: 'bold', color: selectedTour === 'Umihotaru Tour' ? 'white' : '#ccc' }}>
                        {isUmihotaruAvailable ? umihotaruTime : "Not Available"}
                    </span>
                </div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '4px' }}>Midnight Plan</div>
                {selectedTour === 'Umihotaru Tour' && (
                    <div style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'white',
                        color: '#E60012',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: 'bold'
                    }}>✓</div>
                )}
            </div>
        </div>


    );
};

export default TourTypeSelector;
