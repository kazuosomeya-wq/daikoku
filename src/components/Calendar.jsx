import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { getPriceForDate } from '../utils/pricing';
import './Calendar.css';

const Calendar = ({ personCount, selectedDate, onDateSelect, isAdmin = false, tourType = 'Daikoku Tour' }) => {
    const [currentViewDate, setCurrentViewDate] = useState(selectedDate || new Date());
    const [availability, setAvailability] = useState({}); // { "YYYY-MM-DD": { slots: number, umihotaru: number } }

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
            if (tourType === 'Umihotaru Tour') {
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

        const slots = getRemainingSlots(dateString);

        // Check Firestore availability
        // If defined and slots <= 0, it's disabled (fully booked)
        if (slots !== undefined && slots <= 0) {
            return true;
        }

        // Disable past dates
        if (checkDate < today) {
            return true;
        }

        // Disable today if it's past 15:00 (3 PM)
        // (Unless we are admin - admins might want to edit today)
        if (!isAdmin && checkDate.getTime() === today.getTime()) {
            return now.getHours() >= 15;
        }

        return false;
    };

    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d);
        // Calculate prices separately
        const daikokuPrice = getPriceForDate(date, personCount, 'Daikoku Tour');
        const umihotaruPrice = getPriceForDate(date, personCount, 'Umihotaru Tour');

        const isDisabled = isDateDisabled(date);

        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const remainingSlots = getRemainingSlots(dateString);

        // Data to pass back to parent
        const slotData = availability[dateString] || {};

        const isSelected = selectedDate &&
            date.getDate() === selectedDate.getDate() &&
            date.getMonth() === selectedDate.getMonth() &&
            date.getFullYear() === selectedDate.getFullYear();

        const canClick = isAdmin || !isDisabled;

        const isUmihotaruDay = date.getDay() === 5 || date.getDay() === 6;

        days.push(
            <div
                key={d}
                className={`calendar-day ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''} ${remainingSlots === 0 ? 'fully-booked' : ''}`}
                onClick={() => canClick && onDateSelect(date, slotData)}
            >
                <span className="day-number">{d}</span>
                <div className="day-content">
                    {/* Price Display */}
                    {!isDisabled && (
                        <div className="price-display-container-fix">
                            {/* Daikoku Price (Red) */}
                            <span className="price-text-mobile-fix price-daikoku-fix">
                                ¥{daikokuPrice.toLocaleString()}
                            </span>

                            {/* Umihotaru Price (Blue) - Fri/Sat only */}
                            {isUmihotaruDay && (
                                <span className="price-text-mobile-fix price-umihotaru-fix">
                                    ¥{umihotaruPrice.toLocaleString()}
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

    return (
        <div className="calendar-container">
            {/* Legend */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '1rem', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '10px', height: '10px', background: '#E60012', borderRadius: '50%', display: 'inline-block' }}></span>
                    <span style={{ color: '#333' }}>Daikoku Tour</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '10px', height: '10px', background: '#0066cc', borderRadius: '50%', display: 'inline-block' }}></span>
                    <span style={{ color: '#333' }}>Umihotaru Tour</span>
                </div>
            </div>

            <div className="calendar-header">
                <button onClick={prevMonth} className="nav-btn">&lt;</button>
                <h2 className="month-title">{monthNames[month]} {year}</h2>
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
