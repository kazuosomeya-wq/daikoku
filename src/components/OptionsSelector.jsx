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
            {/* Car Options Section */}
            <h3 className="options-section-title">Customize Your Ride</h3>
            <div className="options-group">
                <p className="options-group-intro">
                    Our standard tour vehicle is usually an R34 Skyline.<br />
                    You can enhance your experience with optional upgrades such as color, model selection, or performance level.
                </p>

                <div className="option-item">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={options.colorRequest}
                            onChange={() => handleToggle('colorRequest')}
                        />
                        <span className="checkbox-custom"></span>
                        <div className="option-details">
                            <span className="option-name">🎨 Color Request</span>
                            <span className="option-desc">Choose your preferred R34 color (subject to availability)</span>
                        </div>
                        <span className="option-price">+¥5,000</span>
                    </label>
                    {options.colorRequest && (
                        <input
                            type="text"
                            className="option-text-input"
                            placeholder="e.g. Bayside Blue, Millenium Jade"
                            value={options.colorRequestText}
                            onChange={(e) => handleTextChange('colorRequestText', e.target.value)}
                        />
                    )}
                </div>

                <div className="option-item">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={options.modelRequest}
                            onChange={() => handleToggle('modelRequest')}
                        />
                        <span className="checkbox-custom"></span>
                        <div className="option-details">
                            <span className="option-name">🚗 Specific Model Request</span>
                            <span className="option-desc">Request a different model, such as an RX-7 or Supra (subject to availability)</span>
                        </div>
                        <span className="option-price">+¥5,000</span>
                    </label>
                    {options.modelRequest && (
                        <input
                            type="text"
                            className="option-text-input"
                            placeholder="e.g. Mazda RX-7 FD3S, Toyota Supra JZA80"
                            value={options.modelRequestText}
                            onChange={(e) => handleTextChange('modelRequestText', e.target.value)}
                        />
                    )}
                </div>

                <div className="option-item">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={options.tunedCarRequest}
                            onChange={() => handleToggle('tunedCarRequest')}
                        />
                        <span className="checkbox-custom"></span>
                        <div className="option-details">
                            <span className="option-name">🔥 High-Power / Tuned Car Request</span>
                            <span className="option-desc">For guests who want a higher-performance build (subject to availability)</span>
                        </div>
                        <span className="option-price">+¥15,000</span>
                    </label>
                </div>

                <p className="options-group-note">
                    All special requests are subject to availability and cannot be guaranteed.<br />
                    If your request is unavailable, no additional fee will be charged.
                </p>
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
