import React, { useState, useEffect } from 'react';
import { getAuth, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import Calendar from '../components/Calendar';
import { doc, setDoc, deleteDoc, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import '../App.css';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const auth = getAuth();
    const [editingDate, setEditingDate] = useState(null);
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

    const handleDateSelect = (date) => {
        setEditingDate(date);
    };

    const handleSaveSlots = async (slots) => {
        if (!editingDate) return;

        const dateString = `${editingDate.getFullYear()}-${String(editingDate.getMonth() + 1).padStart(2, '0')}-${String(editingDate.getDate()).padStart(2, '0')}`;
        const docRef = doc(db, "availability", dateString);

        try {
            if (slots === null) {
                // Reset/Clear
                await deleteDoc(docRef);
            } else {
                // Set specific slots
                await setDoc(docRef, { slots: slots });
            }
            setEditingDate(null); // Close modal
        } catch (error) {
            console.error("Error updating document: ", error);
            alert(`Error: ${error.message}\n\nPlease check your Firestore Rules (in Firebase Console -> Build -> Firestore -> Rules). It should be in Test Mode (allow read, write: if true;).`);
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

            {/* Availability Section */}
            <div style={{ background: 'white', padding: '1rem', borderRadius: '16px', color: '#333', marginBottom: '2rem' }}>
                <h3 style={{ marginTop: 0 }}>Manage Availability</h3>
                <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                    Tap a date to set the remaining slots (Inventory).
                </p>
                <div style={{ maxWidth: '100%', overflowX: 'auto' }}>
                    <Calendar
                        personCount={2}
                        selectedDate={new Date()}
                        onDateSelect={handleDateSelect}
                        isAdmin={true}
                    />
                </div>
            </div>

            {/* Booking History Section */}
            <div style={{ background: 'white', padding: '1rem', borderRadius: '16px', color: '#333' }}>
                <h3 style={{ marginTop: 0 }}>Booking Requests</h3>
                <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                    List of users who clicked Checkout (Pending Payment).
                </p>
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
                                <th style={{ padding: '0.8rem' }}>Instagram</th>
                                <th style={{ padding: '0.8rem' }}>WhatsApp</th>
                                <th style={{ padding: '0.8rem' }}>Email</th>
                                <th style={{ padding: '0.8rem' }}>Hotel</th>
                                <th style={{ padding: '0.8rem' }}>Booked At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map(booking => (
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
                                    <td style={{ padding: '0.8rem' }}>{booking.guests}</td>
                                    <td style={{ padding: '0.8rem', maxWidth: '200px' }}>{formatOptions(booking.options)}</td>
                                    <td style={{ padding: '0.8rem' }}>¥{booking.deposit?.toLocaleString()}</td>
                                    <td style={{ padding: '0.8rem' }}>¥{booking.totalToken?.toLocaleString()}</td>
                                    <td style={{ padding: '0.8rem' }}>{booking.instagram}</td>
                                    <td style={{ padding: '0.8rem' }}>{booking.whatsapp}</td>
                                    <td style={{ padding: '0.8rem' }}>{booking.email}</td>
                                    <td style={{ padding: '0.8rem' }}>{booking.hotel}</td>
                                    <td style={{ padding: '0.8rem', color: '#999', fontSize: '0.8rem' }}>
                                        {booking.timestamp?.toDate ? booking.timestamp.toDate().toLocaleString() : 'N/A'}
                                    </td>
                                </tr>
                            ))}
                            {bookings.length === 0 && (
                                <tr>
                                    <td colSpan="12" style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>No bookings yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
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
                            {editingDate.toLocaleDateString()}
                        </h3>
                        <p style={{ color: '#666', marginBottom: '1.5rem' }}>Select remaining slots:</p>

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
