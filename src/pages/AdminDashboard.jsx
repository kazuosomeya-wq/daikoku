import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import Calendar from '../components/Calendar';
import { doc, setDoc, deleteDoc, collection, query, orderBy, onSnapshot, addDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject, uploadBytesResumable } from 'firebase/storage';
import { db, auth, storage } from '../firebase';
import vehicle1 from '../assets/vehicle1.jpg';
import vehicle2 from '../assets/vehicle2.jpg';
import vehicle3 from '../assets/vehicle3.jpg';
import vehicle4 from '../assets/vehicle4.jpg';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [currentTab, setCurrentTab] = useState('daikoku'); // 'daikoku', 'umihotaru', 'vehicles'
    const [editingDate, setEditingDate] = useState(null);
    const [editingTourType, setEditingTourType] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [vehicles, setVehicles] = useState([]);

    // New Vehicle Form State
    const [newVehicle, setNewVehicle] = useState({
        name: '',
        subtitle: '',
        price: '5000',
        slug: '', // Custom URL ID
        displayOrder: 0, // NEW: Ordering
        isVisible: true, // New: Visibility Toggle (Default True)
        image: null,
        imageUrl: '' // Store existing URL for editing
    });
    const [isUploading, setIsUploading] = useState(false);
    const [editingVehicleId, setEditingVehicleId] = useState(null);

    // Mobile Detail View State
    const [selectedBookingForDetail, setSelectedBookingForDetail] = useState(null);

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

    useEffect(() => {
        // Fetch vehicles
        // Fetch ALL vehicles first, then sort client-side to avoid hiding ones without displayOrder
        const q = query(collection(db, "vehicles"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const vehicleData = [];
            snapshot.forEach((doc) => {
                vehicleData.push({ id: doc.id, ...doc.data() });
            });
            // Client-side sort
            vehicleData.sort((a, b) => {
                // Treat 0, null, or undefined as 999 (bottom of list)
                const getOrder = (o) => (!o || o === 0) ? 999 : o;
                return getOrder(a.displayOrder) - getOrder(b.displayOrder);
            });
            setVehicles(vehicleData);
        });
        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            console.log("Logged out successfully");
            navigate('/admin');
        } catch (error) {
            console.error("Logout Error:", error);
            navigate('/admin'); // Force navigate anyway
        }
    };

    const handleDateSelect = (date, type) => {
        setEditingDate(date);
        setEditingTourType(type);
    };

    const handleSaveSlots = async (slots) => {
        if (!editingDate || !editingTourType) return;

        const dateString = `${editingDate.getFullYear()}-${String(editingDate.getMonth() + 1).padStart(2, '0')}-${String(editingDate.getDate()).padStart(2, '0')}`;
        const docRef = doc(db, "availability", dateString);
        const fieldName = (editingTourType === 'Daikoku Tour') ? 'slots' : 'umihotaru_slots';

        try {
            if (slots === null) {
                await deleteDoc(docRef);
            } else {
                await setDoc(docRef, { [fieldName]: slots }, { merge: true });
            }
            setEditingDate(null);
            setEditingTourType(null);
        } catch (error) {
            console.error("Error updating document: ", error);
            alert(`Error: ${error.message}`);
        }
    };

    // Vehicle Management Handlers
    const handleImageChange = (e) => {
        if (e.target.files[0]) {
            setNewVehicle({ ...newVehicle, image: e.target.files[0] });
        }
    };

    const handleAddVehicle = async (e) => {
        e.preventDefault();
        setIsUploading(true);
        if (newVehicle.slug) {
            const duplicate = vehicles.find(v => v.slug === newVehicle.slug && v.id !== (editingVehicleId || ''));
            if (duplicate) {
                alert(`Error: The slug "${newVehicle.slug}" is already used by another vehicle (${duplicate.name}). Please use a different slug.`);
                setIsUploading(false);
                return;
            }
        }

        try {
            let downloadURL = newVehicle.imageUrl; // Default to existing URL

            if (newVehicle.image) {
                console.log("Image selected:", newVehicle.image.name);
                const storageRef = ref(storage, `vehicle_images/${Date.now()}_${newVehicle.image.name}`);
                console.log("Storage Ref created:", storageRef.toString());

                // Use uploadBytes (Simple Upload) to avoid complex CORS preflight issues
                const snapshot = await uploadBytes(storageRef, newVehicle.image);
                downloadURL = await getDownloadURL(snapshot.ref);
                console.log("Upload success, URL:", downloadURL);
            } else if (!downloadURL && !editingVehicleId) {
                // Only use placeholder if adding new and no image selected
                downloadURL = 'https://placehold.co/600x400?text=No+Image';
            }

            const vehicleData = {
                name: newVehicle.name,
                subtitle: newVehicle.subtitle || '',
                price: newVehicle.price,
                slug: newVehicle.slug || '',
                driverEmail: newVehicle.driverEmail || '',
                displayOrder: Number(newVehicle.displayOrder || 0),
                isVisible: newVehicle.isVisible !== false && newVehicle.isVisible !== undefined ? newVehicle.isVisible : true, // Save visibility
                imageUrl: downloadURL || '',
                updatedAt: new Date()
            };

            if (editingVehicleId) {
                // Update existing vehicle
                await updateDoc(doc(db, "vehicles", editingVehicleId), vehicleData);
                alert("Vehicle updated successfully!");
                setEditingVehicleId(null);
            } else {
                // Add new vehicle
                vehicleData.createdAt = new Date();
                await addDoc(collection(db, "vehicles"), vehicleData);
                alert("Vehicle added successfully!");
            }

            setNewVehicle({ name: '', subtitle: '', price: '5000', slug: '', displayOrder: 0, image: null, imageUrl: '' });
            // Reset file input if possible, or just rely on state
        } catch (error) {
            console.error("Error saving vehicle: ", error);
            alert("Failed to save vehicle: " + error.message);
        }
        setIsUploading(false);
    };

    const handleEditVehicle = (vehicle) => {
        setEditingVehicleId(vehicle.id);
        setNewVehicle({
            name: vehicle.name,
            subtitle: vehicle.subtitle || '',
            price: vehicle.price,
            slug: vehicle.slug || '',
            displayOrder: vehicle.displayOrder || 0,
            isVisible: vehicle.isVisible !== undefined ? vehicle.isVisible : true, // Load visibility
            driverEmail: vehicle.driverEmail || '',
            image: null, // Reset file input
            imageUrl: vehicle.imageUrl || ''
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingVehicleId(null);
        setNewVehicle({
            name: '',
            subtitle: '',
            price: '5000',
            slug: '',
            displayOrder: 0,
            isVisible: true,
            driverEmail: '',
            image: null,
            imageUrl: ''
        });
    };

    const handleRestoreDefaults = async () => {
        if (!window.confirm("Restore default vehicles? This will add duplicates if they already exist.")) return;
        setIsUploading(true);
        try {
            const defaults = [
                { name: 'R34 - Bayside Blue', price: '5000', subtitle: 'English ⚪︎', img: vehicle1 },
                { name: 'R34 - 600hp Bayside Blue', price: '15000', subtitle: null, img: vehicle2 },
                { name: 'R32 - GTR', price: '5000', subtitle: null, img: vehicle3 },
                { name: 'Supra - Purple', price: '5000', subtitle: null, img: vehicle4 }
            ];

            for (const v of defaults) {
                const response = await fetch(v.img);
                const blob = await response.blob();
                const storageRef = ref(storage, `vehicle_images/${Date.now()}_${v.name.replace(/\s/g, '_')}.jpg`);
                const snapshot = await uploadBytes(storageRef, blob);
                const downloadURL = await getDownloadURL(snapshot.ref);

                await addDoc(collection(db, "vehicles"), {
                    name: v.name,
                    subtitle: v.subtitle || '',
                    price: v.price,
                    imageUrl: downloadURL,
                    createdAt: new Date()
                });
            }
            alert("Restored defaults!");
        } catch (error) {
            console.error("Error restoring defaults:", error);
            alert("Failed to restore defaults.");
        }
        setIsUploading(false);
    };

    const handleDeleteVehicle = async (id) => {
        if (window.confirm("Are you sure you want to delete this vehicle?")) {
            try {
                await deleteDoc(doc(db, "vehicles", id));
            } catch (error) {
                console.error("Error deleting vehicle: ", error);
                alert("Failed to delete vehicle.");
            }
        }
    };

    // Helper functions
    const formatTourDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return (
            <div>
                {date.getMonth() + 1}/{date.getDate()}
                <br />
                <span style={{ fontSize: '0.85em', color: '#666' }}>{date.getFullYear()}</span>
            </div>
        );
    };

    const formatOptions = (opts) => {
        if (!opts) return 'None';
        const active = [];
        if (opts.selectedVehicle && opts.selectedVehicle !== 'none') {
            const vehicle = vehicles.find(v => v.id === opts.selectedVehicle);
            const displayId = vehicle ? (vehicle.slug || vehicle.name) : opts.selectedVehicle;
            active.push(<div key="car">{`Car: ${displayId}`}</div>);
        }
        if (opts.tokyoTower) active.push(<div key="tt">Tokyo Tower</div>);
        if (opts.shibuya) active.push(<div key="sh">Shibuya</div>);
        return active.length > 0 ? active : 'None';
    };

    const getDriverDashboardLink = (vehicle) => {
        const baseUrl = window.location.origin;
        const idToUse = vehicle.slug || vehicle.id;
        return `${baseUrl}/driver/${idToUse}`;
    };

    const handleTogglePayment = async (bookingId, currentStatus) => {
        try {
            const bookingRef = doc(db, "bookings", bookingId);
            await updateDoc(bookingRef, {
                paymentChecked: !currentStatus
            });
        } catch (error) {
            console.error("Error updating payment status:", error);
            alert("Failed to update status");
        }
    };

    return (
        <div className="app-container">
            {/* ... (Header and Tabs omitted for brevity in search, but included in file) ... */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Admin Dashboard</h1>
                <div>
                    <button
                        onClick={() => navigate('/master-schedule')}
                        style={{
                            padding: '0.8rem 1.5rem',
                            background: '#0066cc',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            marginRight: '1rem',
                            fontWeight: 'bold'
                        }}
                    >
                        Master Schedule
                    </button>
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
            </div>

            {/* Tab Navigation */}
            <div style={{ display: 'flex', borderBottom: '1px solid #444', marginBottom: '2rem' }}>
                <button
                    onClick={() => setCurrentTab('daikoku')}
                    style={{
                        padding: '1rem 2rem',
                        background: 'transparent',
                        color: currentTab === 'daikoku' ? '#E60012' : '#ccc',
                        borderBottom: currentTab === 'daikoku' ? '3px solid #E60012' : 'none',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '1rem'
                    }}
                >
                    Daikoku Tour
                </button>
                <button
                    onClick={() => setCurrentTab('umihotaru')}
                    style={{
                        padding: '1rem 2rem',
                        background: 'transparent',
                        color: currentTab === 'umihotaru' ? '#0066cc' : '#ccc',
                        borderBottom: currentTab === 'umihotaru' ? '3px solid #0066cc' : 'none',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '1rem'
                    }}
                >
                    Umihotaru Tour
                </button>
                <button
                    onClick={() => setCurrentTab('vehicles')}
                    style={{
                        padding: '1rem 2rem',
                        background: 'transparent',
                        color: currentTab === 'vehicles' ? '#FFD700' : '#ccc',
                        borderBottom: currentTab === 'vehicles' ? '3px solid #FFD700' : 'none',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '1rem'
                    }}
                >
                    Vehicles
                </button>
            </div>

            {/* ---------------- DAIKOKU SECTION ---------------- */}
            {currentTab === 'daikoku' && (
                <div style={{ marginBottom: '4rem' }}>
                    <h2 style={{ borderLeft: '6px solid #E60012', paddingLeft: '1rem', marginBottom: '1.5rem' }}>
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
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', minWidth: '1000px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left', whiteSpace: 'nowrap' }}>
                                        <th style={{ padding: '4px', textAlign: 'center' }}>Paid?</th>
                                        <th style={{ padding: '4px', width: '65px', lineHeight: '1.2' }}>Tour<br />Date</th>
                                        <th style={{ padding: '4px' }}>Name</th>
                                        <th style={{ padding: '4px' }}>人</th>
                                        <th style={{ padding: '4px' }}>Pickup</th>
                                        <th style={{ padding: '4px' }}>Options</th>
                                        <th style={{ padding: '4px' }}>Deposit</th>
                                        <th style={{ padding: '4px' }}>Total</th>
                                        <th style={{ padding: '4px' }}>Contact</th>
                                        <th style={{ padding: '4px' }}>Booked At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bookings.filter(b => b.tourType === 'Daikoku Tour').map(booking => (
                                        <tr key={booking.id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '4px', textAlign: 'center' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={booking.paymentChecked || false}
                                                    onChange={() => handleTogglePayment(booking.id, booking.paymentChecked)}
                                                    style={{ transform: 'scale(1.5)', cursor: 'pointer', accentColor: '#E60012' }}
                                                />
                                            </td>
                                            <td
                                                style={{ padding: '4px', fontWeight: 'bold', color: '#0066cc', cursor: 'pointer', textDecoration: 'underline' }}
                                                onClick={() => setSelectedBookingForDetail(booking)}
                                            >
                                                {formatTourDate(booking.date)}
                                            </td>
                                            <td style={{ padding: '4px' }}>{booking.name}</td>
                                            <td style={{ padding: '4px' }}>{booking.guests}</td>
                                            <td style={{ padding: '4px' }}>{booking.hotel || '-'}</td>
                                            <td style={{ padding: '4px', width: '75px', fontSize: '0.75rem' }}>{formatOptions(booking.options)}</td>
                                            <td style={{ padding: '4px' }}>¥{booking.deposit?.toLocaleString()}</td>
                                            <td style={{ padding: '4px' }}>¥{booking.totalToken?.toLocaleString()}</td>
                                            <td style={{ padding: '4px' }}>
                                                Insta: {booking.instagram}<br />
                                                WA: {booking.whatsapp}<br />
                                                Email: {booking.email}
                                            </td>
                                            <td style={{ padding: '4px', color: '#999', fontSize: '0.8rem' }}>
                                                {booking.timestamp && booking.timestamp.toDate ? booking.timestamp.toDate().toLocaleString() : 'N/A'}
                                            </td>
                                        </tr>
                                    ))}
                                    {bookings.filter(b => b.tourType === 'Daikoku Tour').length === 0 && (
                                        <tr><td colSpan="10" style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>No bookings.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ---------------- UMIHOTARU SECTION ---------------- */}
            {currentTab === 'umihotaru' && (
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
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', minWidth: '1000px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left', whiteSpace: 'nowrap' }}>
                                        <th style={{ padding: '4px', width: '65px', lineHeight: '1.2' }}>Tour<br />Date</th>
                                        <th style={{ padding: '4px' }}>Name</th>
                                        <th style={{ padding: '4px' }}>人</th>
                                        <th style={{ padding: '4px' }}>Pickup</th>
                                        <th style={{ padding: '4px' }}>Options</th>
                                        <th style={{ padding: '4px' }}>Deposit</th>
                                        <th style={{ padding: '4px' }}>Total</th>
                                        <th style={{ padding: '4px' }}>Contact</th>
                                        <th style={{ padding: '4px' }}>Booked At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bookings.filter(b => b.tourType === 'Umihotaru Tour').map(booking => (
                                        <tr key={booking.id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td
                                                style={{ padding: '4px', fontWeight: 'bold', color: '#0066cc', cursor: 'pointer', textDecoration: 'underline' }}
                                                onClick={() => setSelectedBookingForDetail(booking)}
                                            >
                                                {formatTourDate(booking.date)}
                                            </td>
                                            <td style={{ padding: '4px' }}>{booking.name}</td>
                                            <td style={{ padding: '4px' }}>{booking.guests}</td>
                                            <td style={{ padding: '4px' }}>{booking.hotel || '-'}</td>
                                            <td style={{ padding: '4px', width: '75px', fontSize: '0.75rem' }}>{formatOptions(booking.options)}</td>
                                            <td style={{ padding: '4px' }}>¥{booking.deposit?.toLocaleString()}</td>
                                            <td style={{ padding: '4px' }}>¥{booking.totalToken?.toLocaleString()}</td>
                                            <td style={{ padding: '4px' }}>
                                                Insta: {booking.instagram}<br />
                                                WA: {booking.whatsapp}<br />
                                                Email: {booking.email}
                                            </td>
                                            <td style={{ padding: '0.4rem', color: '#999', fontSize: '0.8rem' }}>
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
            )}

            {/* ---------------- VEHICLES SECTION ---------------- */}
            {currentTab === 'vehicles' && (
                <div>
                    <h2 style={{ borderLeft: '6px solid #FFD700', paddingLeft: '1rem', marginBottom: '1.5rem', color: '#FFD700' }}>
                        Vehicle Management
                    </h2>

                    {/* Add New Vehicle Form */}
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', color: '#333', marginBottom: '2rem', maxWidth: '600px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>Add New Vehicle</h3>
                            <button
                                onClick={handleRestoreDefaults}
                                disabled={isUploading}
                                style={{
                                    padding: '0.5rem 1rem',
                                    background: '#666',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: isUploading ? 'not-allowed' : 'pointer',
                                    fontSize: '0.8rem'
                                }}
                            >
                                {isUploading ? 'Restoring...' : 'Restore Defaults'}
                            </button>
                        </div>
                        <form onSubmit={handleAddVehicle}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Vehicle Name</label>
                                <input
                                    type="text"
                                    value={newVehicle.name}
                                    onChange={(e) => setNewVehicle({ ...newVehicle, name: e.target.value })}
                                    placeholder="e.g. R34 - Midnight Purple"
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '4px', border: '1px solid #ddd' }}
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Subtitle (Optional)</label>
                                <input
                                    type="text"
                                    value={newVehicle.subtitle}
                                    onChange={(e) => setNewVehicle({ ...newVehicle, subtitle: e.target.value })}
                                    placeholder="e.g. English OK"
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '4px', border: '1px solid #ddd' }}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Price Surcharge (¥)</label>
                                <input
                                    type="text"
                                    value={newVehicle.price}
                                    onChange={(e) => setNewVehicle({ ...newVehicle, price: e.target.value })}
                                    placeholder="e.g. 5000"
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '4px', border: '1px solid #ddd' }}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Custom Page ID (Slug)</label>
                                <input
                                    type="text"
                                    value={newVehicle.slug}
                                    onChange={(e) => setNewVehicle({ ...newVehicle, slug: e.target.value })}
                                    placeholder="e.g. kazuo-car (Optional)"
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '4px', border: '1px solid #ddd' }}
                                />
                                <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.2rem' }}>
                                    If set, URL will be: .../driver/{newVehicle.slug || 'your-id'}
                                </p>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Display Order</label>
                                <input
                                    type="number"
                                    value={newVehicle.displayOrder}
                                    onChange={(e) => setNewVehicle({ ...newVehicle, displayOrder: e.target.value })}
                                    placeholder="0"
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '4px', border: '1px solid #ddd' }}
                                    className="vehicle-input"
                                />
                                {/* Visibility Toggle */}
                                <div style={{ margin: '10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <input
                                        type="checkbox"
                                        id="isVisible"
                                        checked={newVehicle.isVisible !== false}
                                        onChange={(e) => setNewVehicle({ ...newVehicle, isVisible: e.target.checked })}
                                        style={{ width: '20px', height: '20px' }}
                                    />
                                    <label htmlFor="isVisible" style={{ cursor: 'pointer', fontWeight: 'bold' }}>Show on Booking Page</label>
                                </div>
                                <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.2rem' }}>
                                    Lower numbers appear first (e.g. 1, 2, 3...)
                                </p>
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Vehicle Image</label>
                                <input
                                    type="file"
                                    onChange={handleImageChange}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    type="submit"
                                    disabled={isUploading}
                                    style={{
                                        background: isUploading ? '#666' : (editingVehicleId ? '#0066cc' : '#E60012'),
                                        color: 'white',
                                        padding: '1rem',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontWeight: 'bold',
                                        cursor: isUploading ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    {isUploading ? 'Saving...' : (editingVehicleId ? 'Update Vehicle' : 'Add Vehicle')}
                                </button>
                                {editingVehicleId && (
                                    <button
                                        type="button"
                                        onClick={handleCancelEdit}
                                        style={{
                                            background: '#444',
                                            color: 'white',
                                            padding: '1rem',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            flex: 0.5
                                        }}
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Existing Vehicles List */}
                    <h3 style={{ color: 'white' }}>Current Vehicles</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                        {vehicles.map(vehicle => (
                            <div key={vehicle.id} style={{
                                background: '#222',
                                padding: '1rem',
                                borderRadius: '12px',
                                border: vehicle.isVisible === false ? '2px dashed #999' : '1px solid #444',
                                opacity: vehicle.isVisible === false ? 0.6 : 1,
                                position: 'relative'
                            }}>
                                {vehicle.isVisible === false && (
                                    <div style={{
                                        position: 'absolute', top: 10, right: 10, zIndex: 10,
                                        background: '#ff4444', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold'
                                    }}>
                                        Hidden
                                    </div>
                                )}
                                <div style={{ width: '100%', aspectRatio: '16/9', background: '#333', marginBottom: '1rem', borderRadius: '8px', overflow: 'hidden' }}>
                                    <img src={vehicle.imageUrl} alt={vehicle.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <h4 style={{ margin: '0 0 0.5rem 0', color: 'white' }}>{vehicle.name}</h4>
                                <p style={{ margin: '0 0 0.5rem 0', color: '#ccc', fontSize: '0.9rem' }}>{vehicle.subtitle || 'No subtitle'}</p>
                                <p style={{ margin: '0 0 1rem 0', color: '#E60012', fontWeight: 'bold' }}>+¥{Number(vehicle.price).toLocaleString()}</p>

                                <div style={{ background: '#333', padding: '0.8rem', borderRadius: '8px', marginBottom: '1rem' }}>
                                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: '#999' }}>Driver Portal URL:</p>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <input
                                            type="text"
                                            readOnly
                                            value={getDriverDashboardLink(vehicle)}
                                            style={{ flex: 1, background: '#111', color: '#ccc', border: 'none', padding: '0.4rem', borderRadius: '4px', fontSize: '0.8rem' }}
                                        />
                                        <button
                                            onClick={() => navigator.clipboard.writeText(getDriverDashboardLink(vehicle))}
                                            style={{ background: '#444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                                        >
                                            Copy
                                        </button>
                                    </div>
                                    <a
                                        href={getDriverDashboardLink(vehicle)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ display: 'block', marginTop: '0.5rem', color: '#E60012', fontSize: '0.8rem', textDecoration: 'none' }}
                                    >
                                        Open Driver Portal
                                    </a>
                                </div>

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={() => handleEditVehicle(vehicle)}
                                        style={{
                                            flex: 1,
                                            padding: '0.8rem',
                                            background: '#0066cc',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteVehicle(vehicle.id)}
                                        style={{
                                            flex: 1,
                                            padding: '0.8rem',
                                            background: 'transparent',
                                            color: '#999',
                                            border: '1px solid #444',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseOver={(e) => { e.target.style.borderColor = 'red'; e.target.style.color = 'red'; }}
                                        onMouseOut={(e) => { e.target.style.borderColor = '#444'; e.target.style.color = '#999'; }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

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
            {/* Mobile Detail Modal */}
            {selectedBookingForDetail && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000,
                    display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2
                }} onClick={() => setSelectedBookingForDetail(null)}>
                    <div style={{
                        backgroundColor: 'white', padding: '2rem', borderRadius: '12px',
                        width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto',
                        position: 'relative', color: '#333'
                    }} onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setSelectedBookingForDetail(null)}
                            style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
                        >
                            &times;
                        </button>
                        <h2 style={{ marginTop: 0, borderBottom: '2px solid #eee', paddingBottom: '0.5rem' }}>Booking Details</h2>

                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <strong>Status:</strong> <span style={{
                                    background: selectedBookingForDetail.status === 'Pending' ? '#fff3cd' : '#d4edda',
                                    padding: '2px 6px', borderRadius: '4px'
                                }}>{selectedBookingForDetail.status || 'Pending'}</span>
                            </div>
                            <div><strong>Date:</strong> {formatTourDate(selectedBookingForDetail.date)}</div>
                            <div><strong>Name:</strong> {selectedBookingForDetail.name}</div>
                            <div><strong>Guests:</strong> {selectedBookingForDetail.guests}</div>
                            <div><strong>Pickup:</strong> {selectedBookingForDetail.hotel}</div>
                            <div><strong>Options:</strong> {formatOptions(selectedBookingForDetail.options)}</div>
                            <div><strong>Deposit:</strong> ¥{selectedBookingForDetail.deposit?.toLocaleString()}</div>
                            <div><strong>Total:</strong> ¥{selectedBookingForDetail.totalToken?.toLocaleString()}</div>

                            <div style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '8px', marginTop: '0.5rem' }}>
                                <strong>Contact Info:</strong><br />
                                Instagram: {selectedBookingForDetail.instagram}<br />
                                WhatsApp: {selectedBookingForDetail.whatsapp}<br />
                                Email: {selectedBookingForDetail.email}
                            </div>

                            <div style={{ background: '#fff3cd', padding: '1rem', borderRadius: '8px' }}>
                                <strong>Remarks:</strong><br />
                                {selectedBookingForDetail.remarks || 'None'}
                            </div>
                        </div>

                        <button
                            onClick={() => setSelectedBookingForDetail(null)}
                            style={{
                                width: '100%', padding: '1rem', marginTop: '1.5rem',
                                background: '#333', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold'
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
