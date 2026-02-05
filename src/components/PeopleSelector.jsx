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
          {[...Array(10)].map((_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1} {i + 1 === 1 ? 'person' : 'people'}
            </option>
          ))}
          <option value={11}>10+ people</option>
        </select>
        <span className="select-arrow">▼</span>
      </div>
      <p className="selector-hint">Pricing varies by group size</p>
    </div>
  );
};

export default PeopleSelector;
