import React from 'react';
import './OptionsSelector.css';
import vehicle1 from '../assets/vehicle1.jpg';
import vehicle2 from '../assets/vehicle2.jpg';
import vehicle3 from '../assets/vehicle3.jpg';
import vehicle4 from '../assets/vehicle4.jpg';

const OptionsSelector = ({ options, onChange }) => {
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
                        <span style={{ fontWeight: 'bold', color: 'white' }}>No Nomination</span>
                        <span style={{ fontSize: '0.8rem', color: '#ccc', marginBottom: '0.2rem' }}>Random R34</span>
                        <span style={{ fontSize: '0.8rem', color: '#999' }}>¥0</span>
                    </div>

                    {/* Vehicle 1 */}
                    <div
                        onClick={() => handleTextChange('selectedVehicle', 'vehicle1')}
                        style={{
                            border: options.selectedVehicle === 'vehicle1' ? '2px solid #E60012' : '1px solid #444',
                            background: options.selectedVehicle === 'vehicle1' ? 'rgba(230, 0, 18, 0.1)' : '#222',
                            padding: '0.5rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            transition: 'all 0.2s'
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
                            overflow: 'hidden'
                        }}>
                            <img
                                src={vehicle1}
                                alt="Vehicle 1"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>
                        <span style={{ fontWeight: 'bold', color: 'white' }}>Bayside Blue R34</span>
                        <span style={{ fontSize: '0.8rem', color: '#ccc', marginBottom: '0.2rem' }}>English ⚪︎</span>
                        <span style={{ fontSize: '0.8rem', color: '#999' }}>¥0</span>
                    </div>

                    {/* Vehicle 2 */}
                    <div
                        onClick={() => handleTextChange('selectedVehicle', 'vehicle2')}
                        style={{
                            border: options.selectedVehicle === 'vehicle2' ? '2px solid #E60012' : '1px solid #444',
                            background: options.selectedVehicle === 'vehicle2' ? 'rgba(230, 0, 18, 0.1)' : '#222',
                            padding: '0.5rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            transition: 'all 0.2s'
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
                            overflow: 'hidden'
                        }}>
                            <img
                                src={vehicle2}
                                alt="Vehicle 2"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>
                        <span style={{ fontWeight: 'bold', color: 'white' }}>600hp Bayside Blue R34</span>
                        <span style={{ fontSize: '0.8rem', color: '#999' }}>¥0</span>
                    </div>

                    {/* Vehicle 3 */}
                    <div
                        onClick={() => handleTextChange('selectedVehicle', 'vehicle3')}
                        style={{
                            border: options.selectedVehicle === 'vehicle3' ? '2px solid #E60012' : '1px solid #444',
                            background: options.selectedVehicle === 'vehicle3' ? 'rgba(230, 0, 18, 0.1)' : '#222',
                            padding: '0.5rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            transition: 'all 0.2s'
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
                            overflow: 'hidden'
                        }}>
                            <img
                                src={vehicle3}
                                alt="Vehicle 3"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>
                        <span style={{ fontWeight: 'bold', color: 'white' }}>R32 GTR</span>
                        <span style={{ fontSize: '0.8rem', color: '#999' }}>¥0</span>
                    </div>

                    {/* Vehicle 4 */}
                    <div
                        onClick={() => handleTextChange('selectedVehicle', 'vehicle4')}
                        style={{
                            border: options.selectedVehicle === 'vehicle4' ? '2px solid #E60012' : '1px solid #444',
                            background: options.selectedVehicle === 'vehicle4' ? 'rgba(230, 0, 18, 0.1)' : '#222',
                            padding: '0.5rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            transition: 'all 0.2s'
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
                            overflow: 'hidden'
                        }}>
                            <img
                                src={vehicle4}
                                alt="Vehicle 4"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>
                        <span style={{ fontWeight: 'bold', color: 'white' }}>Purple Supra</span>
                        <span style={{ fontSize: '0.8rem', color: '#999' }}>¥0</span>
                    </div>

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
