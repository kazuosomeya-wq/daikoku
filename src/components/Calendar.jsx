import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { getPriceForDate } from '../utils/pricing';
import './Calendar.css';

const Calendar = ({ personCount, selectedDate, onDateSelect, isAdmin = false }) => {
    const [currentViewDate, setCurrentViewDate] = useState(selectedDate || new Date());
    const [availability, setAvailability] = useState({}); // { "YYYY-MM-DD": slots }

    useEffect(() => {
        // Listen to realtime updates from Firestore
        const unsubscribe = onSnapshot(collection(db, "availability"), (snapshot) => {
            const data = {};
            snapshot.forEach((doc) => {
                data[doc.id] = doc.data().slots;
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

    const isDateDisabled = (date) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        // Format YYYY-MM-DD
        const dateString = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;

        // Check Firestore availability
        // If defined and slots <= 0, it's disabled (fully booked)
        if (availability[dateString] !== undefined && availability[dateString] <= 0) {
            return true;
        }

        // Disable past dates
        if (checkDate < today) {
            return true;
        }

        // Disable today if it's past 1:00 AM
        // (Unless we are admin - admins might want to edit today)
        if (!isAdmin && checkDate.getTime() === today.getTime()) {
            return now.getHours() >= 1;
        }

        return false;
    };

    // Days
    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d);
        const price = getPriceForDate(date, personCount);
        const isDisabled = isDateDisabled(date);

        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const remainingSlots = availability[dateString];

        const isSelected = selectedDate &&
            date.getDate() === selectedDate.getDate() &&
            date.getMonth() === selectedDate.getMonth() &&
            date.getFullYear() === selectedDate.getFullYear();

        // Admin sees all dates as clickable to edit them, unless specialized logic
        // But for visual consistency we keep disabled style if 0 slots
        // We handle the click logic in the parent usually, or here.
        // For Admin, we want to allow clicking even if disabled (to unblock).

        const canClick = isAdmin || !isDisabled;

        days.push(
            <div
                key={d}
                className={`calendar-day ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''} ${remainingSlots === 0 ? 'fully-booked' : ''}`}
                onClick={() => canClick && onDateSelect(date)}
            >
                <span className="day-number">{d}</span>
                <div className="day-content">
                    {/* Status Text */}
                    {remainingSlots === 0 && <span style={{ color: 'red', fontWeight: 'bold', fontSize: '0.7rem', display: 'block' }}>FULL</span>}
                    {remainingSlots > 0 && remainingSlots <= 4 && (
                        <span style={{ color: '#E60012', fontSize: '0.65rem', display: 'block' }}>
                            {isAdmin ? `${remainingSlots} Left` : 'Last Spot'}
                        </span>
                    )}

                    {/* Price Display - Always show unless FULL or blocked/past */}
                    {(!isDisabled || remainingSlots > 0) && (
                        <span className="day-price" style={{ display: 'block', marginTop: '2px' }}>
                            {price > 0 ? `¥${price.toLocaleString()}` : 'Ask'}
                        </span>
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
