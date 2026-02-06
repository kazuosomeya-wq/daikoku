import React from 'react';
import './BookingSummary.css';

const BookingSummary = ({ selectedDate, personCount, totalPrice, tourType }) => {
    if (!selectedDate) return null;

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            weekday: 'short'
        });
    };

    return (
        <div className="booking-summary-sticky">
            <div className="summary-content">
                <div className="summary-item">
                    <span className="summary-label">Tour Type</span>
                    <span className="summary-value" style={{ color: '#E60012', fontWeight: 'bold' }}>{tourType}</span>
                </div>
                <div className="summary-divider"></div>
                <div className="summary-item">
                    <span className="summary-label">Selected Date</span>
                    <span className="summary-value date">{formatDate(selectedDate)}</span>
                </div>
                <div className="summary-divider"></div>
                <div className="summary-item">
                    <span className="summary-label">Total Price ({personCount} guests)</span>
                    <span className="summary-value price">¥{totalPrice.toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
};

export default BookingSummary;
