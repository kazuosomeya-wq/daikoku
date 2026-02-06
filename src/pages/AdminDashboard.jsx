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

    // We don't really use this select for navigation here, but Calendar needs it
    // We can use it to trigger the prompt
    // eslint-disable-next-line
    const [selectedDate, setSelectedDate] = useState(null);

    const handleLogout = async () => {
        await signOut(auth);
        navigate('/admin');
    };

    const handleDateSelect = async (date) => {
        const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

        // Simple prompt for now
        const slotsInput = prompt(`Enter remaining slots for ${dateString}\n(Enter 0 to BLOCK, empty to clear override):`, "");

        if (slotsInput === null) return; // Cancelled

        const docRef = doc(db, "availability", dateString);

        try {
            if (slotsInput.trim() === "") {
                // Clear override
                if (window.confirm(`Clear custom setting for ${dateString}? This will revert to default availability.`)) {
                    await deleteDoc(docRef);
                }
            } else {
                const slots = parseInt(slotsInput, 10);
                if (!isNaN(slots)) {
                    await setDoc(docRef, { slots: slots });
                } else {
                    alert("Please enter a valid number.");
                }
            }
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
                    Click a date to set remaining slots. Set to 0 to mark as FULL. Clear to reset.
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
        </div>
    );
};

export default AdminDashboard;
