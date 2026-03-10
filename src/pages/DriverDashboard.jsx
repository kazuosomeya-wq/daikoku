import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot, setDoc, updateDoc, arrayUnion, arrayRemove, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { disableGoogleTranslate } from '../utils/disableTranslate';
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
        disableGoogleTranslate();
        
        const resolveVehicle = async () => {
            if (!vehicleId) return;
            setLoading(true);

            try {
                let foundId = null;
                let foundData = null;

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
        <div className="driver-dashboard notranslate" translate="no">
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

            <div style={{ marginTop: '2rem', padding: '1rem', background: '#fff', borderRadius: '12px', border: '1px solid #ddd' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', color: '#111', fontWeight: 'bold' }}>📅 確定済みのご予約</h3>
                
                {driverBookings.length === 0 ? (
                    <p style={{ color: '#666' }}>現在、割り当てられている予約はありません。</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {driverBookings.map(b => {
                            const dateObj = b.date ? new Date(b.date) : null;
                            const formattedDate = dateObj 
                                ? `${dateObj.getFullYear()}/${dateObj.getMonth() + 1}/${dateObj.getDate()}` 
                                : '日付不明';
                                
                            return (
                            <div key={b.id} style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px', borderLeft: `6px solid ${b.tourType === 'Umihotaru Tour' ? '#3b82f6' : '#ec4899'}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <strong style={{ fontSize: '1.1rem', color: '#111' }}>{formattedDate}</strong>
                                    <span style={{ fontSize: '0.85rem', background: b.tourType === 'Umihotaru Tour' ? '#dbeafe' : '#fce7f3', color: b.tourType === 'Umihotaru Tour' ? '#1e3a8a' : '#831843', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                                        {b.tourType === 'Umihotaru Tour' ? 'Umihotaru (うみほたる)' : 'Daikoku (大黒)'}
                                    </span>
                                </div>
                                
                                <div style={{ fontSize: '0.95rem', color: '#333', marginBottom: '4px' }}>
                                    <strong>お客様名:</strong> {b.name} <span style={{ color: '#666', fontSize: '0.85rem' }}>({b.guests}名)</span>
                                </div>
                                <div style={{ fontSize: '0.95rem', color: '#333', marginBottom: '8px' }}>
                                    <strong>連絡先:</strong> {b.contact || b.whatsapp || b.instagram || b.email || 'なし'}
                                </div>
                                
                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.95rem', color: '#333', background: '#eef2ff', padding: '8px', borderRadius: '6px' }}>
                                    <div>
                                        <strong>現地現金受取額:</strong> <span style={{ color: '#b45309', fontWeight: 'bold' }}>¥{((b.totalToken || 0) - (b.deposit || 0)).toLocaleString()}</span>
                                    </div>
                                </div>
                                
                                {(b.options?.tokyoTower || b.options?.shibuya) && (
                                    <div style={{ marginTop: '8px', fontSize: '0.85rem', color: '#555' }}>
                                        <strong>オプション:</strong> 
                                        {b.options.tokyoTower && ' Tokyo Tower Drop-off'}
                                        {b.options.shibuya && ' Shibuya Drop-off'}
                                    </div>
                                )}
                                
                                {b.remarks && (
                                    <div style={{ marginTop: '8px', fontSize: '0.85rem', color: '#555', background: '#fff', padding: '6px', border: '1px solid #eee', borderRadius: '4px' }}>
                                        <strong>お客様からのメモ:</strong><br/>{b.remarks}
                                    </div>
                                )}
                                
                                {b.adminNote && (
                                    <div style={{ marginTop: '8px', fontSize: '0.85rem', color: '#fff', background: '#4b5563', padding: '6px', borderRadius: '4px' }}>
                                        <strong>運営からの申し送り事項:</strong><br/>{b.adminNote}
                                    </div>
                                )}
                            </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DriverDashboard;
