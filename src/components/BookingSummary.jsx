import React from 'react';
import './BookingSummary.css';

const BookingSummary = ({ selectedDate, personCount, totalPrice, tourType, options }) => {
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
                        <span>Plan</span>
                    </span>
                    <span className="summary-value" style={{
                        color: tourType === 'Midnight Plan' ? '#9c27b0' : (tourType === 'Sunday Morning Plan' ? '#ff9900' : '#E60012'),
                        fontWeight: 'bold',
                        textAlign: 'center',
                        lineHeight: '1.2',
                        whiteSpace: 'nowrap',
                        fontSize: tourType === 'Sunday Morning Plan' ? '0.85em' : 'inherit',
                        marginTop: '8px'
                    }}>
                        {tourType === 'Midnight Plan' || tourType === 'Umihotaru Tour' ? (
                            <>
                                Midnight Tour<br />
                                <span style={{ fontSize: '0.85em', opacity: 0.9 }}>{options?.midnightTimeSlot || '8:30 PM'}</span>
                            </>
                        ) : (
                            tourType === 'Sunday Morning Plan' ? 'Sun Morning' : 'Daikoku Tour'
                        )}
                    </span>
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
                        <span style={{ fontSize: '1.1em', textTransform: 'none', color: '#ff9999', marginTop: '4px', fontWeight: 'bold' }}>
                            ({personCount === 10 ? '10+' : personCount} {personCount === 1 ? 'guest' : 'guests'})
                        </span>
                    </span>
                    <span className="summary-value price">
                        {personCount >= 10 ? 'Ask' : `¥${totalPrice.toLocaleString()}`}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default BookingSummary;
