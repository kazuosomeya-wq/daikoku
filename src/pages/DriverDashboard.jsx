import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot, setDoc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './DriverDashboard.css';

const DriverDashboard = () => {
    const { vehicleId } = useParams();
    const [currentViewDate, setCurrentViewDate] = useState(new Date());
    const [activeTab, setActiveTab] = useState('daikoku'); // 'daikoku' | 'umihotaru'

    // Store availability for both plans
    const [availability, setAvailability] = useState({
        daikoku: [],
        umihotaru: []
    });

    const [loading, setLoading] = useState(true);
    const [vehicleData, setVehicleData] = useState(null);
    const [driverEmail, setDriverEmail] = useState('');
    const [isSavingEmail, setIsSavingEmail] = useState(false);

    useEffect(() => {
        if (!vehicleId) return;

        // 1. Fetch Vehicle Details
        const fetchVehicleDetails = async () => {
            try {
                const vehicleRef = doc(db, "vehicles", vehicleId);
                const vehicleSnap = await getDoc(vehicleRef);
                if (vehicleSnap.exists()) {
                    const vData = vehicleSnap.data();
                    setVehicleData(vData);
                    if (vData.driverEmail) setDriverEmail(vData.driverEmail);
                } else {
                    setVehicleData({ name: `Vehicle ${vehicleId}`, subtitle: '' });
                }
            } catch (error) {
                console.error("Error fetching vehicle details:", error);
            }
        };

        fetchVehicleDetails();

        // 2. Listen for Availability
        const availabilityRef = doc(db, "vehicle_availability", vehicleId);
        const unsubscribe = onSnapshot(availabilityRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setAvailability({
                    daikoku: data.daikokuDates || [],
                    umihotaru: data.umihotaruDates || []
                });
            } else {
                setAvailability({ daikoku: [], umihotaru: [] });
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [vehicleId]);

    const handleSaveEmail = async () => {
        setIsSavingEmail(true);
        try {
            const vehicleRef = doc(db, "vehicles", vehicleId);
            await updateDoc(vehicleRef, {
                driverEmail: driverEmail
            });
            alert("Email saved! Notifications will be sent here.");
        } catch (error) {
            console.error("Error saving email:", error);
            alert("Failed to save email.");
        }
        setIsSavingEmail(false);
    };

    const toggleDate = async (dateString) => {
        const docRef = doc(db, "vehicle_availability", vehicleId);
        // Determine which list to update based on active tab
        const targetField = activeTab === 'daikoku' ? 'daikokuDates' : 'umihotaruDates';
        const currentList = availability[activeTab];
        const isOpen = currentList.includes(dateString);

        try {
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                // If initializing, create doc with the date in the target list
                await setDoc(docRef, {
                    [targetField]: [dateString]
                });
            } else {
                if (isOpen) {
                    // It was Open, so we remove it (Block it)
                    await updateDoc(docRef, {
                        [targetField]: arrayRemove(dateString)
                    });
                } else {
                    // It was Blocked, so we add it (Open it)
                    await updateDoc(docRef, {
                        [targetField]: arrayUnion(dateString)
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

        // Check availability for the ACTIVE tab
        const isOpen = availability[activeTab]?.includes(dateString);

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
        <div className="driver-dashboard" style={{ border: '5px solid red', padding: '10px' }}>
            <header className="driver-header">
                <h1>Driver Portal v2</h1>
                <div className="vehicle-badge">
                    {vehicleData ? vehicleData.name : 'Loading...'}
                </div>
                {vehicleData && vehicleData.subtitle && (
                    <p style={{ color: '#aaa', margin: '0.2rem 0' }}>{vehicleData.subtitle}</p>
                )}
            </header>

            <div style={{ background: '#f3f4f6', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', border: '2px solid #ddd' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#111', fontWeight: 'bold' }}>📩 Notification Settings</h3>
                    <span style={{ fontSize: '0.75rem', color: '#444', background: '#e5e7eb', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>Admin / Driver</span>
                </div>

                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold' }}>Destination Email:</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                        type="email"
                        value={driverEmail}
                        onChange={(e) => setDriverEmail(e.target.value)}
                        placeholder="example@driver.com"
                        style={{ flex: 1, padding: '0.8rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem' }}
                    />
                    <button
                        onClick={handleSaveEmail}
                        disabled={isSavingEmail}
                        style={{
                            padding: '0 1.5rem',
                            background: '#222',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: isSavingEmail ? 'not-allowed' : 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: 'bold'
                        }}
                    >
                        {isSavingEmail ? 'Saving...' : 'Save Email'}
                    </button>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#555', marginTop: '0.8rem', marginBottom: 0 }}>
                    ℹ️ Booking confirmation emails for this vehicle will be sent to this address.
                </p>
            </div>

            <div className="tabs-container">
                <button
                    className={`tab-button ${activeTab === 'daikoku' ? 'active' : ''}`}
                    onClick={() => setActiveTab('daikoku')}
                >
                    Daikoku Plan
                </button>
                <button
                    className={`tab-button ${activeTab === 'umihotaru' ? 'active' : ''}`}
                    onClick={() => setActiveTab('umihotaru')}
                >
                    Umihotaru Plan
                </button>
            </div>

            <div className="calendar-controls">
                <button onClick={prevMonth}>&lt;</button>
                <h2>{monthNames[month]} {year}</h2>
                <button onClick={nextMonth}>&gt;</button>
            </div>

            <p style={{ textAlign: 'center', margin: '0.5rem 0', color: '#666' }}>
                Setting availability for: <strong>{activeTab === 'daikoku' ? 'Daikoku Tour' : 'Umihotaru Tour'}</strong>
            </p>

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
