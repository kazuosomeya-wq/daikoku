import React from 'react';
import './PeopleSelector.css';

const PeopleSelector = ({ value, onChange }) => {
  return (
    <div className="people-selector-container">
      <label htmlFor="people-count" className="selector-label">
        Number of Guests
      </label>
      <div className="select-wrapper">
        <select
          id="people-count"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="people-select"
        >
          {[...Array(6)].map((_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1} {i + 1 === 1 ? 'person' : 'people'}
            </option>
          ))}
          <option value={7}>7+ people</option>
        </select>
        <span className="select-arrow">▼</span>
      </div>
      {value >= 7 ? (
        <a 
          href="https://www.instagram.com/daikoku_hunters/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="instagram-dm-btn"
        >
          Message us on Instagram for 7+ guests
        </a>
      ) : (
        <p className="selector-hint">Pricing varies by group size</p>
      )}
    </div>
  );
};

export default PeopleSelector;
