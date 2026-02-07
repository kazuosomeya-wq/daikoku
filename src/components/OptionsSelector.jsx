import React from 'react';
import './OptionsSelector.css';

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
            <h3 className="options-section-title">Select Your Vehicle (Nomination)</h3>
            <div className="options-group">
                <p className="options-group-intro">
                    You can nominate a specific vehicle for your tour.<br />
                    If you do not nominate, a vehicle will be assigned automatically.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>

                    {/* No Nomination */}
                    <div
                        onClick={() => handleTextChange('selectedVehicle', 'none')}
                        style={{
                            border: options.selectedVehicle === 'none' ? '2px solid #E60012' : '1px solid #444',
                            background: options.selectedVehicle === 'none' ? 'rgba(230, 0, 18, 0.1)' : '#222',
                            padding: '1rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            transition: 'all 0.2s'
                        }}
                    >
                        <span style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🎲</span>
                        <span style={{ fontWeight: 'bold', color: 'white' }}>No Nomination</span>
                        <span style={{ fontSize: '0.8rem', color: '#999' }}>Standard</span>
                    </div>

                    {/* Vehicle 1 */}
                    <div
                        onClick={() => handleTextChange('selectedVehicle', 'vehicle1')}
                        style={{
                            border: options.selectedVehicle === 'vehicle1' ? '2px solid #E60012' : '1px solid #444',
                            background: options.selectedVehicle === 'vehicle1' ? 'rgba(230, 0, 18, 0.1)' : '#222',
                            padding: '1rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            transition: 'all 0.2s'
                        }}
                    >
                        <span style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🚗</span>
                        <span style={{ fontWeight: 'bold', color: 'white' }}>Vehicle 1</span>
                        <span style={{ fontSize: '0.8rem', color: '#999' }}>¥0</span>
                    </div>

                    {/* Vehicle 2 */}
                    <div
                        onClick={() => handleTextChange('selectedVehicle', 'vehicle2')}
                        style={{
                            border: options.selectedVehicle === 'vehicle2' ? '2px solid #E60012' : '1px solid #444',
                            background: options.selectedVehicle === 'vehicle2' ? 'rgba(230, 0, 18, 0.1)' : '#222',
                            padding: '1rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            transition: 'all 0.2s'
                        }}
                    >
                        <span style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🏎️</span>
                        <span style={{ fontWeight: 'bold', color: 'white' }}>Vehicle 2</span>
                        <span style={{ fontSize: '0.8rem', color: '#999' }}>¥0</span>
                    </div>

                    {/* Vehicle 3 */}
                    <div
                        onClick={() => handleTextChange('selectedVehicle', 'vehicle3')}
                        style={{
                            border: options.selectedVehicle === 'vehicle3' ? '2px solid #E60012' : '1px solid #444',
                            background: options.selectedVehicle === 'vehicle3' ? 'rgba(230, 0, 18, 0.1)' : '#222',
                            padding: '1rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            transition: 'all 0.2s'
                        }}
                    >
                        <span style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🚙</span>
                        <span style={{ fontWeight: 'bold', color: 'white' }}>Vehicle 3</span>
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
