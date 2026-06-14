import React, { useState, useRef, useEffect } from 'react';
import { usePhoneInput, defaultCountries, FlagImage } from 'react-international-phone';
import 'react-international-phone/style.css';
import './GuestInfo.css';

const CustomCountryDropdown = ({ currentIso2, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filtered = defaultCountries.filter(c => c[0].toLowerCase().includes(search.toLowerCase()));
    
    // Add "Others" option at the end
    const options = [
        ...filtered,
        ['Others', 'xx', '']
    ];

    return (
        <div className="custom-country-select-container" ref={dropdownRef} style={{ width: 'auto' }}>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    height: '40px',
                    padding: '0 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    cursor: 'pointer',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px 0 0 8px',
                    backgroundColor: '#f3f4f6',
                    borderRight: 'none',
                    boxSizing: 'border-box'
                }}
            >
                {currentIso2 === 'xx' ? (
                    <span style={{ width: '24px', height: '16px', display: 'inline-block', textAlign: 'center', fontSize: '14px', lineHeight: '16px' }}>🌐</span>
                ) : (
                    <FlagImage iso2={currentIso2} style={{ width: '24px', height: '16px' }} />
                )}
                <span style={{ fontSize: '10px', color: '#666' }}>▼</span>
            </div>
            {isOpen && (
                <div className="custom-country-select-menu">
                    <div className="custom-country-search-wrapper">
                        <input 
                            type="text" 
                            className="custom-country-search-input"
                            placeholder="Type to search country..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="custom-country-options-list">
                        {options.map(c => (
                            <div 
                                key={c[1]}
                                className="custom-country-option"
                                onClick={() => {
                                    onSelect(c[2], c[1]); 
                                    setIsOpen(false);
                                    setSearch('');
                                }}
                            >
                                {c[1] === 'xx' ? (
                                    <span style={{ width: '24px', height: '16px', flexShrink: 0, display: 'inline-block', textAlign: 'center', fontSize: '14px', lineHeight: '16px' }}>🌐</span>
                                ) : (
                                    <FlagImage iso2={c[1]} style={{ width: '24px', height: '16px', flexShrink: 0 }} />
                                )}
                                <span>{c[0]} {c[2] ? <span style={{ color: '#888' }}>(+{c[2]})</span> : null}</span>
                            </div>
                        ))}
                        {filtered.length === 0 && <div className="custom-country-no-options">No countries found</div>}
                    </div>
                </div>
            )}
        </div>
    );
};
import 'react-international-phone/style.css';
import './GuestInfo.css';


const CustomPhoneField = ({ value, onChange }) => {
    const parseWhatsApp = (fullStr) => {
        if (!fullStr) return { code: '81', num: '' };
        if (fullStr.startsWith('+')) {
            const spaceIdx = fullStr.indexOf(' ');
            if (spaceIdx !== -1) {
                return { 
                    code: fullStr.substring(1, spaceIdx).replace(/\D/g, ''), 
                    num: fullStr.substring(spaceIdx + 1) 
                };
            }
            return { code: fullStr.substring(1).replace(/\D/g, ''), num: '' };
        }
        return { code: '81', num: fullStr };
    };
    
    const { code, num } = parseWhatsApp(value);

    // Find iso2 from dial code, prioritizing certain countries for shared codes
    const priorityIso2 = {
        '1': 'us',
        '44': 'gb',
        '61': 'au',
        '358': 'fi'
    };

    const foundCountry = defaultCountries.find(c => {
        if (priorityIso2[code]) {
            return c[1] === priorityIso2[code];
        }
        return c[2] === code;
    });
    const currentIso2 = foundCountry ? foundCountry[1] : 'xx';

    const handleCodeChange = (e) => {
        const newCode = e.target.value.replace(/\D/g, '');
        onChange(`+${newCode} ${num}`);
    };

    const handleNumChange = (e) => {
        const newNum = e.target.value.replace(/[^0-9\s-]/g, '');
        onChange(`+${code} ${newNum}`);
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            
            {/* Box 1: Flag and Dial Code connected */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <CustomCountryDropdown 
                    currentIso2={currentIso2}
                    onSelect={(dialCode) => {
                        onChange(`+${dialCode} ${num}`);
                    }}
                />
                
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1px solid #d1d5db',
                    borderLeft: 'none',
                    borderRadius: '0 8px 8px 0',
                    backgroundColor: '#f9fafb',
                    height: '40px',
                    flexShrink: 0,
                    width: '70px',
                    boxSizing: 'border-box'
                }}>
                    <span style={{ 
                        paddingLeft: '8px', 
                        color: '#333', 
                        fontSize: '1rem'
                    }}>+</span>
                    <input
                        type="tel"
                        value={code}
                        onChange={handleCodeChange}
                        maxLength={4}
                        style={{ 
                            width: '100%', 
                            height: '100%',
                            border: 'none',
                            background: 'transparent',
                            padding: '0 6px',
                            fontSize: '1rem',
                            outline: 'none',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>
            </div>

            {/* Box 2: Local Phone Number (Separated) */}
            <input
                type="tel"
                value={num}
                onChange={handleNumChange}
                style={{ 
                    flex: 1,
                    height: '40px', 
                    fontSize: '1rem', 
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    backgroundColor: '#f9fafb',
                    padding: '0 12px',
                    boxSizing: 'border-box',
                    outline: 'none'
                }}
            />
        </div>
    );
};

const GuestInfo = ({ formData, onChange }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        onChange({
            ...formData,
            [name]: value
        });
    };

    return (
        <div className="guest-info-container">
            <h3 className="section-title">Guest Information</h3>

            <div className="form-group">
                <label htmlFor="name">Full Name <span className="required">*</span></label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="email">Email Address <span className="required">*</span></label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="hotel">Hotel / Pickup Location</label>
                <span className="helper-text">If not decided yet, you can let us know later.</span>
                <input
                    type="text"
                    id="hotel"
                    name="hotel"
                    value={formData.hotel}
                    onChange={handleChange}
                />
            </div>

            <div className="form-group">
                <label htmlFor="instagram">Instagram ID <span className="required">*</span></label>
                <div className="input-with-prefix">
                    <span className="prefix">@</span>
                    <input
                        type="text"
                        id="instagram"
                        name="instagram"
                        value={formData.instagram}
                        onChange={handleChange}
                        required
                    />
                </div>
            </div>

            <div className="form-group">
                <label htmlFor="whatsapp">WhatsApp / Phone Number</label>
                <CustomPhoneField 
                    value={formData.whatsapp}
                    onChange={(phone) => onChange({ ...formData, whatsapp: phone })}
                />
            </div>


            <div className="form-group">
                <label htmlFor="remarks">Remarks (Optional)</label>
                <textarea
                    id="remarks"
                    name="remarks"
                    value={formData.remarks || ''}
                    onChange={handleChange}
                    rows="2"
                    placeholder="Any special requests or questions?"
                />
            </div>
        </div>
    );
};

export default GuestInfo;
