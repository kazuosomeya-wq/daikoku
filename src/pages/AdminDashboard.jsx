import React, { useState, useEffect } from 'react';
import { getAuth, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import Calendar from '../components/Calendar';
import { doc, setDoc, deleteDoc, collection, query, orderBy, onSnapshot, deleteField } from 'firebase/firestore'; // Added deleteField

// ... imports

const AdminDashboard = () => {
    const navigate = useNavigate();
    const auth = getAuth();
    const [editingDate, setEditingDate] = useState(null);
    const [editingTourType, setEditingTourType] = useState(null); // Added state
    const [bookings, setBookings] = useState([]);

    useEffect(() => {
        // Fetch bookings
        const q = query(collection(db, "bookings"), orderBy("timestamp", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const bookingsData = [];
            snapshot.forEach((doc) => {
                bookingsData.push({ id: doc.id, ...doc.data() });
            });
            setBookings(bookingsData);
        });
        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        await signOut(auth);
        navigate('/admin');
    };

    const handleDateSelect = (date, type) => {
        setEditingDate(date);
        setEditingTourType(type);
    };

    const handleSaveSlots = async (slots) => {
        if (!editingDate || !editingTourType) return;

        const dateString = `${editingDate.getFullYear()}-${String(editingDate.getMonth() + 1).padStart(2, '0')}-${String(editingDate.getDate()).padStart(2, '0')}`;
        const docRef = doc(db, "availability", dateString);

        // Determine field name
        const fieldName = editingTourType === 'Daikoku Tour' ? 'slots' : 'umihotaru_slots';

        try {
            if (slots === null) {
                // Reset this specific field
                await setDoc(docRef, { [fieldName]: deleteField() }, { merge: true });
            } else {
                // Set specific slots for this tour type
                await setDoc(docRef, { [fieldName]: slots }, { merge: true });
            }
            setEditingDate(null); // Close modal
            setEditingTourType(null);
        } catch (error) {
            console.error("Error updating document: ", error);
            alert(`Error: ${error.message}`);
        }
    };

    // Helper to format tour date as MM/DD/YYYY
    const formatTourDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    };

    // Helper to format options
    const formatOptions = (opts) => {
        if (!opts) return 'None';
        const active = [];
        if (opts.colorRequest) active.push(`Color: ${opts.colorRequestText || 'Yes'}`);
        if (opts.modelRequest) active.push(`Model: ${opts.modelRequestText || 'Yes'}`);
        if (opts.tunedCarRequest) active.push('Tuned Car');
        if (opts.tokyoTower) active.push('Tokyo Tower');
        if (opts.shibuya) active.push('Shibuya');
        return active.length > 0 ? active.join(', ') : 'None';
    };

    return (
        <div className="app-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Admin Dashboard</h1>
                <button
                    onClick={handleLogout}
                    style={{
                        padding: '0.8rem 1.5rem',
                        background: '#333',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer'
                    }}
                >
                    Logout
                </button>
            </div>

            {/* ---------------- DAIKOKU SECTION ---------------- */}
            <div style={{ marginBottom: '4rem' }}>
                <h2 style={{ borderLeft: '6px solid #E60012', paddingLeft: '1rem', marginBottom: '1.5rem', marginTop: '3rem' }}>
                    Daikoku Tour Management
                </h2>

                {/* Daikoku Availability */}
                <div style={{ background: 'white', padding: '1rem', borderRadius: '16px', color: '#333', marginBottom: '2rem' }}>
                    <h3 style={{ marginTop: 0 }}>Daikoku Availability</h3>
                    <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                        Set inventory for Daikoku Tour.
                    </p>
                    <div style={{ maxWidth: '100%', overflowX: 'auto' }}>
                        <Calendar
                            personCount={2}
                            selectedDate={new Date()}
                            onDateSelect={(d) => handleDateSelect(d, 'Daikoku Tour')}
                            isAdmin={true}
                            tourType="Daikoku Tour"
                        />
                    </div>
                </div>

                {/* Daikoku Bookings */}
                <div style={{ background: 'white', padding: '1rem', borderRadius: '16px', color: '#333' }}>
                    <h3 style={{ marginTop: 0 }}>Daikoku Bookings</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: '1000px' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left', whiteSpace: 'nowrap' }}>
                                    <th style={{ padding: '0.8rem' }}>Status</th>
                                    <th style={{ padding: '0.8rem' }}>Tour Date</th>
                                    <th style={{ padding: '0.8rem' }}>Name</th>
                                    <th style={{ padding: '0.8rem' }}>Guests</th>
                                    <th style={{ padding: '0.8rem' }}>Options</th>
                                    <th style={{ padding: '0.8rem' }}>Deposit</th>
                                    <th style={{ padding: '0.8rem' }}>Total</th>
                                    <th style={{ padding: '0.8rem' }}>Contact</th>
                                    <th style={{ padding: '0.8rem' }}>Booked At</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.filter(b => b.tourType === 'Daikoku Tour').map(booking => (
                                    <tr key={booking.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '0.8rem' }}>
                                            <span style={{
                                                background: booking.status === 'Pending' ? '#fff3cd' : '#d4edda',
                                                padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem'
                                            }}>
                                                {booking.status || 'Pending'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.8rem', fontWeight: 'bold' }}>{formatTourDate(booking.date)}</td>
                                        <td style={{ padding: '0.8rem' }}>{booking.name}</td>
                                        <td style={{ padding: '0.8rem' }}>{booking.guests} guests</td>
                                        <td style={{ padding: '0.8rem', maxWidth: '200px' }}>{formatOptions(booking.options)}</td>
                                        <td style={{ padding: '0.8rem' }}>¥{booking.deposit?.toLocaleString()}</td>
                                        <td style={{ padding: '0.8rem' }}>¥{booking.totalToken?.toLocaleString()}</td>
                                        <td style={{ padding: '0.8rem' }}>
                                            Insta: {booking.instagram}<br />
                                            WA: {booking.whatsapp}<br />
                                            Email: {booking.email}
                                        </td>
                                        <td style={{ padding: '0.8rem', color: '#999', fontSize: '0.8rem' }}>
                                            {booking.timestamp?.toDate ? booking.timestamp.toDate().toLocaleString() : 'N/A'}
                                        </td>
                                    </tr>
                                ))}
                                {bookings.filter(b => b.tourType === 'Daikoku Tour').length === 0 && (
                                    <tr><td colSpan="9" style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>No bookings.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ---------------- UMIHOTARU SECTION ---------------- */}
            <div>
                <h2 style={{ borderLeft: '6px solid #0066cc', paddingLeft: '1rem', marginBottom: '1.5rem' }}>
                    Umihotaru Tour Management
                </h2>

                {/* Umihotaru Availability */}
                <div style={{ background: 'white', padding: '1rem', borderRadius: '16px', color: '#333', marginBottom: '2rem' }}>
                    <h3 style={{ marginTop: 0 }}>Umihotaru Availability</h3>
                    <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                        Set inventory for Umihotaru Tour.
                    </p>
                    <div style={{ maxWidth: '100%', overflowX: 'auto' }}>
                        <Calendar
                            personCount={2}
                            selectedDate={new Date()}
                            onDateSelect={(d) => handleDateSelect(d, 'Umihotaru Tour')}
                            isAdmin={true}
                            tourType="Umihotaru Tour"
                        />
                    </div>
                </div>

                {/* Umihotaru Bookings */}
                <div style={{ background: 'white', padding: '1rem', borderRadius: '16px', color: '#333' }}>
                    <h3 style={{ marginTop: 0 }}>Umihotaru Bookings</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: '1000px' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left', whiteSpace: 'nowrap' }}>
                                    <th style={{ padding: '0.8rem' }}>Status</th>
                                    <th style={{ padding: '0.8rem' }}>Tour Date</th>
                                    <th style={{ padding: '0.8rem' }}>Name</th>
                                    <th style={{ padding: '0.8rem' }}>Guests</th>
                                    <th style={{ padding: '0.8rem' }}>Options</th>
                                    <th style={{ padding: '0.8rem' }}>Deposit</th>
                                    <th style={{ padding: '0.8rem' }}>Total</th>
                                    <th style={{ padding: '0.8rem' }}>Contact</th>
                                    <th style={{ padding: '0.8rem' }}>Booked At</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.filter(b => b.tourType === 'Umihotaru Tour').map(booking => (
                                    <tr key={booking.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '0.8rem' }}>
                                            <span style={{
                                                background: booking.status === 'Pending' ? '#fff3cd' : '#d4edda',
                                                padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem'
                                            }}>
                                                {booking.status || 'Pending'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.8rem', fontWeight: 'bold' }}>{formatTourDate(booking.date)}</td>
                                        <td style={{ padding: '0.8rem' }}>{booking.name}</td>
                                        <td style={{ padding: '0.8rem' }}>{booking.guests} guests</td>
                                        <td style={{ padding: '0.8rem', maxWidth: '200px' }}>{formatOptions(booking.options)}</td>
                                        <td style={{ padding: '0.8rem' }}>¥{booking.deposit?.toLocaleString()}</td>
                                        <td style={{ padding: '0.8rem' }}>¥{booking.totalToken?.toLocaleString()}</td>
                                        <td style={{ padding: '0.8rem' }}>
                                            Insta: {booking.instagram}<br />
                                            WA: {booking.whatsapp}<br />
                                            Email: {booking.email}
                                        </td>
                                        <td style={{ padding: '0.8rem', color: '#999', fontSize: '0.8rem' }}>
                                            {booking.timestamp?.toDate ? booking.timestamp.toDate().toLocaleString() : 'N/A'}
                                        </td>
                                    </tr>
                                ))}
                                {bookings.filter(b => b.tourType === 'Umihotaru Tour').length === 0 && (
                                    <tr><td colSpan="9" style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>No bookings.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Selection Modal */}
            {editingDate && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }} onClick={() => setEditingDate(null)}>
                    <div style={{
                        background: 'white',
                        padding: '2rem',
                        borderRadius: '16px',
                        width: '90%',
                        maxWidth: '400px',
                        textAlign: 'center'
                    }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ color: '#333', marginTop: 0 }}>
                            {editingTourType}: {editingDate.toLocaleDateString()}
                        </h3>
                        <p style={{ color: '#666', marginBottom: '1.5rem' }}>Select remaining slots for {editingTourType}:</p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '1.5rem' }}>
                            <button
                                onClick={() => handleSaveSlots(0)}
                                style={{
                                    padding: '1rem',
                                    background: '#ffebee',
                                    color: '#E60012',
                                    border: '2px solid #E60012',
                                    borderRadius: '8px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                            >
                                0 (FULL)
                            </button>
                            {[1, 2, 3, 4, 5].map(num => (
                                <button
                                    key={num}
                                    onClick={() => handleSaveSlots(num)}
                                    style={{
                                        padding: '1rem',
                                        background: '#f5f5f5',
                                        color: '#333',
                                        border: '1px solid #ddd',
                                        borderRadius: '8px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={() => handleSaveSlots(null)}
                                style={{
                                    flex: 1,
                                    padding: '0.8rem',
                                    background: 'transparent',
                                    border: '1px dashed #999',
                                    color: '#666',
                                    borderRadius: '8px',
                                    cursor: 'pointer'
                                }}
                            >
                                Reset (Default)
                            </button>
                            <button
                                onClick={() => setEditingDate(null)}
                                style={{
                                    flex: 1,
                                    padding: '0.8rem',
                                    background: '#333',
                                    border: 'none',
                                    color: 'white',
                                    borderRadius: '8px',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
