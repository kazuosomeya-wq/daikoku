import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import './MasterAvailability.css';

const MasterAvailability = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [vehicles, setVehicles] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch Vehicles and Bookings
    useEffect(() => {
        setLoading(true);

        const unsubVehicles = onSnapshot(query(collection(db, "vehicles"), orderBy("name")), (snapshot) => {
            const vList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // Add Random R34 as a selectable option for manual bookings
            vList.push({ id: 'none', name: 'Random R34', slug: 'random-r34' });
            setVehicles(vList);
        });

        const unsubBookings = onSnapshot(collection(db, "bookings"), (snapshot) => {
            const bList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setBookings(bList);
            setLoading(false);
        });

        return () => {
            unsubVehicles();
            unsubBookings();
        };
    }, []);

    // Custom Color Mapping
    const getVehicleColor = (nameOrSlug) => {
        if (!nameOrSlug) return '#333';
        const lower = nameOrSlug.toLowerCase();

        const colorMap = {
            'sakusaku': '#000000',      // Black
            '180': '#8B0000',           // Dark Red
            'r35': '#666666',           // Gray
            'red': '#DC2626',           // Red
            'crs': '#333333',           // Dark Gray
            'blue': '#2563EB',          // Blue
            'sion': '#1E3A8A',          // Dark Blue
            'silver r32': '#555555',    // Darkened Gray
            '600hp kae': '#A67C00',     // Darkened Gold
            'random': '#E60012'         // Random R34 Red
        };

        for (const [key, color] of Object.entries(colorMap)) {
            if (lower.includes(key)) {
                return color;
            }
        }
        return stringToColor(nameOrSlug);
    };

    // Generate HSL color from string (Fallback)
    const stringToColor = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        let h = Math.abs(hash) % 360;
        let s = 70;
        let l = 40; 
        if (h > 45 && h < 190) {
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

        const startDay = firstDayOfMonth.getDay(); 
        for (let i = 0; i < startDay; i++) {
            const prevDate = new Date(year, month, -startDay + 1 + i);
            daysArray.push({ date: prevDate, isCurrentMonth: false });
        }
        for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
            daysArray.push({ date: new Date(year, month, i), isCurrentMonth: true });
        }
        const remaining = 42 - daysArray.length; 
        for (let i = 1; i <= remaining; i++) {
            daysArray.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
        }
        return daysArray;
    };

    const calendarDays = getCalendarDays(currentDate);
    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

    // Get Bookings for a specific date (All Tours)
    const getBookingsForDate = (date) => {
        const dateStr = date.toDateString();
        
        return bookings.filter(b => b.date === dateStr).map(booking => {
            // Find vehicle name
            const vId = booking.options?.selectedVehicle;
            const v2Id = booking.options?.selectedVehicle2;
            
            let vehicleNames = [];
            let mainColor = '#333';

            if (vId) {
                const v1 = vehicles.find(v => v.id === vId);
                const name1 = v1 ? (v1.slug || v1.name) : (vId === 'none' ? 'Random R34' : 'Unknown');
                vehicleNames.push(name1);
                mainColor = getVehicleColor(name1);
            }
            if (v2Id && v2Id !== 'none' && v2Id !== '') { // Note: If 2nd is 'none' but 1st is also 'none', we might have two Random R34s, but UI usually blocks it. Let's just track it.
                 const v2 = vehicles.find(v => v.id === v2Id);
                 if (v2 || v2Id === 'none') {
                     vehicleNames.push(v2 ? (v2.slug || v2.name) : 'Random R34');
                 }
            }
            
            // If they somehow booked two random cars
            if(vId === 'none' && v2Id === 'none') {
                 vehicleNames = ['Random R34 x2'];
            }

            const tourPrefix = booking.tourType === 'Umihotaru Tour' ? '[U] ' : '[D] ';
            const displayName = tourPrefix + vehicleNames.join(' + ');

            const textColor = 'white';

            return {
                ...booking,
                vehicleDisplayName: displayName,
                color: mainColor,
                textColor
            };
        });
    };

    // Modal State
    const [selectedEditDate, setSelectedEditDate] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    
    const [isAddingBooking, setIsAddingBooking] = useState(false);
    const [newBookingData, setNewBookingData] = useState({
        tourType: 'Daikoku Tour',
        name: '',
        guests: 2,
        vehicleId: 'none',
        contact: '',
        note: ''
    });

    const handleDateClick = (date) => {
        setSelectedEditDate(date);
        setIsEditModalOpen(true);
        setIsAddingBooking(false); // Reset to view mode
    };

    const handleAddOfflineBooking = async (e) => {
        e.preventDefault();
        if(!newBookingData.name || !selectedEditDate) return;

        try {
            const bookingDoc = {
                date: selectedEditDate.toDateString(),
                tourType: newBookingData.tourType,
                name: newBookingData.name,
                guests: Number(newBookingData.guests),
                email: 'offline@booking.local',
                instagram: newBookingData.contact,
                adminNote: newBookingData.note || 'Offline / Manual Booking',
                options: {
                    selectedVehicle: newBookingData.vehicleId,
                    tokyoTower: false,
                    shibuya: false
                },
                totalToken: 0,
                deposit: 0,
                status: 'succeeded', // Treat as confirmed
                timestamp: serverTimestamp(),
                isOffline: true
            };

            await addDoc(collection(db, "bookings"), bookingDoc);
            setIsAddingBooking(false);
            setNewBookingData({ tourType: 'Daikoku Tour', name: '', guests: 2, vehicleId: 'none', contact: '', note: '' });
        } catch (err) {
            console.error("Error adding offline booking: ", err);
            alert("Failed to add booking");
        }
    };

    const handleDeleteBooking = async (bookingId) => {
        if(window.confirm("Are you sure you want to delete this booking? This CANNOT be undone.")) {
            try {
                await deleteDoc(doc(db, "bookings", bookingId));
            } catch (err) {
                console.error("Error deleting booking:", err);
                alert("Failed to delete booking.");
            }
        }
    };

    if (loading) return <div className="loading-container">Loading Master Schedule...</div>;

    return (
        <div className="master-availability-container">
            <header className="master-header">
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#111' }}>Booking Master Schedule</h1>
                    <p style={{ margin: '5px 0 0', color: '#666' }}>View \u0026 Add Bookings</p>
                </div>

                <div className="header-controls">
                    <div className="month-nav">
                        <button onClick={handlePrevMonth}>&lt;</button>
                        <h2>{monthName}</h2>
                        <button onClick={handleNextMonth}>&gt;</button>
                    </div>
                </div>
            </header>

            <div className="schedule-grid-wrapper">
                <div className="calendar-header-row">
                    <div className="weekend-sun">Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div className="weekend-sat">Sat</div>
                </div>
                <div className="calendar-grid-body">
                    {calendarDays.map((dayObj, index) => {
                        const { date, isCurrentMonth } = dayObj;
                        const dayBookings = getBookingsForDate(date);
                        const isToday = new Date().toDateString() === date.toDateString();
                        const isSat = date.getDay() === 6;
                        const isSun = date.getDay() === 0;

                        return (
                            <div
                                key={index}
                                className={`calendar-day-cell ${!isCurrentMonth ? 'other-month' : ''} ${isSat ? 'sat-cell' : ''} ${isSun ? 'sun-cell' : ''}`}
                                onClick={() => handleDateClick(date)}
                                style={{ cursor: 'pointer' }}
                            >
                                <span className={`day-number ${isToday ? 'today-highlight' : ''}`}>
                                    {date.getDate()}
                                </span>
                                <div className="vehicle-badges-list">
                                    {dayBookings.map(b => (
                                        <div
                                            key={b.id}
                                            className="calendar-badge"
                                            style={{ backgroundColor: b.color, color: b.textColor }}
                                            title={`${b.name} (${b.guests} pax) - ${b.vehicleDisplayName}`}
                                        >
                                            <span style={{opacity: b.isOffline ? 0.8 : 1}}>{b.tourType === 'Umihotaru Tour' ? 'U' : 'D'} {b.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* View / Edit Modal */}
            {isEditModalOpen && selectedEditDate && (
                <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
                    <div className="modal-content" style={{maxWidth: '600px', background: '#222', color: 'white'}} onClick={e => e.stopPropagation()}>
                        <div className="modal-header" style={{borderBottom: '1px solid #444'}}>
                            <h3>{selectedEditDate.toLocaleDateString()} Bookings</h3>
                            <button className="close-btn" style={{color: 'white'}} onClick={() => setIsEditModalOpen(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            
                            {!isAddingBooking ? (
                                <>
                                    {getBookingsForDate(selectedEditDate).length > 0 ? (
                                        <div style={{display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px'}}>
                                            {getBookingsForDate(selectedEditDate).map(b => (
                                                <div key={b.id} style={{padding: '10px', background: '#333', borderRadius: '8px', borderLeft: `6px solid ${b.color}`}}>
                                                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                                                        <div>
                                                            <strong style={{fontSize: '1.1rem'}}>{b.name}</strong> <span style={{color: '#aaa'}}>({b.guests} pax)</span>
                                                            <div style={{margin: '4px 0', fontWeight: 'bold', color: b.color}}>{b.vehicleDisplayName}</div>
                                                            <div style={{fontSize: '0.85rem', color: '#ccc', marginBottom: '4px'}}>
                                                                <strong>Contact:</strong> {b.instagram || b.email || 'N/A'}
                                                            </div>
                                                            <div style={{fontSize: '0.85rem', color: '#ccc', marginBottom: '4px'}}>
                                                                <strong>Paid Deposit:</strong> ¥{(b.deposit || 0).toLocaleString()} <br/>
                                                                <strong>Cash on day:</strong> ¥{((b.totalToken || 0) - (b.deposit || 0)).toLocaleString()} <span style={{color: '#888'}}>(Total: ¥{(b.totalToken || 0).toLocaleString()})</span>
                                                            </div>
                                                            {b.isOffline && <span style={{display: 'inline-block', background: '#555', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', marginBottom: '4px', marginRight: '4px'}}>OFFLINE BOOKING</span>}
                                                            {b.adminNote && <div style={{fontSize: '0.85rem', color: '#ccc'}}>📝 {b.adminNote}</div>}
                                                            <div style={{fontSize: '0.8rem', color: '#888', marginTop: '4px'}}>ID: {b.id}</div>
                                                        </div>
                                                        <button 
                                                            onClick={e => { e.stopPropagation(); handleDeleteBooking(b.id); }}
                                                            style={{background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline'}}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p style={{color: '#aaa', marginBottom: '20px'}}>No bookings for this date.</p>
                                    )}

                                    <button 
                                        onClick={() => setIsAddingBooking(true)}
                                        style={{width: '100%', padding: '10px', background: '#0066cc', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'}}
                                    >
                                        + Add Offline Booking
                                    </button>
                                </>
                            ) : (
                                <form onSubmit={handleAddOfflineBooking} style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                                    <h4 style={{margin: '0 0 10px 0'}}>Add Offline Booking</h4>
                                    
                                    <div>
                                        <label style={{display:'block', fontSize:'0.85rem', fontWeight:'bold', marginBottom:'4px', color:'white'}}>Tour Type</label>
                                        <select value={newBookingData.tourType} onChange={e => setNewBookingData({...newBookingData, tourType: e.target.value})} style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #555', background: '#333', color: 'white'}}>
                                            <option value="Daikoku Tour">Daikoku Tour</option>
                                            <option value="Umihotaru Tour">Umihotaru Tour</option>
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label style={{display:'block', fontSize:'0.85rem', fontWeight:'bold', marginBottom:'4px', color:'white'}}>Guest Name *</label>
                                        <input type="text" required value={newBookingData.name} onChange={e => setNewBookingData({...newBookingData, name: e.target.value})} style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #555', background: '#333', color: 'white'}} />
                                    </div>

                                    <div style={{display: 'flex', gap: '10px'}}>
                                        <div style={{flex: 1}}>
                                            <label style={{display:'block', fontSize:'0.85rem', fontWeight:'bold', marginBottom:'4px', color:'white'}}>Guests</label>
                                            <input type="number" min="1" max="8" value={newBookingData.guests} onChange={e => setNewBookingData({...newBookingData, guests: e.target.value})} style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #555', background: '#333', color: 'white'}} />
                                        </div>
                                        <div style={{flex: 2}}>
                                            <label style={{display:'block', fontSize:'0.85rem', fontWeight:'bold', marginBottom:'4px', color:'white'}}>Vehicle</label>
                                            <select value={newBookingData.vehicleId} onChange={e => setNewBookingData({...newBookingData, vehicleId: e.target.value})} style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #555', background: '#333', color: 'white'}}>
                                                {vehicles.map(v => (
                                                    <option key={v.id} value={v.id}>
                                                        {v.name} {v.id !== 'none' ? `(${v.slug || 'no-url'})` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{display:'block', fontSize:'0.85rem', fontWeight:'bold', marginBottom:'4px', color:'white'}}>Contact (Insta / Discord)</label>
                                        <input type="text" value={newBookingData.contact} onChange={e => setNewBookingData({...newBookingData, contact: e.target.value})} style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #555', background: '#333', color: 'white'}} />
                                    </div>

                                    <div>
                                        <label style={{display:'block', fontSize:'0.85rem', fontWeight:'bold', marginBottom:'4px', color:'white'}}>Admin Memo</label>
                                        <textarea value={newBookingData.note} onChange={e => setNewBookingData({...newBookingData, note: e.target.value})} rows="2" style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #555', background: '#333', color: 'white'}}></textarea>
                                    </div>

                                    <div style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
                                        <button type="submit" style={{flex: 2, padding: '10px', background: '#059669', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'}}>
                                            Save Booking
                                        </button>
                                        <button type="button" onClick={() => setIsAddingBooking(false)} style={{flex: 1, padding: '10px', background: '#e5e7eb', color: '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'}}>
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MasterAvailability;
