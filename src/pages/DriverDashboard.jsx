import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot, setDoc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './DriverDashboard.css'; // We'll create a simple CSS file for this too

const DriverDashboard = () => {
    const { vehicleId } = useParams();
    const [currentViewDate, setCurrentViewDate] = useState(new Date());
    const [availableDates, setAvailableDates] = useState([]);
    const [loading, setLoading] = useState(true);

    // Vehicle Names Mapping
    const vehicleNames = {
        'vehicle1': 'R34 - Bayside Blue',
        'vehicle2': 'R34 - 600hp Bayside Blue',
        'vehicle3': 'R32 - GTR',
        'vehicle4': 'Supra - Purple'
    };

    const vehicleName = vehicleNames[vehicleId] || vehicleId;

    useEffect(() => {
        if (!vehicleId) return;

        const docRef = doc(db, "vehicle_availability", vehicleId);

        // Listen for real-time updates
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                setAvailableDates(docSnap.data().availableDates || []);
            } else {
                setAvailableDates([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [vehicleId]);

    const toggleDate = async (dateString) => {
        const docRef = doc(db, "vehicle_availability", vehicleId);
        const isOpen = availableDates.includes(dateString);

        try {
            // Check if doc exists first, if not create it
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                // If initializing, we add the date (Open it)
                await setDoc(docRef, {
                    availableDates: [dateString]
                });
            } else {
                if (isOpen) {
                    // It was Open, so we remove it (Block it)
                    await updateDoc(docRef, {
                        availableDates: arrayRemove(dateString)
                    });
                } else {
                    // It was Blocked, so we add it (Open it)
                    await updateDoc(docRef, {
                        availableDates: arrayUnion(dateString)
                    });
                }
            }
        } catch (error) {
            console.error("Error updating availability:", error);
            alert("Failed to update status. Please try again.");
        }
    };

    // Calendar Render Logic
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
        days.push(<div key={`empty-${i}`} className="driver-calendar-day empty"></div>);
    }

    // Days
    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d);
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const isOpen = availableDates.includes(dateString);

        // Check if past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isPast = date < today;

        days.push(
            <div
                key={d}
                className={`driver-calendar-day ${isOpen ? 'open' : 'blocked'} ${isPast ? 'past' : ''}`}
                onClick={() => !isPast && toggleDate(dateString)}
            >
                <span className="day-number">{d}</span>
                <div className="status-text">
                    {isOpen ? 'OPEN' : 'BLOCKED'}
                </div>
            </div>
        );
    }

    const nextMonth = () => setCurrentViewDate(new Date(year, month + 1));
    const prevMonth = () => setCurrentViewDate(new Date(year, month - 1));

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    if (loading) return <div className="loading">Loading calendar...</div>;

    return (
        <div className="driver-dashboard">
            <header className="driver-header">
                <h1>Driver Portal</h1>
                <div className="vehicle-badge">{vehicleName}</div>
                <p>Tap a date to block/unblock Availability</p>
            </header>

            <div className="calendar-controls">
                <button onClick={prevMonth}>&lt;</button>
                <h2>{monthNames[month]} {year}</h2>
                <button onClick={nextMonth}>&gt;</button>
            </div>

            <div className="driver-calendar-grid">
                <div className="weekday">Sun</div>
                <div className="weekday">Mon</div>
                <div className="weekday">Tue</div>
                <div className="weekday">Wed</div>
                <div className="weekday">Thu</div>
                <div className="weekday">Fri</div>
                <div className="weekday">Sat</div>
                {days}
            </div>

            <footer className="driver-footer">
                <div className="legend">
                    <span className="legend-item"><span className="dot open"></span> Open</span>
                    <span className="legend-item"><span className="dot blocked"></span> Blocked</span>
                </div>
            </footer>
        </div>
    );
};

export default DriverDashboard;
