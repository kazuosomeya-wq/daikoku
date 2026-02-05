import React, { useState } from 'react';
import { getPriceForDate } from '../utils/pricing';
import './Calendar.css';

const Calendar = ({ personCount, selectedDate, onDateSelect }) => {
    // Initialize with selectedDate if available, otherwise current date
    const [currentViewDate, setCurrentViewDate] = useState(selectedDate || new Date());

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

        // Disable past dates
        if (checkDate < today) {
            return true;
        }

        // Disable today if it's past 1:00 AM
        if (checkDate.getTime() === today.getTime()) {
            return now.getHours() >= 1;
        }

        return false;
    };

    // Days
    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d);
        const price = getPriceForDate(date, personCount);
        const isDisabled = isDateDisabled(date);
        const isSelected = selectedDate &&
            date.getDate() === selectedDate.getDate() &&
            date.getMonth() === selectedDate.getMonth() &&
            date.getFullYear() === selectedDate.getFullYear();

        days.push(
            <div
                key={d}
                className={`calendar-day ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                onClick={() => !isDisabled && onDateSelect(date)}
            >
                <span className="day-number">{d}</span>
                <span className="day-price">
                    {isDisabled ? '-' : (price > 0 ? `¥${price.toLocaleString()}` : 'Ask')}
                </span>
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
        </div>
    );
};

export default Calendar;
