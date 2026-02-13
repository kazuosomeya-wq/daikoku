import React, { useState } from 'react';
import PeopleSelector from '../components/PeopleSelector';
import Calendar from '../components/Calendar';
import TourTypeSelector from '../components/TourTypeSelector';
import OptionsSelector from '../components/OptionsSelector';
import GuestInfo from '../components/GuestInfo';
import BookingSummary from '../components/BookingSummary';
import CheckoutPanel from '../components/CheckoutPanel';
import Confirmation from '../components/Confirmation';
import { getPriceForDate, calculateDeposit } from '../utils/pricing';
import { createShopifyCheckout } from '../utils/shopify';
import { collection, addDoc, onSnapshot, query, updateDoc, doc, arrayRemove, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import '../App.css';

import logo from '../assets/logo.png';

// Toggle this to enable Shopify Checkout
const USE_SHOPIFY = true;

function Home() {
    const [view, setView] = useState('booking'); // 'booking' or 'success'
    const [bookingData, setBookingData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isVehiclesLoading, setIsVehiclesLoading] = useState(true);

    // Timeout safety for loading
    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (isVehiclesLoading) {
                console.warn("Loading timed out from Firestore.");
                setIsVehiclesLoading(false);
                // Optionally alert user or just let them see what's there (Random R34)
            }
        }, 5000); // 5 seconds timeout
        return () => clearTimeout(timer);
    }, [isVehiclesLoading]);

    const [tourType, setTourType] = useState('Daikoku Tour');
    const [personCount, setPersonCount] = useState(2);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedDateSlots, setSelectedDateSlots] = useState({}); // Stores availability for selected date
    const [vehicleAvailability, setVehicleAvailability] = useState({}); // { vehicleId: [blockedDates] }
    const [vehicles, setVehicles] = useState([]); // Dynamic vehicles from Firestore

    const [options, setOptions] = useState({
        selectedVehicle: 'none', // 'none', 'vehicle1', 'vehicle2', 'vehicle3' or ID
        selectedVehicle2: 'none', // For groups of 4-6
        tokyoTower: false,
        shibuya: false
    });
    const [guestInfo, setGuestInfo] = useState({
        name: '',
        email: '',
        hotel: '',
        instagram: '',
        whatsapp: ''
    });

    const [bookings, setBookings] = useState([]);

    const [status, setStatus] = useState({ vehicles: 'init', bookings: 'init', avail: 'init' });

    // Fetch vehicle availability, bookings AND vehicles list
    React.useEffect(() => {
        // Availability
        const unsubscribeAvailability = onSnapshot(collection(db, "vehicle_availability"), (snapshot) => {
            const data = {};
            snapshot.forEach((doc) => {
                data[doc.id] = doc.data();
            });
            setVehicleAvailability(data);
            setStatus(prev => ({ ...prev, avail: `OK (${Object.keys(data).length})` }));
        }, (err) => {
            console.error(err);
            setStatus(prev => ({ ...prev, avail: `Err: ${err.message}` }));
        });

        // Vehicles List
        const qVehicles = query(collection(db, "vehicles"));
        const unsubscribeVehicles = onSnapshot(qVehicles, (snapshot) => {
            const vehicleData = [];
            snapshot.forEach((doc) => {
                vehicleData.push({ id: doc.id, ...doc.data() });
            });
            // Client-side sort to ensure all vehicles show even if missing displayOrder
            vehicleData.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

            setVehicles(vehicleData);
            setIsVehiclesLoading(false);
            setStatus(prev => ({ ...prev, vehicles: `OK (${vehicleData.length})` }));
        }, (error) => {
            console.error("Error fetching vehicles:", error);
            setIsVehiclesLoading(false);
            setStatus(prev => ({ ...prev, vehicles: `Err: ${error.message}` }));
        });

        // Bookings
        const qBookings = query(collection(db, "bookings"));
        const unsubscribeBookings = onSnapshot(qBookings, (snapshot) => {
            const bookedData = [];
            snapshot.forEach((doc) => {
                bookedData.push({ id: doc.id, ...doc.data() });
            });
            setBookings(bookedData);
            setStatus(prev => ({ ...prev, bookings: `OK (${bookedData.length})` }));
        }, (err) => {
            console.error(err);
            setStatus(prev => ({ ...prev, bookings: `Err: ${err.message}` }));
        });

        return () => {
            unsubscribeAvailability();
            unsubscribeVehicles();
            unsubscribeBookings();
        };
    }, []);

    const handleDateSelect = (date, slots) => {
        setSelectedDate(date);
        setSelectedDateSlots(slots || {});
    };

    // Calculate disabled vehicles for selected date
    const getDisabledVehicles = () => {
        if (!selectedDate) return [];
        const dateString = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

        const disabled = [];
        // Iterate through ALL vehicles (fetched from Firestore)
        vehicles.forEach(vehicle => {
            const availabilityData = vehicleAvailability[vehicle.id];

            // Determine which list to check based on selected TOUR TYPE
            // If tourType is 'Umihotaru Tour', check umihotaruDates
            // If tourType is 'Daikoku Tour' (default), check daikokuDates
            let targetDates = [];
            if (availabilityData) {
                if (tourType === 'Umihotaru Tour') {
                    targetDates = availabilityData.umihotaruDates || [];
                } else {
                    targetDates = availabilityData.daikokuDates || [];
                    // Backwards compatibility: if daikokuDates is empty/undefined, 
                    // check 'availableDates' (legacy) if it exists, just in case.
                    if ((!targetDates || targetDates.length === 0) && availabilityData.availableDates) {
                        targetDates = availabilityData.availableDates;
                    }
                }
            }

            // 1. Check Driver Availability (Explicit "I'm free")
            // If the date is NOT in the allowed list, BLOCK IT.
            if (!targetDates || !targetDates.includes(dateString)) {
                disabled.push(vehicle.id);
                return; // Already disabled, no need to check bookings
            }

            // 2. Check Existing Bookings (Collision Detection)
            // If there is ANY confirmed/pending booking for this vehicle on this date, BLOCK IT.
            // Note: date format in booking might need normalization. Bookings save date as `toDateString()`: "Fri Feb 14 2025"
            // selectedDate.toDateString() matches that format.
            const isBooked = bookings.some(booking => {
                // Check if date matches
                if (booking.date !== selectedDate.toDateString()) return false;

                // Check if this vehicle is the one selected in the booking
                // booking.options.selectedVehicle holds the ID or 'none'
                return booking.options && booking.options.selectedVehicle === vehicle.id;
            });

            if (isBooked) {
                disabled.push(vehicle.id);
            }
        });

        // 3. "Late Booking" Logic:
        // If it is TODAY, and current time is past 1:00 AM,
        // Block ALL specific vehicles. Only "Random R34" (which selects 'none') is allowed until 15:00.
        // The Calendar component handles the 15:00 Hard Cutoff for the date itself.
        const now = new Date();
        if (
            selectedDate.getDate() === now.getDate() &&
            selectedDate.getMonth() === now.getMonth() &&
            selectedDate.getFullYear() === now.getFullYear()
        ) {
            if (now.getHours() >= 1) {
                // Block all specific vehicles if they aren't already blocked
                vehicles.forEach(v => {
                    if (!disabled.includes(v.id)) {
                        disabled.push(v.id);
                    }
                });
            }
        }

        return disabled;
    };

    // ... (existing code for price calculation etc.) ...
    const disabledVehicles = getDisabledVehicles();

    // Calculate base price from selected date
    const basePrice = selectedDate ? getPriceForDate(selectedDate, personCount, tourType) : 0;

    const getVehiclePrice = (vehicleId) => {
        if (vehicleId === 'none') return 0;

        // Find vehicle in state
        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (vehicle) {
            return Number(vehicle.price) || 0;
        }

        // Fallback for hardcoded IDs if they still exist or during transition
        switch (vehicleId) {
            case 'vehicle1': return 5000;
            case 'vehicle2': return 15000;
            case 'vehicle3': return 5000;
            case 'vehicle4': return 5000;
            default: return 0;
        }
    };

    // Calculate options total
    const vehiclePrice1 = getVehiclePrice(options.selectedVehicle);
    const vehiclePrice2 = personCount >= 4 ? getVehiclePrice(options.selectedVehicle2) : 0;

    const optionsTotal =
        (options.tokyoTower ? 5000 : 0) +
        (options.shibuya ? 5000 : 0) +
        vehiclePrice1 +
        vehiclePrice2;

    const totalPrice = basePrice + optionsTotal;
    const depositAmount = calculateDeposit(personCount);
    const carCount = depositAmount / 5000; // Assuming 5000 per car

    const handleCheckout = async () => {
        // Basic validation
        if (!guestInfo.name) {
            alert("Please enter your full name.");
            return;
        }
        if (!guestInfo.email) {
            alert("Please enter your email address.");
            return;
        }
        if (!guestInfo.instagram) {
            alert("Please enter your Instagram ID.");
            return;
        }

        const confirmData = {
            name: guestInfo.name,
            email: guestInfo.email,
            instagram: guestInfo.instagram,
            whatsapp: guestInfo.whatsapp,
            hotel: guestInfo.hotel,
            date: selectedDate?.toDateString(),
            tourType: tourType,
            guests: personCount,
            options: options,
            vehiclePrice1: vehiclePrice1,
            vehiclePrice2: vehiclePrice2,
            totalToken: totalPrice,
            deposit: depositAmount,
            status: "Pending", // Initial status
            timestamp: new Date()
        };

        // Save to Firestore
        try {
            await addDoc(collection(db, "bookings"), confirmData);

            // AUTO-BLOCK LOGIC: Connect Vehicle Availability
            const dateString = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

            // Helper to block a single vehicle
            const blockVehicle = async (vehId) => {
                if (!vehId || vehId === 'none') return;

                const availabilityRef = doc(db, "vehicle_availability", vehId);
                const updates = {};

                if (tourType === 'Umihotaru Tour') {
                    updates.umihotaruDates = arrayRemove(dateString);
                } else {
                    updates.daikokuDates = arrayRemove(dateString);
                }

                await updateDoc(availabilityRef, updates);
                console.log(`Auto-block successful for vehicle ${vehId} (${tourType})`);
            };

            await blockVehicle(options.selectedVehicle);

            // Block 2nd vehicle if applicable
            if (personCount >= 4) {
                await blockVehicle(options.selectedVehicle2);
            }

        } catch (e) {
            console.error("Error saving booking or auto-blocking: ", e);
            alert("Booking Error: Please try again. " + e.message);
            setIsLoading(false);
            return; // Stop here if save fails
        }

        // Send Email Notification (Async)
        try {
            // Helper to resolve vehicle name
            const resolveVehName = (id) => {
                if (!id || id === 'none') return "Random R34";
                const v = vehicles.find(x => x.id === id);
                return v ? `${v.name}${v.subtitle ? ` (${v.subtitle})` : ''}` : id;
            };

            const vName1 = resolveVehName(options.selectedVehicle);
            let finalVehicleString = vName1;

            if (personCount >= 4) {
                const vName2 = resolveVehName(options.selectedVehicle2);
                finalVehicleString = `Car 1: ${vName1}, Car 2: ${vName2}`;
            }

            // For driver email, we still prioritize the first car's driver if specific
            const selectedVehicleData = vehicles.find(v => v.id === options.selectedVehicle);

            const notificationData = {
                ...confirmData,
                driverEmail: selectedVehicleData ? selectedVehicleData.driverEmail : null,
                vehicleName: finalVehicleString // Passed to email template
            };

            import('../utils/notifications').then(({ sendBookingNotification }) => {
                sendBookingNotification(notificationData);
            });
        } catch (emailError) {
            console.warn("Email notification failed to trigger:", emailError);
        }

        if (USE_SHOPIFY) {
            setIsLoading(true);
            try {
                // Pass localized string or simple values to Shopify if needed
                const checkoutUrl = await createShopifyCheckout(depositAmount, carCount, confirmData);
                if (checkoutUrl) {
                    window.location.href = checkoutUrl; // Redirect to Shopify
                } else {
                    alert("Shopify configuration error. Please check console.");
                    setIsLoading(false);
                }
            } catch (error) {
                alert("Checkout Error: " + error.message);
                setIsLoading(false);
            }
        } else {
            // Mock Success
            setBookingData(confirmData);
            setView('success');
            window.scrollTo(0, 0);
        }
    };

    const handleReset = () => {
        setView('booking');
        setBookingData(null);
        setSelectedDate(null);
        setGuestInfo({ name: '', email: '', hotel: '', instagram: '', whatsapp: '' });
        window.scrollTo(0, 0);
    };

    return (
        <div className="app-container">
            <header className="app-header">
                <img
                    src={logo}
                    alt="Highway Godzilla"
                    style={{
                        maxWidth: '90%',
                        width: '400px',
                        height: 'auto',
                        marginBottom: '0.5rem'
                    }}
                />
                <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    margin: '0.5rem 0',
                    letterSpacing: '2px',
                    color: '#E60012'
                }}>
                    TOUR BOOKING
                </h2>
                <p className="subtitle">Select your group size and date</p>
            </header>

            <main className="main-content">
                {view === 'booking' ? (
                    <>
                        <BookingSummary
                            selectedDate={selectedDate}
                            personCount={personCount}
                            totalPrice={totalPrice}
                            tourType={tourType}
                        />

                        <div className="control-panel">
                            <PeopleSelector
                                value={personCount}
                                onChange={setPersonCount}
                            />
                        </div>

                        <div className="calendar-section">
                            <Calendar
                                personCount={personCount}
                                selectedDate={selectedDate}
                                onDateSelect={handleDateSelect}
                            />
                        </div>

                        {selectedDate && (
                            <div className="tour-type-section" style={{ marginTop: '2rem' }}>
                                <TourTypeSelector
                                    selectedTour={tourType}
                                    onSelect={setTourType}
                                    selectedDate={selectedDate}
                                    dateSlots={selectedDateSlots}
                                />
                            </div>
                        )}

                        <div className="options-section">
                            <OptionsSelector
                                options={options}
                                onChange={setOptions}
                                disabledVehicles={disabledVehicles}
                                vehicles={vehicles}
                                personCount={personCount}
                                isLoading={isVehiclesLoading}
                            />
                        </div>

                        <div className="guest-info-section">
                            <GuestInfo
                                formData={guestInfo}
                                onChange={setGuestInfo}
                            />
                        </div>

                        <div className="checkout-section">
                            <CheckoutPanel
                                selectedDate={selectedDate}
                                personCount={personCount}
                                options={options}
                                tourPrice={basePrice}
                                vehiclePrice1={vehiclePrice1}
                                vehiclePrice2={vehiclePrice2}
                                onCheckout={handleCheckout}
                                isLoading={isLoading}
                            />
                        </div>
                    </>
                ) : (
                    <Confirmation
                        bookingDetails={bookingData}
                        onReset={handleReset}
                    />
                )}
            </main>

            {/* Cancel Policy Section */}
            <div style={{
                padding: '2rem',
                textAlign: 'left',
                color: '#aaa',
                fontSize: '0.9rem',
                background: '#1a1a1a',
                marginTop: '3rem',
                borderTop: '1px solid #333',
                lineHeight: '1.6'
            }}>
                <h3 style={{ color: '#E60012', marginBottom: '1rem', fontSize: '1.1rem' }}>Cancel Policy</h3>
                <ul style={{ paddingLeft: '1.5rem', listStyleType: 'disc' }}>
                    <li>Free cancellation up to 7 days before the tour date.</li>
                    <li>Cancellations made within 7 days are subject to a deposit fee (¥5,000 per car), which is non-refundable.</li>
                    <li>Date changes are allowed up to 24 hours before the tour (subject to availability).</li>
                </ul>
            </div>
        </div>
    );
}

export default Home;
