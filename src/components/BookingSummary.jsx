import React from 'react';
import './BookingSummary.css';

const BookingSummary = ({ selectedDate, personCount, totalPrice, tourType }) => {
    if (!selectedDate) return null;

    const formatMonthDay = (date) => {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    const formatYear = (date) => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric'
        });
    };

    return (
        <div className="booking-summary-sticky">
            <div className="summary-content">
                <div className="summary-item">
                    <span className="summary-label" style={{ height: 'auto', marginBottom: '0.2rem' }}>
                        <span>Tour Type</span>
                    </span>
                    <span className="summary-value" style={{
                        color: tourType === 'Umihotaru Tour' ? '#0066cc' : '#E60012',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        lineHeight: '1.2',
                        whiteSpace: 'nowrap',
                        fontSize: tourType === 'Umihotaru Tour' ? '0.95em' : 'inherit',
                        marginTop: '8px'
                    }}>{tourType === 'Umihotaru Tour' ? 'Umihotaru' : 'Daikoku'}</span>
                </div>
                <div className="summary-divider"></div>
                <div className="summary-item">
                    <span className="summary-label" style={{ lineHeight: '1.2' }}>
                        <span>Date</span>
                        <span style={{ fontSize: '1.1em', textTransform: 'none', color: '#bbb', marginTop: '4px', fontWeight: 'bold' }}>{formatYear(selectedDate)}</span>
                    </span>
                    <span className="summary-value date">
                        <span>{formatMonthDay(selectedDate)}</span>
                    </span>
                </div>
                <div className="summary-divider"></div>
                <div className="summary-item">
                    <span className="summary-label" style={{ lineHeight: '1.2' }}>
                        <span>Total Price</span>
                        <span style={{ fontSize: '1.1em', textTransform: 'none', color: '#ff9999', marginTop: '4px', fontWeight: 'bold' }}>({personCount} guests)</span>
                    </span>
                    <span className="summary-value price">¥{totalPrice.toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
};

export default BookingSummary;
