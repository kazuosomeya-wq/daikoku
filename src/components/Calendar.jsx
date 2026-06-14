import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { getPriceForDate } from '../utils/pricing';
import { isCalendarCutoffPassed } from '../utils/cutoffs';
import './Calendar.css';

const getFakeFull = (date, tourType) => {
    const isFri = date.getDay() === 5;
    const isSat = date.getDay() === 6;
    const isSun = date.getDay() === 0;
    const isSunToThuStrict = (date.getDay() >= 1 && date.getDay() <= 4) || date.getDay() === 0;
    
    let validDay = true;
    if (tourType === 'Midnight Plan' && !(isFri || isSat || isSun)) validDay = false;
    if (tourType === 'Sunday Morning Plan' && !isSun) validDay = false;
    if (tourType === 'City Tour' && !isSunToThuStrict) validDay = false;

    if (!validDay) return false;

    const d = date.getDate();
    const weekNum = Math.floor((d - 1) / 7); // 0, 1, 2, 3, 4
    
    // Guarantee exactly 3 FULLs per month for Fri, and ALL for Sat
    if (isSat) {
        return true; // 100% FULL on Saturdays
    } else if (isFri) {
        const patterns = [
            [0, 1, 3], // 1st, 2nd, 4th week
            [0, 2, 3], // 1st, 3rd, 4th week
            [1, 2, 3]  // 2nd, 3rd, 4th week
        ];
        const pIndex = date.getMonth() % 3;
        return patterns[pIndex].includes(weekNum);
    }

    let threshold = 0;
    if (isSun) threshold = 5; // 50% chance
    else threshold = 6; // 60% chance for Mon-Thu (increased from 40%)

    const m = date.getMonth();
    const y = date.getFullYear();
    
    // Use Math.sin for better deterministic scattering
    const seed = y * 10000 + m * 100 + d;
    const pseudoRandom = Math.floor(Math.abs(Math.sin(seed)) * 10);
    
    return pseudoRandom < threshold;
};
const Calendar = ({ personCount = 1, carCount = 1, selectedDate, onDateSelect, onPastCutoffClick, isAdmin = false, tourType = 'Standard Plan', globalSettings = {} }) => {
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

        // Time restrictions (Past cutoff time)
        if (isCalendarCutoffPassed(tourType, checkDate, globalSettings)) {
            isAvailable = false;
        }

        // Day of week restrictions
        if (tourType === 'Midnight Plan' && !isFriSatSun) isAvailable = false;
        if (tourType === 'Sunday Morning Plan' && !isSun) isAvailable = false;
        const isSunToThu = (checkDate.getDay() >= 1 && checkDate.getDay() <= 4) || checkDate.getDay() === 0;
        if (tourType === 'City Tour' && !isSunToThu) isAvailable = false;

        return !isAvailable;
    };
    // Previous month's trailing days
    const prevMonthDaysTotal = getDaysInMonth(year, month - 1);
    for (let i = 0; i < firstDay; i++) {
        const d = prevMonthDaysTotal - firstDay + i + 1;
        const prevMonthDate = new Date(year, month - 1, d);
        const price = getPriceForDate(prevMonthDate, personCount, carCount, tourType);

        const pmYear = prevMonthDate.getFullYear();
        const pmMonth = prevMonthDate.getMonth();
        const dateString = `${pmYear}-${String(pmMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const slotData = availability[dateString] || {};

        let isFull = false;
        if (tourType === 'Midnight Plan') {
            isFull = slotData.umihotaru !== undefined && slotData.umihotaru <= 0;
        } else {
            isFull = slotData.slots !== undefined && slotData.slots <= 0;
        }

        const isFriSat = prevMonthDate.getDay() === 5 || prevMonthDate.getDay() === 6;
        const isFriSatSun = prevMonthDate.getDay() === 5 || prevMonthDate.getDay() === 6 || prevMonthDate.getDay() === 0;
        const isSun = prevMonthDate.getDay() === 0;

        const isDisabled = isDateDisabled(prevMonthDate);

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const checkDate = new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth(), prevMonthDate.getDate());
        let isPastDate = checkDate < today;
        let isPastCutoff = false;
        
        if (isCalendarCutoffPassed(tourType, checkDate, globalSettings)) {
            isPastCutoff = true;
        }
        
        let hidePrices = isPastDate;
        if (tourType === 'Midnight Plan' && !isFriSatSun) hidePrices = true;
        if (tourType === 'Sunday Morning Plan' && !isSun) hidePrices = true;
        const isSunToThuStrict = (prevMonthDate.getDay() >= 1 && prevMonthDate.getDay() <= 4) || prevMonthDate.getDay() === 0;
        if (tourType === 'City Tour' && !isSunToThuStrict) hidePrices = true;

        const isFakeFull = isPastDate && getFakeFull(prevMonthDate, tourType);

        const isSelected = selectedDate &&
            prevMonthDate.getDate() === selectedDate.getDate() &&
            prevMonthDate.getMonth() === selectedDate.getMonth() &&
            prevMonthDate.getFullYear() === selectedDate.getFullYear();

        const canClick = isAdmin || !isDisabled;

        days.push(
            <div
                key={`prev-${d}`}
                className={`calendar-day prev-month ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''} ${isFull ? 'fully-booked' : ''}`}
                style={{ backgroundColor: '#fbfbfb' }}
                onClick={() => {
                    if (canClick) {
                        setShowClosedMessage(false);
                        onDateSelect(prevMonthDate, slotData);
                        setCurrentViewDate(new Date(pmYear, pmMonth));
                    } else if (isPastCutoff) {
                        if (onPastCutoffClick && onPastCutoffClick(prevMonthDate, slotData)) {
                            setShowClosedMessage(false);
                            return;
                        }
                        setShowClosedMessage(true);
                    } else {
                        setShowClosedMessage(false);
                    }
                }}
            >
                <span className="day-number" style={{ color: '#bbb' }}>{d}</span>
                <div className="day-content">
                    {/* Price Display */}
                    {(!hidePrices || isFakeFull) && (
                        <div className="price-display-container-fix">
                            {isFakeFull ? (
                                <span className="price-text-mobile-fix" style={{ color: '#aaa', fontWeight: 'bold' }}>
                                    FULL
                                </span>
                            ) : isPastCutoff ? (
                                <span className="price-text-mobile-fix" style={{ color: '#c62828', fontWeight: 'bold', opacity: 0.7 }}>
                                    DM us
                                </span>
                            ) : (
                                <span className="price-text-mobile-fix" style={{ 
                                    color: tourType === 'Midnight Plan' ? '#9c27b0' : (tourType === 'City Tour' ? '#009688' : (tourType === 'Sunday Morning Plan' ? '#e65100' : '#E60012')),
                                    fontWeight: 'bold',
                                    fontSize: tourType === 'Sunday Morning Plan' ? '0.85em' : '1em',
                                    opacity: 0.7
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
        
        if (isCalendarCutoffPassed(tourType, checkDate, globalSettings)) {
            isPastCutoff = true;
        }
        
        let hidePrices = isPastDate;
        if (tourType === 'Midnight Plan' && !isFriSatSun) hidePrices = true;
        if (tourType === 'Sunday Morning Plan' && !isSun) hidePrices = true;
        const isSunToThuStrict = (date.getDay() >= 1 && date.getDay() <= 4) || date.getDay() === 0;
        if (tourType === 'City Tour' && !isSunToThuStrict) hidePrices = true;

        const isFakeFull = isPastDate && getFakeFull(date, tourType);

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
                        if (onPastCutoffClick && onPastCutoffClick(date, slotData)) {
                            setShowClosedMessage(false);
                            return;
                        }
                        setShowClosedMessage(true);
                    } else {
                        setShowClosedMessage(false);
                    }
                }}
            >
                <span className="day-number">{d}</span>
                <div className="day-content">
                    {/* Price Display */}
                    {(!hidePrices || isFakeFull) && (
                        <div className="price-display-container-fix">
                            {isFakeFull ? (
                                <span className="price-text-mobile-fix" style={{ color: '#aaa', fontWeight: 'bold' }}>
                                    FULL
                                </span>
                            ) : isPastCutoff ? (
                                <span className="price-text-mobile-fix" style={{ color: '#c62828', fontWeight: 'bold' }}>
                                    DM us
                                </span>
                            ) : (
                                <span className="price-text-mobile-fix" style={{ 
                                    color: tourType === 'Midnight Plan' ? '#9c27b0' : (tourType === 'City Tour' ? '#009688' : (tourType === 'Sunday Morning Plan' ? '#e65100' : '#E60012')),
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

    const totalCells = firstDay + daysInMonth;
    const remainingCells = (7 - (totalCells % 7)) % 7;

    for (let d = 1; d <= remainingCells; d++) {
        const nextMonthDate = new Date(year, month + 1, d);
        const price = getPriceForDate(nextMonthDate, personCount, carCount, tourType);

        const nmYear = nextMonthDate.getFullYear();
        const nmMonth = nextMonthDate.getMonth();
        const dateString = `${nmYear}-${String(nmMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const slotData = availability[dateString] || {};

        let isFull = false;
        if (tourType === 'Midnight Plan') {
            isFull = slotData.umihotaru !== undefined && slotData.umihotaru <= 0;
        } else {
            isFull = slotData.slots !== undefined && slotData.slots <= 0;
        }

        const isFriSat = nextMonthDate.getDay() === 5 || nextMonthDate.getDay() === 6;
        const isFriSatSun = nextMonthDate.getDay() === 5 || nextMonthDate.getDay() === 6 || nextMonthDate.getDay() === 0;
        const isSun = nextMonthDate.getDay() === 0;

        const isDisabled = isDateDisabled(nextMonthDate);

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const checkDate = new Date(nextMonthDate.getFullYear(), nextMonthDate.getMonth(), nextMonthDate.getDate());
        let isPastDate = checkDate < today;
        let isPastCutoff = false;
        
        if (isCalendarCutoffPassed(tourType, checkDate, globalSettings)) {
            isPastCutoff = true;
        }
        
        let hidePrices = isPastDate;
        if (tourType === 'Midnight Plan' && !isFriSatSun) hidePrices = true;
        if (tourType === 'Sunday Morning Plan' && !isSun) hidePrices = true;
        const isSunToThuStrict = (nextMonthDate.getDay() >= 1 && nextMonthDate.getDay() <= 4) || nextMonthDate.getDay() === 0;
        if (tourType === 'City Tour' && !isSunToThuStrict) hidePrices = true;

        const isFakeFull = isPastDate && getFakeFull(nextMonthDate, tourType);

        const isSelected = selectedDate &&
            nextMonthDate.getDate() === selectedDate.getDate() &&
            nextMonthDate.getMonth() === selectedDate.getMonth() &&
            nextMonthDate.getFullYear() === selectedDate.getFullYear();

        const canClick = isAdmin || !isDisabled;

        days.push(
            <div
                key={`next-${d}`}
                className={`calendar-day next-month ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''} ${isFull ? 'fully-booked' : ''}`}
                style={{ backgroundColor: '#fbfbfb' }}
                onClick={() => {
                    if (canClick) {
                        setShowClosedMessage(false);
                        onDateSelect(nextMonthDate, slotData);
                        // Also automatically switch the calendar to the next month
                        setCurrentViewDate(new Date(nmYear, nmMonth));
                    } else if (isPastCutoff) {
                        if (onPastCutoffClick && onPastCutoffClick(nextMonthDate, slotData)) {
                            setShowClosedMessage(false);
                            return;
                        }
                        setShowClosedMessage(true);
                    } else {
                        setShowClosedMessage(false);
                    }
                }}
            >
                <span className="day-number" style={{ color: '#bbb' }}>{d}</span>
                <div className="day-content">
                    {/* Price Display */}
                    {(!hidePrices || isFakeFull) && (
                        <div className="price-display-container-fix">
                            {isFakeFull ? (
                                <span className="price-text-mobile-fix" style={{ color: '#aaa', fontWeight: 'bold' }}>
                                    FULL
                                </span>
                            ) : isPastCutoff ? (
                                <span className="price-text-mobile-fix" style={{ color: '#c62828', fontWeight: 'bold', opacity: 0.7 }}>
                                    DM us
                                </span>
                            ) : (
                                <span className="price-text-mobile-fix" style={{ 
                                    color: tourType === 'Midnight Plan' ? '#9c27b0' : (tourType === 'City Tour' ? '#009688' : (tourType === 'Sunday Morning Plan' ? '#e65100' : '#E60012')),
                                    fontWeight: 'bold',
                                    fontSize: tourType === 'Sunday Morning Plan' ? '0.85em' : '1em',
                                    opacity: 0.7
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

            <div className="booking-calendar-header">
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
