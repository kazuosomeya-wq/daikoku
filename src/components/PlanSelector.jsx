import React from 'react';

const PlanSelector = ({ selectedPlan, onSelect, selectedDate, dateSlots = {}, options, onChangeOptions, globalSettings }) => {

    // Availability Flags from existing database structure
    const daikokuSlots = dateSlots.slots;
    const umihotaruSlots = dateSlots.umihotaru;
    const isStandardFull = daikokuSlots !== undefined && daikokuSlots <= 0;
    const isMidnightFull = umihotaruSlots !== undefined && umihotaruSlots <= 0;

    const now = new Date();
    const isToday = selectedDate && selectedDate.getDate() === now.getDate() && selectedDate.getMonth() === now.getMonth() && selectedDate.getFullYear() === now.getFullYear();
    const isPast1900 = isToday && now.getHours() >= 19;

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
    const midnightTime = "Start 8:30 PM / 11:30 PM";
    const sundayTime = "Start 11:00 AM";

    let isStandardAvailable = !isStandardFull;
    let isMidnightAvailable = isFriSatSun && !isMidnightFull; // Midnight is Fri/Sat/Sun
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
                        <div style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: '4px', lineHeight: '1.4' }}>
                            {selectedPlan === 'Midnight Plan' && options && (
                                <div style={{ 
                                    marginTop: '12px', 
                                    padding: '10px', 
                                    background: 'rgba(255, 255, 255, 0.05)', 
                                    borderRadius: '8px' 
                                }}>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '8px', color: '#fff' }}>Select Time:</div>
                                    <div style={{ display: 'flex', gap: '15px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: isPast1900 ? 'not-allowed' : 'pointer', color: isPast1900 ? '#666' : '#eee', opacity: isPast1900 ? 0.5 : 1 }}>
                                            <input 
                                                type="radio" 
                                                name="midnightTimeSlot" 
                                                value="8:30 PM" 
                                                checked={!options.midnightTimeSlot || options.midnightTimeSlot === '8:30 PM'}
                                                disabled={isPast1900}
                                                onChange={() => {
                                                    if (isPast1900) return;
                                                    onChangeOptions({ ...options, midnightTimeSlot: '8:30 PM' })
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            <span style={{ fontWeight: (!options.midnightTimeSlot || options.midnightTimeSlot === '8:30 PM') ? 'bold' : 'normal' }}>
                                                8:30 PM {isPast1900 && '(Closed)'}
                                            </span>
                                        </label>
                                        {globalSettings?.is1130Enabled !== false && !isSun && (
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#eee' }}>
                                                <input 
                                                    type="radio" 
                                                    name="midnightTimeSlot" 
                                                    value="11:30 PM" 
                                                    checked={options.midnightTimeSlot === '11:30 PM'}
                                                    onChange={() => {
                                                        onChangeOptions({ 
                                                            ...options, 
                                                            midnightTimeSlot: '11:30 PM',
                                                            selectedVehicle: 'none',   // Force Random R34
                                                            selectedVehicle2: 'none'
                                                        });
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                <span style={{ fontWeight: options.midnightTimeSlot === '11:30 PM' ? 'bold' : 'normal' }}>11:30 PM</span>
                                            </label>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#ccc', marginTop: '6px', fontStyle: 'italic' }}>
                                        * 8:30 PM recommended — the convoy runs with more cars on the road.
                                    </div>
                                    {options.midnightTimeSlot === '11:30 PM' && (
                                        <div style={{ fontSize: '0.75rem', color: '#ff9999', marginTop: '4px', fontStyle: 'italic' }}>
                                            * Note: Tokyo Tower will be skipped for the 11:30 PM plan.
                                        </div>
                                    )}
                                </div>
                            )}
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

                {/* Sunday Morning Plan Option */}
                <div
                    onClick={() => onSelect('Sunday Morning Plan')}
                    style={{
                        background: selectedPlan === 'Sunday Morning Plan' ? '#e65100' : '#3d2613',
                        color: 'white',
                        padding: '1rem',
                        borderRadius: '12px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        border: selectedPlan === 'Sunday Morning Plan' ? '2px solid #ff9900' : '2px solid transparent',
                        opacity: 1,
                        transition: 'all 0.2s',
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: selectedPlan === 'Sunday Morning Plan' ? '0 0 15px rgba(230, 81, 0, 0.4)' : 'none'
                    }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: '0.2rem', paddingRight: '25px' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#fff' }}>
                            Morning Daikoku Tour
                            <div style={{ fontSize: '0.9rem', fontWeight: 'normal', opacity: 0.9, marginTop: '2px' }}>(Sunday only)</div>
                        </span>
                        <span style={{
                            fontSize: '0.95rem',
                            fontWeight: 'bold',
                            color: '#fff',
                            marginTop: '2px'
                        }}>
                            {displaySundayTime}
                        </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: '4px', lineHeight: '1.4' }}>
                        A refreshing morning drive where many supercars and classic cars gather.
                    </div>
                    {selectedPlan === 'Sunday Morning Plan' && (
                        <div style={{
                            position: 'absolute', top: '10px', right: '10px', background: 'white',
                            color: '#e65100', borderRadius: '50%', width: '20px', height: '20px',
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
