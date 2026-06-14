import React from 'react';
import { getCutoffHour } from '../utils/cutoffs';

const PlanSelector = ({ selectedPlan, onSelect, selectedDate, dateSlots = {}, options, onChangeOptions, globalSettings }) => {

    // Availability Flags from existing database structure
    const daikokuSlots = dateSlots.slots;
    const umihotaruSlots = dateSlots.umihotaru;
    const isStandardFull = daikokuSlots !== undefined && daikokuSlots <= 0;
    const isMidnightFull = umihotaruSlots !== undefined && umihotaruSlots <= 0;

    const now = new Date();
    const isToday = selectedDate && selectedDate.getDate() === now.getDate() && selectedDate.getMonth() === now.getMonth() && selectedDate.getFullYear() === now.getFullYear();
    
    // Determine early cutoffs for display
    const cutoff830 = getCutoffHour('Midnight Plan', selectedDate || new Date(), globalSettings, false, '8:30 PM');
    const cutoff1130 = getCutoffHour('Midnight Plan', selectedDate || new Date(), globalSettings, false, '11:30 PM');
    
    const isPast1700 = isToday && now.getHours() >= cutoff830; // Kept name for backwards compatibility
    const is1130Closed = isToday && now.getHours() >= cutoff1130;

    // Day Logic
    let isSun = false;
    let isFriSatSun = false;
    let isFriSat = false;

    if (selectedDate) {
        const day = selectedDate.getDay(); // 0=Sun
        isSun = day === 0;
        isFriSatSun = day === 0 || day === 5 || day === 6;
        isFriSat = day === 5 || day === 6;
    }

    // Determine Times
    const standardTime = "Mon-Thu 7:30 PM / Fri-Sun 4:30 PM";
    const midnightTime = "Start 8:30 PM";
    const sundayTime = "Start 11:00 AM";

    let isStandardAvailable = !isStandardFull;
    let isMidnightAvailable = isFriSatSun && !isMidnightFull; // Midnight is Fri-Sun
    let isSundayAvailable = isSun && !isStandardFull; // Tied to standard slots for now

    // Always display the times on the buttons
    const displayStandardTime = standardTime;
    const displayMidnightTime = midnightTime;
    const displaySundayTime = sundayTime;

    return (
        <div style={{ padding: '0', marginBottom: '2rem', width: '100%', maxWidth: '600px', margin: '0 auto 2rem auto' }}>
            <h3 style={{
                borderLeft: '4px solid #E60012',
                paddingLeft: '10px',
                marginBottom: '1rem',
                color: 'white'
            }}>
                Select Plan
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                
                {/* Standard Plan Option */}
                <div
                    onClick={() => onSelect('Standard Plan')}
                    style={{
                        background: selectedPlan === 'Standard Plan' ? '#E60012' : '#333',
                        color: 'white',
                        padding: '1rem',
                        borderRadius: '12px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        border: selectedPlan === 'Standard Plan' ? '2px solid #E60012' : '2px solid transparent',
                        opacity: 1,
                        transition: 'all 0.2s',
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: selectedPlan === 'Standard Plan' ? '0 0 15px rgba(255, 255, 255, 0.4)' : 'none'
                    }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: '0.2rem', paddingRight: '25px' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                            Daikoku Tour
                            <div style={{ fontSize: '0.9rem', fontWeight: 'normal', opacity: 0.9, marginTop: '2px' }}>(Standard)</div>
                        </span>
                        <span style={{
                            fontSize: '0.95rem',
                            fontWeight: 'bold',
                            color: isStandardFull ? '#ff9999' : (selectedPlan === 'Standard Plan' ? 'white' : '#ccc'),
                            marginTop: '2px',
                            whiteSpace: 'pre-line'
                        }}>
                            Mon-Thu 7:30 PM{'\n'}Fri-Sun 4:30 PM
                        </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '2px', lineHeight: '1.4' }}>
                        Our classic 3.5-4h tour to Daikoku PA.
                    </div>
                    {selectedPlan === 'Standard Plan' && (
                        <div style={{
                            position: 'absolute', top: '10px', right: '10px', background: 'white',
                            color: '#E60012', borderRadius: '50%', width: '20px', height: '20px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '12px', fontWeight: 'bold'
                        }}>✓</div>
                    )}
                </div>

                {/* Midnight Plan Option */}
                <div
                    onClick={() => onSelect('Midnight Plan')}
                        style={{
                            background: selectedPlan === 'Midnight Plan' ? '#9c27b0' : '#4a2c5a',
                            color: 'white',
                            padding: '1rem',
                            borderRadius: '12px',
                            textAlign: 'left',
                            cursor: 'pointer',
                            border: selectedPlan === 'Midnight Plan' ? '2px solid #ce93d8' : '2px solid transparent',
                            opacity: 1,
                            transition: 'all 0.2s',
                            position: 'relative',
                            overflow: 'hidden',
                            boxShadow: selectedPlan === 'Midnight Plan' ? '0 0 15px rgba(156, 39, 176, 0.5)' : 'none'
                        }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: '0.2rem', paddingRight: '25px' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#fff' }}>
                                Midnight Tour
                                <div style={{ fontSize: '0.9rem', fontWeight: 'normal', opacity: 0.9, marginTop: '2px' }}>(Fri-Sun only)</div>
                            </span>
                            <span style={{
                                fontSize: '0.95rem',
                                fontWeight: 'bold',
                                color: '#fff',
                                marginTop: '2px'
                            }}>
                                {displayMidnightTime}
                            </span>
                        </div>
                        <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '2px', lineHeight: '1.4', paddingRight: '15px' }}>
                            A 3h tour. Enjoy Tokyo's empty highways at midnight.
                        </div>
                        {selectedPlan === 'Midnight Plan' && (
                            <div style={{
                                position: 'absolute', top: '10px', right: '10px', background: 'white',
                                color: '#9c27b0', borderRadius: '50%', width: '20px', height: '20px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '12px', fontWeight: 'bold'
                            }}>✓</div>
                        )}
                    </div>


                {/* City Tour Option */}
                <div
                    onClick={() => onSelect('City Tour')}
                    style={{
                        background: selectedPlan === 'City Tour' ? '#009688' : '#1e3331',
                        color: 'white',
                        padding: '1rem',
                        borderRadius: '12px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        border: selectedPlan === 'City Tour' ? '2px solid #80cbc4' : '2px solid transparent',
                        opacity: 1,
                        transition: 'all 0.2s',
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: selectedPlan === 'City Tour' ? '0 0 15px rgba(0, 150, 136, 0.4)' : 'none'
                    }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: '0.2rem', paddingRight: '25px' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#fff' }}>
                            City Tour
                            <div style={{ fontSize: '0.9rem', fontWeight: 'normal', opacity: 0.9, marginTop: '2px' }}>(Sun-Thu only)</div>
                        </span>
                        <span style={{
                            fontSize: '0.95rem',
                            fontWeight: 'bold',
                            color: '#fff',
                            marginTop: '2px'
                        }}>
                            Start 11:00 PM
                        </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: '4px', lineHeight: '1.4' }}>
                        1-1.5 hour Tokyo street cruise.
                    </div>
                    {selectedPlan === 'City Tour' && (
                        <div style={{
                            position: 'absolute', top: '10px', right: '10px', background: 'white',
                            color: '#009688', borderRadius: '50%', width: '20px', height: '20px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '12px', fontWeight: 'bold'
                        }}>✓</div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default PlanSelector;
