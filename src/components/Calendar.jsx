import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { getPriceForDate } from '../utils/pricing';
import './Calendar.css';

const Calendar = ({ personCount, carCount = null, selectedDate, onDateSelect, isAdmin = false, tourType = 'Standard Plan' }) => {
    const [currentViewDate, setCurrentViewDate] = useState(selectedDate || new Date());
    const [availability, setAvailability] = useState({}); // { "YYYY-MM-DD": { slots: number, umihotaru: number } }
    const [showClosedMessage, setShowClosedMessage] = useState(false);

    useEffect(() => {
        console.log("DEBUG: ADD PICKUP COL - 2026-02-12 14:05");
        // Listen to realtime updates from Firestore
        const unsubscribe = onSnapshot(collection(db, "availability"), (snapshot) => {
            const data = {};
            snapshot.forEach((doc) => {
                const d = doc.data();
                data[doc.id] = {
                    slots: d.slots,
                    umihotaru: d.umihotaru_slots
                };
            });
            setAvailability(data);
        });

        return () => unsubscribe();
    }, []);

    const getDaysInMonth = (year, month) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year, month) => {
        return new Date(year, month, 1).getDay();
    };

    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth();

    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const days = [];

    // Empty slots
    for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    const getRemainingSlots = (dateString) => {
        const data = availability[dateString];
        if (!data) return undefined;

        if (isAdmin) {
            // Admin editing specific tour type
            if (tourType === 'Midnight Plan') {
                return data.umihotaru;
            } else {
                return data.slots;
            }
        } else {
            // Public view: "Available" if either has slots
            // But we treat "FULL" only if BOTH are 0 (or undefined treated as open unless explicitly 0?)
            // Actually existing logic was: if undefined, open. if 0, full.
            // If data is present, we check.
            const s = data.slots;
            const u = data.umihotaru;

            // If both are explicitly 0, it's 0.
            if (s === 0 && u === 0) return 0;

            // Otherwise return max helpful number to show "Last Spot"?
            // Or just return a high number if one is open.
            // If one is 0 and other is 5, we return 5.
            const val1 = s !== undefined ? s : 99;
            const val2 = u !== undefined ? u : 0; // Default Umihotaru to 0 so it doesn't keep dates open
            return Math.max(val1, val2);
        }
    };

    const isDateDisabled = (date) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        // Format YYYY-MM-DD
        const dateString = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;

        // Disable past dates
        if (checkDate < today) {
            return true;
        }

        const data = availability[dateString];

        let isAvailable = false;
        const isFriSat = checkDate.getDay() === 5 || checkDate.getDay() === 6;
        const isFriSatSun = checkDate.getDay() === 5 || checkDate.getDay() === 6 || checkDate.getDay() === 0;
        const isSun = checkDate.getDay() === 0;

        // Base availability from Firebase
        if (data) {
            if (tourType === 'Midnight Plan') {
                isAvailable = data.umihotaru === undefined || data.umihotaru > 0;
            } else {
                isAvailable = data.slots === undefined || data.slots > 0;
            }
        } else {
            isAvailable = true;
        }

        // Time restrictions for today
        if (!isAdmin && checkDate.getTime() === today.getTime()) {
            // Cutoff extended to 20:30 (8:30 PM) for the 11:30 PM slot on Fri-Sat.
            if (tourType === 'Midnight Plan') {
                if (checkDate.getDay() === 0 && now.getHours() >= 19) {
                    isAvailable = false;
                } else if (checkDate.getDay() !== 0 && (now.getHours() > 20 || (now.getHours() === 20 && now.getMinutes() >= 30))) {
                    isAvailable = false;
                }
            }
            // Standard/Sunday plan changes: Fri-Sun cutoff at 12:00, Mon-Thu cutoff at 12:00
            if (tourType !== 'Midnight Plan' && now.getHours() >= 12) isAvailable = false;
        }

        // Day of week restrictions
        if (tourType === 'Midnight Plan' && !isFriSatSun) isAvailable = false;
        if (tourType === 'Sunday Morning Plan' && !isSun) isAvailable = false;

        return !isAvailable;
    };

    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d);
        
        // Only calculate price for the currently selected plan
        const price = getPriceForDate(date, personCount, carCount, tourType);

        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const slotData = availability[dateString] || {};

        let isFull = false;
        if (tourType === 'Midnight Plan') {
            isFull = slotData.umihotaru !== undefined && slotData.umihotaru <= 0;
        } else {
            isFull = slotData.slots !== undefined && slotData.slots <= 0;
        }

        const isFriSat = date.getDay() === 5 || date.getDay() === 6;
        const isFriSatSun = date.getDay() === 5 || date.getDay() === 6 || date.getDay() === 0;
        const isSun = date.getDay() === 0;

        const isDisabled = isDateDisabled(date);

        // Do not display prices/FULL text for past dates or today if past cutoff
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        let isPastDate = checkDate < today;
        let isPastCutoff = false;
        
        if (!isAdmin && checkDate.getTime() === today.getTime()) {
            if (tourType === 'Midnight Plan') {
                if (checkDate.getDay() === 0 && now.getHours() >= 19) isPastCutoff = true;
                if (checkDate.getDay() !== 0 && (now.getHours() > 20 || (now.getHours() === 20 && now.getMinutes() >= 30))) isPastCutoff = true;
            }
            if (tourType !== 'Midnight Plan' && now.getHours() >= 12) isPastCutoff = true;
        }
        
        // Hide prices entirely if past date or if it's disabled due to wrong day of week
        let hidePrices = isPastDate;
        if (tourType === 'Midnight Plan' && !isFriSatSun) hidePrices = true;
        if (tourType === 'Sunday Morning Plan' && !isSun) hidePrices = true;

        const isSelected = selectedDate &&
            date.getDate() === selectedDate.getDate() &&
            date.getMonth() === selectedDate.getMonth() &&
            date.getFullYear() === selectedDate.getFullYear();

        const canClick = isAdmin || !isDisabled;

        days.push(
            <div
                key={d}
                className={`calendar-day ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''} ${isFull ? 'fully-booked' : ''}`}
                onClick={() => {
                    if (canClick) {
                        setShowClosedMessage(false);
                        onDateSelect(date, slotData);
                    } else if (isPastCutoff) {
                        setShowClosedMessage(true);
                    } else {
                        setShowClosedMessage(false);
                    }
                }}
            >
                <span className="day-number">{d}</span>
                <div className="day-content">
                    {/* Price Display */}
                    {!hidePrices && (
                        <div className="price-display-container-fix">
                            {isPastCutoff ? (
                                <span className="price-text-mobile-fix" style={{ color: '#c62828', fontWeight: 'bold' }}>
                                    DM us
                                </span>
                            ) : (
                                <span className="price-text-mobile-fix" style={{ 
                                    color: tourType === 'Midnight Plan' ? '#9c27b0' : (tourType === 'Sunday Morning Plan' ? '#e65100' : '#E60012'),
                                    fontWeight: 'bold',
                                    fontSize: tourType === 'Sunday Morning Plan' ? '0.85em' : '1em'
                                }}>
                                    {isFull ? 'FULL' : `¥${price.toLocaleString()}`}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    const nextMonth = () => {
        setCurrentViewDate(new Date(year, month + 1));
    };

    const prevMonth = () => {
        setCurrentViewDate(new Date(year, month - 1));
    };

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const currentActualDate = new Date();
    const currentActualYear = currentActualDate.getFullYear();
    const currentActualMonth = currentActualDate.getMonth();

    const isPrevDisabled = year === currentActualYear && month <= currentActualMonth;

    return (
        <div className="calendar-container">
            {/* Legend (Removed since colors are now self-explanatory based on the selected plan, 
                and we only show one price at a time.) */}

            {/* Same-Day Booking Closed Message */}
            {showClosedMessage && (
                <div style={{
                    background: '#ffebee',
                    border: '1px solid #ffcdd2',
                    color: '#c62828',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: '0.95rem'
                }}>
                    Today's web bookings are now closed.<br/>
                    <a href="https://www.instagram.com/daikoku_hunters/" target="_blank" rel="noopener noreferrer" style={{color: '#c62828', textDecoration: 'underline'}}>
                        Please DM us on Instagram
                    </a> for same-day availability!
                </div>
            )}

            <div className="calendar-header">
                <button 
                    onClick={prevMonth} 
                    className="nav-btn" 
                    disabled={isPrevDisabled}
                    style={{ opacity: isPrevDisabled ? 0.3 : 1, cursor: isPrevDisabled ? 'not-allowed' : 'pointer' }}
                >
                    &lt;
                </button>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <select 
                        value={month} 
                        onChange={(e) => setCurrentViewDate(new Date(year, parseInt(e.target.value), 1))}
                        style={{
                            padding: '8px 12px',
                            fontSize: '1.2rem',
                            fontWeight: '600',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            backgroundColor: '#fff',
                            color: '#333',
                            cursor: 'pointer',
                            outline: 'none'
                        }}
                    >
                        {monthNames.map((name, idx) => (
                            <option 
                                key={idx} 
                                value={idx} 
                                disabled={year === currentActualYear && idx < currentActualMonth}
                            >
                                {name}
                            </option>
                        ))}
                    </select>
                    
                    <select 
                        value={year} 
                        onChange={(e) => setCurrentViewDate(new Date(parseInt(e.target.value), month, 1))}
                        style={{
                            padding: '8px 12px',
                            fontSize: '1.2rem',
                            fontWeight: '600',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            backgroundColor: '#fff',
                            color: '#333',
                            cursor: 'pointer',
                            outline: 'none'
                        }}
                    >
                        {/* Show current year and next year (2 years total) */}
                        {[0, 1].map(offset => {
                            const y = new Date().getFullYear() + offset;
                            return <option key={y} value={y}>{y}</option>;
                        })}
                    </select>
                </div>
                <button onClick={nextMonth} className="nav-btn">&gt;</button>
            </div>
            <div className="calendar-grid">
                <div className="weekday">Sun</div>
                <div className="weekday">Mon</div>
                <div className="weekday">Tue</div>
                <div className="weekday">Wed</div>
                <div className="weekday">Thu</div>
                <div className="weekday">Fri</div>
                <div className="weekday">Sat</div>
                {days}
            </div>
            <div style={{ marginTop: '1.5rem', textAlign: 'left', fontSize: '0.9rem', color: '#666' }}>
                <p>Even if it shows FULL, we might be able to arrange a spot.<br />For special custom plans or large groups, please DM us on Instagram!</p>
            </div>
        </div>
    );
};

export default Calendar;
