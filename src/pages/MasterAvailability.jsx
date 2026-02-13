import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import './MasterAvailability.css';

const MasterAvailability = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [activePlan, setActivePlan] = useState('daikoku'); // 'daikoku' | 'umihotaru'
    const [vehicles, setVehicles] = useState([]);
    const [availability, setAvailability] = useState({}); // { vehicleId: { daikoku: [], umihotaru: [] } }
    const [loading, setLoading] = useState(true);

    // Fetch Vehicles and Availability
    useEffect(() => {
        setLoading(true);

        const unsubVehicles = onSnapshot(query(collection(db, "vehicles"), orderBy("name")), (snapshot) => {
            const vList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setVehicles(vList);
        });

        const unsubAvailability = onSnapshot(collection(db, "vehicle_availability"), (snapshot) => {
            const data = {};
            snapshot.forEach(doc => {
                data[doc.id] = doc.data();
            });
            setAvailability(data);
            setLoading(false);
        });

        return () => {
            unsubVehicles();
            unsubAvailability();
        };
    }, []);

    // Custom Color Mapping
    const getVehicleColor = (nameOrSlug) => {
        const lower = nameOrSlug.toLowerCase();

        const colorMap = {
            'sakusaku': '#000000',      // Black
            '180': '#8B0000',           // Dark Red
            'r35': '#666666',           // Gray
            'red': '#DC2626',           // Red
            'crs': '#333333',           // Dark Gray
            'blue': '#2563EB',          // Blue
            'sion': '#1E3A8A',          // Dark Blue
            'silver r32': '#CCCCCC',    // Light Gray
            '600hp kae': '#FFD700',     // Gold
        };

        // Check for partial matches if exact key doesn't exist? 
        // User said "sakusaku", "180". Let's try to match if the string includes the key.
        for (const [key, color] of Object.entries(colorMap)) {
            if (lower.includes(key)) {
                return color;
            }
        }

        // Fallback to hash generation
        return stringToColor(nameOrSlug);
    };

    // Generate HSL color from string (Fallback)
    const stringToColor = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }

        let h = Math.abs(hash) % 360;
        // Avoid yellows/light greens (approx 40-170) which are hard to read with white text
        // If hue is in that range, shift it or darken it significantly.
        let s = 70;
        let l = 40; // Default darker

        if (h > 45 && h < 190) {
            // It's yellow/green/cyan range.
            // Shift towards Teal/Blue or Orange/Red to avoid the "washed out" look, or just darken a lot.
            // Let's darken significantly.
            l = 30;
            s = 85;
        }

        return `hsl(${h}, ${s}%, ${l}%)`;
    };

    // Calendar Helper
    const getCalendarDays = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        const daysArray = [];

        // Previous month filler
        const startDay = firstDayOfMonth.getDay(); // 0 (Sun) - 6 (Sat)
        for (let i = 0; i < startDay; i++) {
            const prevDate = new Date(year, month, -startDay + 1 + i);
            daysArray.push({ date: prevDate, isCurrentMonth: false });
        }

        // Current month
        for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
            daysArray.push({ date: new Date(year, month, i), isCurrentMonth: true });
        }

        // Next month filler (to complete the grid)
        const remaining = 42 - daysArray.length; // 6 rows * 7 days = 42
        for (let i = 1; i <= remaining; i++) {
            daysArray.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
        }

        return daysArray;
    };

    const calendarDays = getCalendarDays(currentDate);

    // Date Logic (Modified)
    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const isAvailable = (vehicleId, dateStr) => {
        const vehicleData = availability[vehicleId];
        if (!vehicleData) return false; // Default blocked if no data? Or Open? Usually default closed until opened.

        // Logic: The array contains "OPEN" dates usually? 
        // Wait, looking at DriverDashboard: 
        // "It was Open, so we remove it (Block it)" -> Array contains OPEN dates.

        const targetList = activePlan === 'daikoku' ? vehicleData.daikokuDates : vehicleData.umihotaruDates;
        return targetList?.includes(dateStr);
    };

    if (loading) return <div className="loading-container">Loading Master Schedule...</div>;

    // Filter Logic (Modified for badges)
    const getAvailableVehiclesForDate = (date) => {
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

        return vehicles.filter(v => {
            return isAvailable(v.id, dateStr);
        }).map(v => {
            const displayName = v.slug || v.name;
            const bgColor = getVehicleColor(displayName);

            // Determine text color based on background brightness
            // Simple check: if hex is light, use black text.
            let textColor = 'white';
            if (bgColor === '#CCCCCC' || bgColor === '#FFD700') { // Specific check for Light Gray or Gold
                textColor = 'black';
            }

            return {
                ...v,
                displayName,
                color: bgColor,
                textColor
            };
        });
    };

    return (
        <div className="master-availability-container">
            <header className="master-header">
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#111' }}>Vehicle Master Schedule</h1>
                    <p style={{ margin: '5px 0 0', color: '#666' }}>Calendar View</p>
                </div>

                <div className="header-controls">
                    <div className="plan-toggle">
                        <button
                            className={activePlan === 'daikoku' ? 'active' : ''}
                            onClick={() => setActivePlan('daikoku')}
                        >
                            Daikoku
                        </button>
                        <button
                            className={activePlan === 'umihotaru' ? 'active' : ''}
                            onClick={() => setActivePlan('umihotaru')}
                        >
                            Umihotaru
                        </button>
                    </div>

                    <div className="month-nav">
                        <button onClick={handlePrevMonth}>&lt;</button>
                        <h2>{monthName}</h2>
                        <button onClick={handleNextMonth}>&gt;</button>
                    </div>
                </div>
            </header>

            <div className="schedule-grid-wrapper">
                <div className="calendar-header-row">
                    <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                </div>
                <div className="calendar-grid-body">
                    {calendarDays.map((dayObj, index) => {
                        const { date, isCurrentMonth } = dayObj;
                        const availableVehicles = getAvailableVehiclesForDate(date);
                        const isToday = new Date().toDateString() === date.toDateString();

                        return (
                            <div key={index} className={`calendar-day-cell ${!isCurrentMonth ? 'other-month' : ''}`}>
                                <span className={`day-number ${isToday ? 'today-highlight' : ''}`}>
                                    {date.getDate()}
                                </span>
                                <div className="vehicle-badges-list">
                                    {availableVehicles.map(v => (
                                        <div
                                            key={v.id}
                                            className="calendar-badge"
                                            style={{ backgroundColor: v.color, color: v.textColor }}
                                            title={v.name}
                                        >
                                            {v.displayName}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default MasterAvailability;
