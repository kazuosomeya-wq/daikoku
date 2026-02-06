import React, { useState } from 'react';
import { getAuth, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import Calendar from '../components/Calendar';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import '../App.css';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const auth = getAuth();
    const [editingDate, setEditingDate] = useState(null);

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

            <div style={{ background: 'white', padding: '1rem', borderRadius: '16px', color: '#333' }}>
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
