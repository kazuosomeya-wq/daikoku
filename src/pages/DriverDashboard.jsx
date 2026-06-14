import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot, setDoc, updateDoc, arrayUnion, arrayRemove, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
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
    const [driverBookings, setDriverBookings] = useState([]);

    // Resolved ID (Actual Document ID)
    const [resolvedVehicleId, setResolvedVehicleId] = useState(null);

    // 1. Resolve Slug to ID
    useEffect(() => {
        
        const resolveVehicle = async () => {
            if (!vehicleId) return;
            setLoading(true);

            try {
                let foundId = null;
                let foundData = null;

                if (vehicleId === 'random-cars' || vehicleId === 'random-any') {
                    foundId = vehicleId; // Keep the same ID for query matching
                    foundData = { name: 'Random Car', subtitle: 'Assigned dynamically' };
                } else if (vehicleId === 'none' || vehicleId === 'random-r34') {
                    // Just in case it's not in DB
                    foundId = 'random-r34';
                    foundData = { name: 'Random R34', subtitle: 'Random R34 assignment' };
                    // Still try to fetch from DB for random-r34 to get emails
                    const q2 = query(collection(db, "vehicles"), where("slug", "==", "random-r34"));
                    const snap2 = await getDocs(q2);
                    if (!snap2.empty) {
                        foundId = snap2.docs[0].id;
                        foundData = snap2.docs[0].data();
                    } else {
                        // Fallback to check if a 'none' doc exists for legacy reasons
                        const ref2 = doc(db, "vehicles", "none");
                        const ds2 = await getDoc(ref2);
                        if (ds2.exists()) {
                            foundId = 'none';
                            foundData = ds2.data();
                        }
                    }
                } else {
                    // A. Check if vehicleId matches a 'slug' field
                    const q = query(collection(db, "vehicles"), where("slug", "==", vehicleId));
                    const querySnapshot = await getDocs(q);

                    if (!querySnapshot.empty) {
                        const docSnap = querySnapshot.docs[0];
                        foundId = docSnap.id;
                        foundData = docSnap.data();
                    } else {
                        // B. Fallback: Check if it's a direct Doc ID
                        const docRef = doc(db, "vehicles", vehicleId);
                        const docSnap = await getDoc(docRef);
                        if (docSnap.exists()) {
                            foundId = docSnap.id;
                            foundData = docSnap.data();
                        }
                    }
                }

                if (foundId && foundData) {
                    setResolvedVehicleId(foundId);
                    setVehicleData(foundData);
                    if (foundData.driverEmail) setDriverEmail(foundData.driverEmail);
                } else {
                    console.error("Vehicle not found for:", vehicleId);
                    setVehicleData({ name: 'Not Found', subtitle: 'Please check the URL' });
                    setResolvedVehicleId(null);
                }
            } catch (error) {
                console.error("Error resolving vehicle:", error);
                setVehicleData({ name: 'Error', subtitle: 'Could not load vehicle' });
            }
            // We keep loading true until listener attaches in next effect? 
            // Better to set false here if resolved failed, but if resolved, wait for listener?
            // Let's set false here just in case, listener will update again.
            if (!resolvedVehicleId) setLoading(false);
        };

        resolveVehicle();
    }, [vehicleId]);

    // 2. Listen for Availability & Updates using Resolved ID
    useEffect(() => {
        if (!resolvedVehicleId) return;

        // Vehicle Data Listener (for email/name updates)
        const vehicleUnsub = onSnapshot(doc(db, "vehicles", resolvedVehicleId), (docSnap) => {
            if (docSnap.exists()) {
                const vData = docSnap.data();
                setVehicleData(vData);
                if (vData.driverEmail) setDriverEmail(vData.driverEmail);
            }
        });

        // Availability Listener
        const availabilityRef = doc(db, "vehicle_availability", resolvedVehicleId);
        const availabilityUnsub = onSnapshot(availabilityRef, (docSnap) => {
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

        // Bookings Listener
        // We fetch all bookings and filter client-side because vehicleId might be in `vehicleId` or `options.selectedVehicle`
        const bookingsQ = query(collection(db, "bookings"));
        const bookingsUnsub = onSnapshot(bookingsQ, (snapshot) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Start of today

            const bList = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(b => {
                    const isCorrectVehicle = b.vehicleId === resolvedVehicleId || b.options?.selectedVehicle === resolvedVehicleId || b.options?.selectedVehicle2 === resolvedVehicleId;
                    
                    // b.date usually looks like "Mon Jan 01 2024" or ISO string
                    const bDate = b.date ? new Date(b.date) : new Date(0);
                    bDate.setHours(0, 0, 0, 0);
                    
                    const isUpcomingOrToday = bDate >= today;
                    return isCorrectVehicle && isUpcomingOrToday;
                });
            
            // Sort by date manually
            bList.sort((a, b) => {
                const dateA = a.date ? new Date(a.date).getTime() : 0;
                const dateB = b.date ? new Date(b.date).getTime() : 0;
                return dateA - dateB;
            });
            
            setDriverBookings(bList);
        });

        return () => {
            vehicleUnsub();
            availabilityUnsub();
            bookingsUnsub();
        };
    }, [resolvedVehicleId]);


    const handleSaveEmail = async () => {
        if (!resolvedVehicleId) return;
        setIsSavingEmail(true);
        try {
            const vehicleRef = doc(db, "vehicles", resolvedVehicleId);
            await setDoc(vehicleRef, {
                driverEmail: driverEmail
            }, { merge: true });
            alert("Email saved! Notifications will be sent here.");
        } catch (error) {
            console.error("Error saving email:", error);
            alert("Failed to save email.");
        }
        setIsSavingEmail(false);
    };



    const toggleDate = async (dateString) => {
        if (!resolvedVehicleId) return;

        const docRef = doc(db, "vehicle_availability", resolvedVehicleId);
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

        const isOpen = availability[activeTab]?.includes(dateString);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isPast = date < today;

        // 予約があるかチェック
        const bookingsOnDate = driverBookings.filter(b => {
            const bDate = b.date ? new Date(b.date) : null;
            if (!bDate) return false;
            return bDate.getFullYear() === year && bDate.getMonth() === month && bDate.getDate() === d;
        });
        const hasBooking = bookingsOnDate.length > 0;

        days.push(
            <div
                key={d}
                className={`driver-calendar-day ${isOpen ? 'open' : 'blocked'} ${isPast ? 'past' : ''} ${hasBooking ? 'has-booking' : ''}`}
                onClick={() => {
                    if (isPast) return;
                    toggleDate(dateString);
                }}
            >
                <span className="day-number">{d}</span>
                <div className="status-text">{isOpen ? 'OPEN' : 'BLOCKED'}</div>
                {hasBooking && <span className="booking-dot" />}
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

    const isRandomCar = vehicleId === 'random-any' || vehicleId === 'none' || vehicleId === 'random-r34' || (vehicleData?.name?.toLowerCase().includes('random'));

    return (
        <div className="driver-dashboard">
            <header className="driver-header">
                <h1>{isRandomCar ? '🎲 Random Car Portal' : 'Driver Portal v2'}</h1>
                <div className="vehicle-badge" style={{ background: isRandomCar ? '#222' : '#f0f0f0', color: isRandomCar ? '#fff' : '#333' }}>
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
                    <span className="legend-item"><span className="booking-dot-legend" /> 予約あり</span>
                </div>
            </footer>


        </div>
    );
};

export default DriverDashboard;
