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
            let vehicleSlugs = [];
            let mainColor = '#333';

            if (vId) {
                const v1 = vehicles.find(v => v.id === vId);
                const name1 = v1 ? (v1.slug || v1.name) : (vId === 'none' ? 'Random R34' : 'Unknown');
                vehicleNames.push(name1);
                vehicleSlugs.push(v1 && v1.slug ? v1.slug : 'random-r34');
                mainColor = getVehicleColor(name1);
            }
            if (v2Id && v2Id !== 'none' && v2Id !== '') { // Note: If 2nd is 'none' but 1st is also 'none', we might have two Random R34s, but UI usually blocks it. Let's just track it.
                 const v2 = vehicles.find(v => v.id === v2Id);
                 if (v2 || v2Id === 'none') {
                     vehicleNames.push(v2 ? (v2.slug || v2.name) : 'Random R34');
                     vehicleSlugs.push(v2 && v2.slug ? v2.slug : 'random-r34');
                 }
            }
            
            // If they somehow booked two random cars
            if(vId === 'none' && v2Id === 'none') {
                 vehicleNames = ['Random R34 x2'];
                 vehicleSlugs = ['random-r34', 'random-r34'];
            }

            const tourPrefix = booking.tourType === 'Umihotaru Tour' ? '[U] ' : '[D] ';
            const displayName = tourPrefix + vehicleNames.join(' + ');
            const displaySlugs = vehicleSlugs.join(' / ');

            const textColor = 'white';

            return {
                ...booking,
                vehicleDisplayName: displayName,
                vehicleSlugs: displaySlugs,
                color: mainColor,
                textColor
            };
        });
    };

    // Modal State
    const [selectedEditDate, setSelectedEditDate] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [expandedBookingId, setExpandedBookingId] = useState(null);
    
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
        setExpandedBookingId(null);
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
        <div className="master-availability-container notranslate" translate="no">
            <header className="master-header">
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#111', fontWeight: 'bold' }}>
                        {currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月
                    </h2>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handlePrevMonth} style={{ padding: '6px 16px', background: '#f5f5f5', border: 'none', borderRadius: '6px', fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold', color: '#333' }}>&lt;</button>
                    <button onClick={handleNextMonth} style={{ padding: '6px 16px', background: '#f5f5f5', border: 'none', borderRadius: '6px', fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold', color: '#333' }}>&gt;</button>
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
                                            <div style={{opacity: b.isOffline ? 0.8 : 1, lineHeight: '1.2'}}>
                                                <strong>{b.tourType === 'Umihotaru Tour' ? 'U' : 'D'} {b.vehicleSlugs}</strong>
                                            </div>
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
                                            {getBookingsForDate(selectedEditDate).map(b => {
                                                const isExpanded = expandedBookingId === b.id;
                                                return (
                                                <div 
                                                    key={b.id} 
                                                    onClick={() => setExpandedBookingId(isExpanded ? null : b.id)}
                                                    style={{padding: '12px', background: isExpanded ? '#2a2a2a' : '#333', borderRadius: '8px', borderLeft: `6px solid ${b.color}`, cursor: 'pointer', transition: 'background 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'}}
                                                >
                                                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                                                        <div style={{flex: 1}}>
                                                            <strong style={{fontSize: '1.2rem', color: b.color}}>{b.vehicleDisplayName}</strong>
                                                            <div style={{margin: '4px 0', fontSize: '1.1rem'}}>{b.name} <span style={{fontSize: '0.85rem', color: '#aaa'}}>({b.guests} pax)</span></div>
                                                            <div style={{fontSize: '0.95rem', color: '#eee', marginTop: '8px'}}>
                                                                <strong>デポジット:</strong> ¥{(b.deposit || 0).toLocaleString()} <span style={{margin: '0 8px', color: '#555'}}>|</span>
                                                                <strong style={{color: '#ffdd57'}}>現地現金受取:</strong> ¥{((b.totalToken || 0) - (b.deposit || 0)).toLocaleString()}
                                                            </div>
                                                            
                                                            {isExpanded && (
                                                                <div style={{marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #555', fontSize: '0.9rem', color: '#ccc', wordBreak: 'break-word', overflowWrap: 'break-word'}} onClick={e => e.stopPropagation()}>
                                                                    <div style={{display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px'}}>
                                                                        <div style={{background: '#333', padding: '8px', borderRadius: '4px'}}>
                                                                            <div style={{marginBottom: '4px'}}><strong>連絡先 (Email):</strong><br/><span style={{wordBreak: 'break-all'}}>{b.email || 'N/A'}</span></div>
                                                                            <div style={{marginBottom: '4px'}}><strong>Instagram:</strong><br/>{b.instagram || 'N/A'}</div>
                                                                            <div style={{marginBottom: '4px'}}><strong>WhatsApp/Line:</strong><br/>{b.whatsapp || 'N/A'}</div>
                                                                            <div><strong>滞在ホテル:</strong><br/>{b.hotel || 'N/A'}</div>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    {b.options && (
                                                                        <div style={{marginBottom: '8px', padding: '8px', background: '#3a3a3a', borderRadius: '4px'}}>
                                                                            <strong style={{color: '#fff'}}>オプション:</strong>
                                                                            {b.options.tokyoTower && <div style={{marginLeft: '8px'}}>・Tokyo Tower Drop-off (+¥5,000)</div>}
                                                                            {b.options.shibuya && <div style={{marginLeft: '8px'}}>・Shibuya Drop-off (+¥5,000)</div>}
                                                                            {!b.options.tokyoTower && !b.options.shibuya && <div style={{marginLeft: '8px'}}>なし</div>}
                                                                        </div>
                                                                    )}

                                                                    <div style={{marginBottom: '8px'}}>
                                                                        <strong>特筆事項 (Remarks):</strong><br/>
                                                                        <div style={{background: '#222', padding: '6px', borderRadius: '4px', marginTop: '2px', whiteSpace: 'pre-wrap'}}>
                                                                            {b.remarks || 'なし'}
                                                                        </div>
                                                                    </div>

                                                                    <div style={{marginBottom: '8px', color: '#aaa', fontSize: '0.85rem'}}>
                                                                        <div style={{marginBottom: '2px'}}><strong>合計金額:</strong> ¥{(b.totalToken || 0).toLocaleString()}</div>
                                                                        <div style={{marginBottom: '2px'}}><strong>支払状態:</strong> {b.paymentStatus || (b.isOffline ? 'Offline / Cash' : 'Pending')}</div>
                                                                        <div style={{marginBottom: '2px'}}><strong>Payment ID:</strong> <span style={{wordBreak: 'break-all'}}>{b.paymentIntentId || 'N/A'}</span></div>
                                                                        <div style={{marginBottom: '2px'}}><strong>予約ID:</strong> <span style={{wordBreak: 'break-all'}}>{b.id}</span></div>
                                                                        <div><strong>ステータス:</strong> {b.status || (b.isOffline ? 'Confirmed (Offline)' : 'Unknown')}</div>
                                                                    </div>

                                                                    {b.isOffline && <span style={{display: 'inline-block', background: '#555', color: 'white', fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', marginTop: '4px'}}>OFFLINE BOOKING</span>}
                                                                    {b.adminNote && <div style={{marginTop: '8px', background: '#444', padding: '8px', borderRadius: '6px', color: '#eee'}}>📝 <strong>Admin Note:</strong><br/>{b.adminNote}</div>}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px'}}>
                                                            <span style={{color: '#888', fontSize: '0.8rem'}}>{isExpanded ? '▲ 閉じる' : '▼ 詳細'}</span>
                                                            <button 
                                                                onClick={e => { e.stopPropagation(); handleDeleteBooking(b.id); }}
                                                                style={{background: 'rgba(220, 38, 38, 0.1)', border: '1px solid #dc2626', borderRadius: '4px', color: '#dc2626', cursor: 'pointer', fontSize: '0.8rem', padding: '4px 8px', marginTop: isExpanded ? '8px' : '0'}}
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                );
                                            })}
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
