import React from 'react';

const TourTypeSelector = ({ selectedTour, onSelect }) => {
    return (
        <div style={{ padding: '0 1rem', marginBottom: '2rem' }}>
            <h3 style={{
                borderLeft: '4px solid #E60012',
                paddingLeft: '10px',
                marginBottom: '1rem',
                color: 'white'
            }}>
                Select Tour Type
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Daikoku Option */}
                <div
                    onClick={() => onSelect('Daikoku Tour')}
                    style={{
                        background: selectedTour === 'Daikoku Tour' ? '#E60012' : '#333',
                        color: 'white',
                        padding: '1.5rem 1rem',
                        borderRadius: '12px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        border: selectedTour === 'Daikoku Tour' ? '2px solid #E60012' : '2px solid transparent',
                        transition: 'all 0.2s',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.3rem' }}>DAIKOKU TOUR</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Standard Plan</div>
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
                    onClick={() => onSelect('Umihotaru Tour')}
                    style={{
                        background: selectedTour === 'Umihotaru Tour' ? '#E60012' : '#333',
                        color: 'white',
                        padding: '1.5rem 1rem',
                        borderRadius: '12px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        border: selectedTour === 'Umihotaru Tour' ? '2px solid #E60012' : '2px solid transparent',
                        transition: 'all 0.2s',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.3rem' }}>UMIHOTARU TOUR</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Sea Crossing Plan</div>
                    {selectedTour === 'Umihotaru Tour' && (
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
            </div>
            <p style={{ fontSize: '0.8rem', color: '#999', marginTop: '0.5rem' }}>
                *Both tours include GTR drive experience.
            </p>
        </div>
    );
};

export default TourTypeSelector;
