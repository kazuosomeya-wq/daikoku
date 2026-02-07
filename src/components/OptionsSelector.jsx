import React from 'react';
import './OptionsSelector.css';
import vehicle1 from '../assets/vehicle1.jpg';
import vehicle2 from '../assets/vehicle2.jpg';
import vehicle3 from '../assets/vehicle3.jpg';
import vehicle4 from '../assets/vehicle4.jpg';

const OptionsSelector = ({ options, onChange, disabledVehicles = [] }) => {
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

    const vehicleData = [
        { id: 'vehicle1', name: 'R34 - Bayside Blue', price: '+¥5,000', image: vehicle1, subtitle: 'English ⚪︎' },
        { id: 'vehicle2', name: 'R34 - 600hp Bayside Blue', price: '+¥15,000', image: vehicle2, subtitle: null },
        { id: 'vehicle3', name: 'R32 - GTR', price: '+¥5,000', image: vehicle3, subtitle: null },
        { id: 'vehicle4', name: 'Supra - Purple', price: '+¥5,000', image: vehicle4, subtitle: null },
    ];

    const availableVehicles = vehicleData.filter(v => !disabledVehicles.includes(v.id));
    const unavailableVehicles = vehicleData.filter(v => disabledVehicles.includes(v.id));
    const sortedVehicles = [...availableVehicles, ...unavailableVehicles];

    return (
        <div className="options-container">
            {/* Vehicle Nomination Section */}
            <h3 className="options-section-title">Choose Your Ride</h3>
            <div className="options-group">
                <p className="options-group-intro">
                    You can request a specific car for your tour.<br />
                    If no selection is made, a random R34 Skyline will be assigned automatically.
                </p>

                <div className="vehicle-grid">

                    {/* No Nomination */}
                    <div
                        onClick={() => handleTextChange('selectedVehicle', 'none')}
                        style={{
                            border: options.selectedVehicle === 'none' ? '2px solid #E60012' : '1px solid #444',
                            background: options.selectedVehicle === 'none' ? 'rgba(230, 0, 18, 0.1)' : '#222',
                            padding: '0.5rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            transition: 'all 0.2s',
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
                            color: '#aaa',
                            fontSize: '1.2rem',
                            fontWeight: 'bold',
                            textTransform: 'uppercase'
                        }}>
                            Random R34
                        </div>
                        <span style={{ fontWeight: 'bold', color: 'white' }}>Random R34</span>
                        <span style={{ fontSize: '0.8rem', color: '#ccc', marginBottom: '0.2rem' }}>A Skyline R34 will be assigned on the day</span>
                        <span style={{ fontSize: '0.8rem', color: '#999' }}>¥0</span>
                    </div>

                    {/* Specific Vehicles */}
                    {sortedVehicles.map(vehicle => {
                        const isUnavailable = disabledVehicles.includes(vehicle.id);
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
                                <span style={{ fontSize: '0.8rem', color: '#999' }}>{vehicle.price}</span>
                            </div>
                        );
                    })}

                </div>
            </div>

            {/* Photo Spots Section */}
            <h3 className="options-section-title">📸 Photo Spot Add-Ons</h3>
            <div className="options-group">
                <div className="option-item">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={options.tokyoTower}
                            onChange={() => handleToggle('tokyoTower')}
                        />
                        <span className="checkbox-custom"></span>
                        <div className="option-details">
                            <span className="option-name">Tokyo Tower</span>
                        </div>
                        <span className="option-price">+¥5,000</span>
                    </label>
                </div>

                <div className="option-item">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={options.shibuya}
                            onChange={() => handleToggle('shibuya')}
                        />
                        <span className="checkbox-custom"></span>
                        <div className="option-details">
                            <span className="option-name">Shibuya Crossing</span>
                        </div>
                        <span className="option-price">+¥5,000</span>
                    </label>
                </div>
            </div>

        </div>
    );
};

export default OptionsSelector;
