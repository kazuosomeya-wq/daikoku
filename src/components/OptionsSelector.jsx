import React from 'react';
import './OptionsSelector.css';
import vehicle1 from '../assets/vehicle1.webp';
import vehicle2 from '../assets/vehicle2.webp';
import vehicle3 from '../assets/vehicle3.webp';
import vehicle4 from '../assets/vehicle4.webp';
import randomR34 from '../assets/random_r34.webp';

const OptionsSelector = ({ options, onChange, disabledVehicles = [], vehicles = [], personCount = 2, carCount = 1, isLoading = false, tourType, isLateSameDayBooking = false }) => {
    const handleToggle = (key) => {
        onChange({
            ...options,
            [key]: !options[key]
        });
    };

    const handleTextChange = (key, value) => {
        onChange({
            ...options,
            [key]: value
        });
    };

    // Construct vehicle data from props or fallback if needed (though props should be source of truth now)
    const vehicleData = vehicles.map(v => ({
        id: v.id,
        name: v.name,
        rawPrice: Number(v.price),
        price: `+¥${Number(v.price).toLocaleString()}`,
        image: v.imageUrl,
        subtitle: v.subtitle
    }));

    const availableVehicles = vehicleData.filter(v => !disabledVehicles.includes(v.id));
    const unavailableVehicles = vehicleData.filter(v => disabledVehicles.includes(v.id));
    const sortedVehicles = tourType === 'Sunday Morning Plan' ? [] : [...availableVehicles, ...unavailableVehicles];

    const randomSlotId = isLateSameDayBooking ? 'random-cars' : 'none';
    const randomSlotTitle = tourType === 'Umihotaru Tour' ? 'Random Car' : 'Random R34';
    const randomSlotSubtitle = isLateSameDayBooking ? 'A random car will be assigned on the day' : 'A Skyline R34 will be assigned on the day';

    const getSelectedVehicles = (skipSlot) => {
        const selected = [];
        if (skipSlot !== 1 && options.selectedVehicle !== 'none' && options.selectedVehicle !== 'random-cars') selected.push(options.selectedVehicle);
        if (skipSlot !== 2 && carCount >= 2 && options.selectedVehicle2 !== 'none' && options.selectedVehicle2 !== 'random-cars') selected.push(options.selectedVehicle2);
        if (skipSlot !== 3 && carCount >= 3 && options.selectedVehicle3 !== 'none' && options.selectedVehicle3 !== 'random-cars') selected.push(options.selectedVehicle3);
        if (skipSlot !== 4 && carCount >= 4 && options.selectedVehicle4 !== 'none' && options.selectedVehicle4 !== 'random-cars') selected.push(options.selectedVehicle4);
        if (skipSlot !== 5 && carCount >= 5 && options.selectedVehicle5 !== 'none' && options.selectedVehicle5 !== 'random-cars') selected.push(options.selectedVehicle5);
        return selected;
    };

    return (
        <div className="options-container" style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
            {/* Vehicle Nomination Section */}
            <h3 className="options-section-title">
                {carCount >= 2 ? 'Choose Your Ride (Car 1)' : 'Choose Your Ride'}
            </h3>
            <div className="options-group">
                <div className="options-group-intro" style={{ margin: '0 0 1rem 0', textAlign: 'left' }}>
                    <ul style={{ paddingLeft: '1.2rem', margin: 0, lineHeight: '1.6', fontSize: '0.9rem', color: '#ccc' }}>
                        <li>Request a specific car or get a {isLateSameDayBooking ? 'random car' : 'random R34'}</li>
                        <li>Bookings close 1 day before <span style={{ color: '#E60012' }}>(DM for last-minute)</span></li>
                        <li>Rear seats may be tight for guests over 185cm / 90kg (6'1" / 200 lbs). Extra car recommended.</li>
                    </ul>
                </div>

                <div className="vehicle-grid">

                    {/* No Nomination */}
                    <div
                        onClick={() => !disabledVehicles.includes('random-r34') && handleTextChange('selectedVehicle', randomSlotId)}
                        style={{
                            border: options.selectedVehicle === randomSlotId ? '2px solid #E60012' : '1px solid #444',
                            background: options.selectedVehicle === randomSlotId ? 'rgba(230, 0, 18, 0.1)' : '#222',
                            padding: '0.5rem',
                            borderRadius: '8px',
                            cursor: disabledVehicles.includes('random-r34') ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            transition: 'all 0.2s',
                            position: 'relative',
                            opacity: disabledVehicles.includes('random-r34') ? 0.6 : 1,
                            filter: disabledVehicles.includes('random-r34') ? 'brightness(0.5)' : 'none',
                        }}
                    >
                        <div style={{
                            width: '100%',
                            aspectRatio: '16/9',
                            background: '#333',
                            borderRadius: '4px',
                            marginBottom: '0.5rem',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            color: '#aaa',
                            fontSize: '1.2rem',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            overflow: 'hidden',
                            position: 'relative'
                        }}>
                            <img src={randomR34} alt={randomSlotTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                color: 'white',
                                fontSize: '4rem',
                                fontWeight: 'bold',
                                textShadow: '0 4px 12px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.6)',
                                pointerEvents: 'none',
                                zIndex: 5
                            }}>
                                ?
                            </div>
                            {disabledVehicles.includes('random-r34') && (
                                <div style={{
                                    position: 'absolute',
                                    top: 0, left: 0, right: 0, bottom: 0,
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    fontSize: '1rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    transform: 'rotate(-15deg)',
                                    textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                                    zIndex: 10
                                }}>
                                    Unavailable
                                </div>
                            )}
                        </div>
                        <span style={{ fontWeight: 'bold', color: 'white' }}>{randomSlotTitle}</span>
                        <span style={{ fontSize: '0.8rem', color: '#ccc', marginBottom: '0.2rem', textAlign: 'center' }}>{randomSlotSubtitle}</span>
                        <span style={{ fontSize: '0.8rem', color: '#4ade80', fontWeight: 'bold' }}>¥0</span>
                    </div>

                    {/* Loading State */}
                    {isLoading && (
                        <div style={{
                            gridColumn: '1 / -1',
                            padding: '2rem',
                            textAlign: 'center',
                            color: '#999',
                            background: '#222',
                            borderRadius: '8px'
                        }}>
                            Loading available cars...
                        </div>
                    )}

                    {/* Specific Vehicles */}
                    {sortedVehicles.map(vehicle => {
                        const isUnavailable = disabledVehicles.includes(vehicle.id) || getSelectedVehicles(1).includes(vehicle.id);
                        if (carCount >= 5 && isUnavailable) return null; // Using 5 to handle max bounds
                        if (carCount >= 4 && carCount < 5 && isUnavailable) return null;
                        if (carCount >= 3 && carCount < 4 && isUnavailable) return null;
                        return (
                            <div
                                key={vehicle.id}
                                onClick={() => !isUnavailable && handleTextChange('selectedVehicle', vehicle.id)}
                                style={{
                                    border: options.selectedVehicle === vehicle.id ? '2px solid #E60012' : '1px solid #444',
                                    background: options.selectedVehicle === vehicle.id ? 'rgba(230, 0, 18, 0.1)' : '#222',
                                    padding: '0.5rem',
                                    borderRadius: '8px',
                                    cursor: isUnavailable ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    transition: 'all 0.2s',
                                    opacity: isUnavailable ? 0.6 : 1,
                                    filter: isUnavailable ? 'brightness(0.5)' : 'none',
                                    position: 'relative'
                                }}
                            >
                                <div style={{
                                    width: '100%',
                                    aspectRatio: '16/9',
                                    background: '#333',
                                    borderRadius: '4px',
                                    marginBottom: '0.5rem',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    overflow: 'hidden',
                                    position: 'relative'
                                }}>
                                    <img
                                        src={vehicle.image}
                                        alt={vehicle.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                    {isUnavailable && (
                                        <div style={{
                                            position: 'absolute',
                                            top: 0, left: 0, right: 0, bottom: 0,
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            color: 'white',
                                            fontWeight: 'bold',
                                            fontSize: '1rem',
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px',
                                            transform: 'rotate(-15deg)',
                                            textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                                            zIndex: 10
                                        }}>
                                            Unavailable
                                        </div>
                                    )}
                                </div>
                                <span style={{ fontWeight: 'bold', color: 'white' }}>{vehicle.name}</span>
                                {vehicle.subtitle && (
                                    <span style={{ fontSize: '0.8rem', color: '#ccc', marginBottom: '0.2rem' }}>{vehicle.subtitle}</span>
                                )}
                                <span style={{
                                    fontSize: '0.9rem',
                                    color: vehicle.rawPrice === 0 ? '#4ade80' : '#E60012',
                                    fontWeight: 'bold'
                                }}>
                                    {vehicle.price}
                                </span>
                            </div>
                        );
                    })}

                </div>
            </div>

            {/* Second Vehicle Nomination Section (For Flexible / 4-6 pax) */}
            {carCount >= 2 && (
                <>
                    <h3 className="options-section-title" style={{ marginTop: '2rem' }}>Choose Your Ride (Car 2)</h3>
                    <div className="options-group">
                        <div className="vehicle-grid">
                            {/* No Nomination for Car 2 */}
                            <div
                                onClick={() => !disabledVehicles.includes('random-r34') && handleTextChange('selectedVehicle2', randomSlotId)}
                                style={{
                                    border: options.selectedVehicle2 === randomSlotId ? '2px solid #0066cc' : '1px solid #444',
                                    background: options.selectedVehicle2 === randomSlotId ? 'rgba(0, 102, 204, 0.1)' : '#222',
                                    padding: '0.5rem',
                                    borderRadius: '8px',
                                    cursor: disabledVehicles.includes('random-r34') ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    transition: 'all 0.2s',
                                    position: 'relative',
                                    opacity: disabledVehicles.includes('random-r34') ? 0.6 : 1,
                                    filter: disabledVehicles.includes('random-r34') ? 'brightness(0.5)' : 'none',
                                }}
                            >
                                <div style={{
                                    width: '100%',
                                    aspectRatio: '16/9',
                                    background: '#333',
                                    borderRadius: '4px',
                                    marginBottom: '0.5rem',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    color: '#aaa',
                                    fontSize: '1.2rem',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase',
                                    overflow: 'hidden',
                                    position: 'relative'
                                }}>
                                    <img src={randomR34} alt={randomSlotTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <div style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        color: 'white',
                                        fontSize: '4rem',
                                        fontWeight: 'bold',
                                        textShadow: '0 4px 12px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.6)',
                                        pointerEvents: 'none',
                                        zIndex: 5
                                    }}>
                                        ?
                                    </div>
                                    {disabledVehicles.includes('random-r34') && (
                                        <div style={{
                                            position: 'absolute',
                                            top: 0, left: 0, right: 0, bottom: 0,
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            color: 'white',
                                            fontWeight: 'bold',
                                            fontSize: '1rem',
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px',
                                            transform: 'rotate(-15deg)',
                                            textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                                            zIndex: 10
                                        }}>
                                            Unavailable
                                        </div>
                                    )}
                                </div>
                                <span style={{ fontWeight: 'bold', color: 'white' }}>{randomSlotTitle}</span>
                                <span style={{ fontSize: '0.8rem', color: '#ccc', marginBottom: '0.2rem', textAlign: 'center' }}>Assigned on day</span>
                                <span style={{ fontSize: '0.8rem', color: '#4ade80', fontWeight: 'bold' }}>¥0</span>
                            </div>

                            {/* Specific Vehicles for Car 2 */}
                            {sortedVehicles.map(vehicle => {
                                // Disable if already chosen elsewhere
                                const isUnavailable = disabledVehicles.includes(vehicle.id) || getSelectedVehicles(2).includes(vehicle.id);
                                if (carCount >= 3 && isUnavailable) return null;
                                return (
                                    <div
                                        key={`v2-${vehicle.id}`}
                                        onClick={() => !isUnavailable && handleTextChange('selectedVehicle2', vehicle.id)}
                                        style={{
                                            border: options.selectedVehicle2 === vehicle.id ? '2px solid #0066cc' : '1px solid #444',
                                            background: options.selectedVehicle2 === vehicle.id ? 'rgba(0, 102, 204, 0.1)' : '#222',
                                            padding: '0.5rem',
                                            borderRadius: '8px',
                                            cursor: isUnavailable ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            transition: 'all 0.2s',
                                            opacity: isUnavailable ? 0.6 : 1,
                                            filter: isUnavailable ? 'brightness(0.5)' : 'none',
                                            position: 'relative'
                                        }}
                                    >
                                        <div style={{
                                            width: '100%',
                                            aspectRatio: '16/9',
                                            background: '#333',
                                            borderRadius: '4px',
                                            marginBottom: '0.5rem',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            overflow: 'hidden',
                                            position: 'relative'
                                        }}>
                                            <img
                                                src={vehicle.image}
                                                alt={vehicle.name}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                            {isUnavailable && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: 0, left: 0, right: 0, bottom: 0,
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    color: 'white',
                                                    fontWeight: 'bold',
                                                    fontSize: '1rem',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '1px',
                                                    transform: 'rotate(-15deg)',
                                                    textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                                                    zIndex: 10
                                                }}>
                                                    Unavailable
                                                </div>
                                            )}
                                        </div>
                                        <span style={{ fontWeight: 'bold', color: 'white' }}>{vehicle.name}</span>
                                        {vehicle.subtitle && (
                                            <span style={{ fontSize: '0.8rem', color: '#ccc', marginBottom: '0.2rem' }}>{vehicle.subtitle}</span>
                                        )}
                                        <span style={{
                                            fontSize: '0.9rem',
                                            color: vehicle.rawPrice === 0 ? '#4ade80' : '#E60012',
                                            fontWeight: 'bold'
                                        }}>
                                            {vehicle.price}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}

            {/* Third Vehicle Nomination Section (For Flexible / 7-9 pax) */}
            {carCount >= 3 && (
                <>
                    <h3 className="options-section-title" style={{ marginTop: '2rem' }}>Choose Your Ride (Car 3)</h3>
                    <div className="options-group">
                        <div className="vehicle-grid">
                            {/* No Nomination for Car 3 */}
                            <div
                                onClick={() => !disabledVehicles.includes('random-r34') && handleTextChange('selectedVehicle3', randomSlotId)}
                                style={{
                                    border: options.selectedVehicle3 === randomSlotId ? '2px solid #009933' : '1px solid #444',
                                    background: options.selectedVehicle3 === randomSlotId ? 'rgba(0, 153, 51, 0.1)' : '#222',
                                    padding: '0.5rem',
                                    borderRadius: '8px',
                                    cursor: disabledVehicles.includes('random-r34') ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    transition: 'all 0.2s',
                                    position: 'relative',
                                    opacity: disabledVehicles.includes('random-r34') ? 0.6 : 1,
                                    filter: disabledVehicles.includes('random-r34') ? 'brightness(0.5)' : 'none',
                                }}
                            >
                                <div style={{
                                    width: '100%',
                                    aspectRatio: '16/9',
                                    background: '#333',
                                    borderRadius: '4px',
                                    marginBottom: '0.5rem',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    color: '#aaa',
                                    fontSize: '1.2rem',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase',
                                    overflow: 'hidden',
                                    position: 'relative'
                                }}>
                                    <img src={randomR34} alt={randomSlotTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <div style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        color: 'white',
                                        fontSize: '4rem',
                                        fontWeight: 'bold',
                                        textShadow: '0 4px 12px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.6)',
                                        pointerEvents: 'none',
                                        zIndex: 5
                                    }}>
                                        ?
                                    </div>
                                    {disabledVehicles.includes('random-r34') && (
                                        <div style={{
                                            position: 'absolute',
                                            top: 0, left: 0, right: 0, bottom: 0,
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            color: 'white',
                                            fontWeight: 'bold',
                                            fontSize: '1rem',
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px',
                                            transform: 'rotate(-15deg)',
                                            textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                                            zIndex: 10
                                        }}>
                                            Unavailable
                                        </div>
                                    )}
                                </div>
                                <span style={{ fontWeight: 'bold', color: 'white' }}>{randomSlotTitle}</span>
                                <span style={{ fontSize: '0.8rem', color: '#ccc', marginBottom: '0.2rem', textAlign: 'center' }}>Assigned on day</span>
                                <span style={{ fontSize: '0.8rem', color: '#4ade80', fontWeight: 'bold' }}>¥0</span>
                            </div>

                            {/* Specific Vehicles for Car 3 */}
                            {sortedVehicles.map(vehicle => {
                                // Disable if blocked externally or chosen elsewhere
                                const isUnavailable = disabledVehicles.includes(vehicle.id) || getSelectedVehicles(3).includes(vehicle.id);
                                if (carCount >= 4 && isUnavailable) return null;
                                return (
                                    <div
                                        key={`v3-${vehicle.id}`}
                                        onClick={() => !isUnavailable && handleTextChange('selectedVehicle3', vehicle.id)}
                                        style={{
                                            border: options.selectedVehicle3 === vehicle.id ? '2px solid #009933' : '1px solid #444',
                                            background: options.selectedVehicle3 === vehicle.id ? 'rgba(0, 153, 51, 0.1)' : '#222',
                                            padding: '0.5rem',
                                            borderRadius: '8px',
                                            cursor: isUnavailable ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            transition: 'all 0.2s',
                                            opacity: isUnavailable ? 0.6 : 1,
                                            filter: isUnavailable ? 'brightness(0.5)' : 'none',
                                            position: 'relative'
                                        }}
                                    >
                                        <div style={{
                                            width: '100%',
                                            aspectRatio: '16/9',
                                            background: '#333',
                                            borderRadius: '4px',
                                            marginBottom: '0.5rem',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            overflow: 'hidden',
                                            position: 'relative'
                                        }}>
                                            <img
                                                src={vehicle.image}
                                                alt={vehicle.name}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                            {isUnavailable && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: 0, left: 0, right: 0, bottom: 0,
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    color: 'white',
                                                    fontWeight: 'bold',
                                                    fontSize: '1rem',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '1px',
                                                    transform: 'rotate(-15deg)',
                                                    textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                                                    zIndex: 10
                                                }}>
                                                    Unavailable
                                                </div>
                                            )}
                                        </div>
                                        <span style={{ fontWeight: 'bold', color: 'white' }}>{vehicle.name}</span>
                                        {vehicle.subtitle && (
                                            <span style={{ fontSize: '0.8rem', color: '#ccc', marginBottom: '0.2rem' }}>{vehicle.subtitle}</span>
                                        )}
                                        <span style={{
                                            fontSize: '0.9rem',
                                            color: vehicle.rawPrice === 0 ? '#4ade80' : '#E60012',
                                            fontWeight: 'bold'
                                        }}>
                                            {vehicle.price}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}

            {/* Fourth Vehicle Nomination Section */}
            {carCount >= 4 && (
                <>
                    <h3 className="options-section-title" style={{ marginTop: '2rem' }}>Choose Your Ride (Car 4)</h3>
                    <div className="options-group">
                        <div className="vehicle-grid">
                            <div
                                onClick={() => !disabledVehicles.includes('random-r34') && handleTextChange('selectedVehicle4', randomSlotId)}
                                style={{
                                    border: options.selectedVehicle4 === randomSlotId ? '2px solid #009933' : '1px solid #444',
                                    background: options.selectedVehicle4 === randomSlotId ? 'rgba(0, 153, 51, 0.1)' : '#222',
                                    padding: '0.5rem',
                                    borderRadius: '8px',
                                    cursor: disabledVehicles.includes('random-r34') ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    transition: 'all 0.2s',
                                    position: 'relative',
                                    opacity: disabledVehicles.includes('random-r34') ? 0.6 : 1,
                                    filter: disabledVehicles.includes('random-r34') ? 'brightness(0.5)' : 'none',
                                }}
                            >
                                <div style={{
                                    width: '100%', aspectRatio: '16/9', background: '#333', borderRadius: '4px', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', position: 'relative'
                                }}>
                                    <img src={randomR34} alt={randomSlotTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white', fontSize: '4rem', fontWeight: 'bold', textShadow: '0 4px 12px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.6)', pointerEvents: 'none', zIndex: 5 }}>?</div>
                                </div>
                                <span style={{ fontWeight: 'bold', color: 'white' }}>{randomSlotTitle}</span>
                                <span style={{ fontSize: '0.8rem', color: '#ccc', marginBottom: '0.2rem', textAlign: 'center' }}>Assigned on day</span>
                                <span style={{ fontSize: '0.8rem', color: '#4ade80', fontWeight: 'bold' }}>¥0</span>
                            </div>

                            {sortedVehicles.map(vehicle => {
                                const isUnavailable = disabledVehicles.includes(vehicle.id) || getSelectedVehicles(4).includes(vehicle.id);
                                if (carCount >= 5 && isUnavailable) return null;
                                return (
                                    <div
                                        key={`v4-${vehicle.id}`}
                                        onClick={() => !isUnavailable && handleTextChange('selectedVehicle4', vehicle.id)}
                                        style={{
                                            border: options.selectedVehicle4 === vehicle.id ? '2px solid #009933' : '1px solid #444',
                                            background: options.selectedVehicle4 === vehicle.id ? 'rgba(0, 153, 51, 0.1)' : '#222',
                                            padding: '0.5rem', borderRadius: '8px', cursor: isUnavailable ? 'not-allowed' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'all 0.2s', opacity: isUnavailable ? 0.6 : 1, filter: isUnavailable ? 'brightness(0.5)' : 'none', position: 'relative'
                                        }}
                                    >
                                        <div style={{ width: '100%', aspectRatio: '16/9', background: '#333', borderRadius: '4px', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', position: 'relative' }}>
                                            <img src={vehicle.image} alt={vehicle.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            {isUnavailable && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 'bold', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px', transform: 'rotate(-15deg)', textShadow: '0 2px 4px rgba(0,0,0,0.8)', zIndex: 10 }}>Unavailable</div>}
                                        </div>
                                        <span style={{ fontWeight: 'bold', color: 'white' }}>{vehicle.name}</span>
                                        {vehicle.subtitle && <span style={{ fontSize: '0.8rem', color: '#ccc', marginBottom: '0.2rem' }}>{vehicle.subtitle}</span>}
                                        <span style={{ fontSize: '0.9rem', color: vehicle.rawPrice === 0 ? '#4ade80' : '#E60012', fontWeight: 'bold' }}>{vehicle.price}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}

            {/* Fifth Vehicle Nomination Section */}
            {carCount >= 5 && (
                <>
                    <h3 className="options-section-title" style={{ marginTop: '2rem' }}>Choose Your Ride (Car 5)</h3>
                    <div className="options-group">
                        <div className="vehicle-grid">
                            <div
                                onClick={() => !disabledVehicles.includes('random-r34') && handleTextChange('selectedVehicle5', randomSlotId)}
                                style={{
                                    border: options.selectedVehicle5 === randomSlotId ? '2px solid #009933' : '1px solid #444',
                                    background: options.selectedVehicle5 === randomSlotId ? 'rgba(0, 153, 51, 0.1)' : '#222',
                                    padding: '0.5rem',
                                    borderRadius: '8px',
                                    cursor: disabledVehicles.includes('random-r34') ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    transition: 'all 0.2s',
                                    position: 'relative',
                                    opacity: disabledVehicles.includes('random-r34') ? 0.6 : 1,
                                    filter: disabledVehicles.includes('random-r34') ? 'brightness(0.5)' : 'none',
                                }}
                            >
                                <div style={{
                                    width: '100%', aspectRatio: '16/9', background: '#333', borderRadius: '4px', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', position: 'relative'
                                }}>
                                    <img src={randomR34} alt={randomSlotTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white', fontSize: '4rem', fontWeight: 'bold', textShadow: '0 4px 12px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.6)', pointerEvents: 'none', zIndex: 5 }}>?</div>
                                </div>
                                <span style={{ fontWeight: 'bold', color: 'white' }}>{randomSlotTitle}</span>
                                <span style={{ fontSize: '0.8rem', color: '#ccc', marginBottom: '0.2rem', textAlign: 'center' }}>Assigned on day</span>
                                <span style={{ fontSize: '0.8rem', color: '#4ade80', fontWeight: 'bold' }}>¥0</span>
                            </div>

                            {sortedVehicles.map(vehicle => {
                                const isUnavailable = disabledVehicles.includes(vehicle.id) || getSelectedVehicles(5).includes(vehicle.id);
                                return (
                                    <div
                                        key={`v5-${vehicle.id}`}
                                        onClick={() => !isUnavailable && handleTextChange('selectedVehicle5', vehicle.id)}
                                        style={{
                                            border: options.selectedVehicle5 === vehicle.id ? '2px solid #009933' : '1px solid #444',
                                            background: options.selectedVehicle5 === vehicle.id ? 'rgba(0, 153, 51, 0.1)' : '#222',
                                            padding: '0.5rem', borderRadius: '8px', cursor: isUnavailable ? 'not-allowed' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'all 0.2s', opacity: isUnavailable ? 0.6 : 1, filter: isUnavailable ? 'brightness(0.5)' : 'none', position: 'relative'
                                        }}
                                    >
                                        <div style={{ width: '100%', aspectRatio: '16/9', background: '#333', borderRadius: '4px', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', position: 'relative' }}>
                                            <img src={vehicle.image} alt={vehicle.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            {isUnavailable && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 'bold', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px', transform: 'rotate(-15deg)', textShadow: '0 2px 4px rgba(0,0,0,0.8)', zIndex: 10 }}>Unavailable</div>}
                                        </div>
                                        <span style={{ fontWeight: 'bold', color: 'white' }}>{vehicle.name}</span>
                                        {vehicle.subtitle && <span style={{ fontSize: '0.8rem', color: '#ccc', marginBottom: '0.2rem' }}>{vehicle.subtitle}</span>}
                                        <span style={{ fontSize: '0.9rem', color: vehicle.rawPrice === 0 ? '#4ade80' : '#E60012', fontWeight: 'bold' }}>{vehicle.price}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}

            {/* Photo Spots Section */}
            <h3 className="options-section-title">📸 Photo Spot Add-Ons</h3>
            <div className="options-group">
                {tourType !== 'Umihotaru Tour' && tourType !== 'Midnight Plan' && tourType !== 'Midnight Tour' && (
                    <div className="option-item">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={options.tokyoTower}
                                onChange={() => handleToggle('tokyoTower')}
                            />
                            <span className="checkbox-custom"></span>
                            <div className="option-details">
                                <span className="option-name">Tokyo Tower (x{carCount} Cars)</span>
                            </div>
                            <span className="option-price">+¥{(5000 * carCount).toLocaleString()}</span>
                        </label>
                    </div>
                )}

                <div className="option-item">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={options.shibuya}
                            onChange={() => handleToggle('shibuya')}
                        />
                        <span className="checkbox-custom"></span>
                        <div className="option-details">
                            <span className="option-name">Shibuya Street (x{carCount} Cars)</span>
                        </div>
                        <span className="option-price">+¥{(5000 * carCount).toLocaleString()}</span>
                    </label>
                </div>
            </div>

        </div>
    );
};

export default OptionsSelector;
