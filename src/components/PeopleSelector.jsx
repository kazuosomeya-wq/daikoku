import React from 'react';
import './PeopleSelector.css';

const PeopleSelector = ({ value, onChange, carCount, onCarCountChange, planType = 'Standard Plan' }) => {
  const getCarOptions = (pax) => {
    const minCars = Math.ceil(pax / 3);
    const maxCars = Math.min(pax, 5);
    const options = [];
    for (let i = minCars; i <= maxCars; i++) {
      options.push(i);
    }
    return options;
  };

  const carOptions = getCarOptions(value);

  return (
    <div className="people-selector-container" style={{ 
      width: '100%', 
      maxWidth: '320px', 
      margin: '0 auto', 
      background: '#1a1a1a', 
      border: '1px solid #333', 
      borderRadius: '12px', 
      padding: '1.5rem',
      boxSizing: 'border-box'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ minWidth: 0 }}>
          <label htmlFor="people-count" className="selector-label" style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>
            Number of Guests
          </label>
          <div className="select-wrapper">
            <select
              id="people-count"
              value={value}
              onChange={(e) => onChange(Number(e.target.value))}
              className="people-select"
            >
              {[...Array(9)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1} {i + 1 === 1 ? 'person' : 'people'}
                </option>
              ))}
              <option value={10}>10+ people</option>
            </select>
            <span className="select-arrow">▼</span>
          </div>
        </div>

        {value < 10 ? (
          <div style={{ minWidth: 0 }}>
            <label htmlFor="car-count" className="selector-label" style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>
              Number of Cars
            </label>
            <div className="select-wrapper">
              <select
                id="car-count"
                value={carCount}
                onChange={(e) => onCarCountChange(Number(e.target.value))}
                className="people-select"
              >
                {carOptions.map(num => {
                  const minCars = Math.ceil(value / 3);
                  const feePerExtraCar = planType === 'City Tour' ? 35000 : 50000;
                  const extraFee = (num > minCars) ? (num - minCars) * feePerExtraCar : 0;
                  const labelText = extraFee > 0 ? `${num} cars (+¥${extraFee.toLocaleString()})` : `${num} ${num === 1 ? 'car' : 'cars'}`;
                  return (
                    <option key={num} value={num}>
                      {labelText}
                    </option>
                  );
                })}
              </select>
              <span className="select-arrow">▼</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#888', display: 'block', marginTop: '0.5rem' }}>*Max 3 persons per 1 car</span>
          </div>
        ) : (
          <div style={{ minWidth: 0, visibility: 'hidden' }}>
            <label className="selector-label">Placeholder</label>
            <div className="select-wrapper">
              <select className="people-select"><option>Placeholder</option></select>
            </div>
            <span style={{ fontSize: '0.75rem', display: 'block', marginTop: '0.5rem' }}>Placeholder</span>
          </div>
        )}
      </div>

      {value >= 10 && (
        <a 
          href="https://www.instagram.com/daikoku_hunters/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="instagram-dm-btn"
          style={{ marginTop: '1rem' }}
        >
          Message us on Instagram for 10+ guests
        </a>
      )}
    </div>
  );
};

export default PeopleSelector;
