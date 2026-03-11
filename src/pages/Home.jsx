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

import { collection, addDoc, onSnapshot, query, updateDoc, doc, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';
import '../App.css';

import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from '../components/CheckoutForm';
import CheckoutConfirmation from '../components/CheckoutConfirmation';
import logo from '../assets/header_logo.webp';

const stripePromise = loadStripe("pk_live_51T1H5Y1RaFsVb792RMf9QD8VAhb9lyLkVp31e8hAbpCQts42MMsJhJexuNn3NitpZoU40mgBYsTPeicI9ilVWosK00bu7R8PCr"); // Publishable Key

// Toggle this to enable Shopify Checkout
const USE_SHOPIFY = false;

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

    // Scroll to section if hash is present in URL
    React.useEffect(() => {
        if (!isVehiclesLoading && window.location.hash) {
            setTimeout(() => {
                const id = window.location.hash.replace('#', '');
                const element = document.getElementById(id);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 600); // increased timeout to allow all images and child components to render first
        }
    }, [isVehiclesLoading]);

    const [tourType, setTourType] = useState('Daikoku Tour');
    const [personCount, setPersonCount] = useState(2);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedDateSlots, setSelectedDateSlots] = useState({}); // Stores availability for selected date

    // Used to skip form fields internally
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

    const [, setStatus] = useState({ vehicles: 'init', bookings: 'init', avail: 'init' });

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
            // Filter out hidden vehicles (treat undefined as visible for backward compatibility)
            const finalVehicles = vehicleData
                .filter(v => v.isVisible !== false)
                .sort((a, b) => {
                    // Treat 0, null, or undefined as 999 (bottom of list)
                    const getOrder = (o) => (!o || o === 0) ? 999 : o;
                    return getOrder(a.displayOrder) - getOrder(b.displayOrder);
                });

            setVehicles(finalVehicles);
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
        // Reset vehicle selection when date changes, as availability might differ
        setOptions(prev => ({
            ...prev,
            selectedVehicle: 'none',
            selectedVehicle2: 'none'
        }));
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

                // Check if this vehicle is the one selected in either slot in the booking
                return booking.options && (booking.options.selectedVehicle === vehicle.id || booking.options.selectedVehicle2 === vehicle.id);
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

        // 4. Explicit check for "Random R34" since it is not a database vehicle
        const randomData = vehicleAvailability['random-r34'];
        let randomDates = [];
        if (randomData) {
            if (tourType === 'Umihotaru Tour') {
                randomDates = randomData.umihotaruDates || [];
            } else {
                randomDates = randomData.daikokuDates || [];
                if ((!randomDates || randomDates.length === 0) && randomData.availableDates) {
                    randomDates = randomData.availableDates;
                }
            }
        }
        
        // If not listed as open, block it
        if (!randomDates || !randomDates.includes(dateString)) {
            if (!disabled.includes('random-r34')) disabled.push('random-r34');
        }
        // NOTE: Random R34 has unlimited capacity, so we DO NOT block it even if other bookings exist for it.

        return disabled;
    };

    const handleTourTypeChange = (type) => {
        setTourType(type);
    };

    // Enforce Tokyo Tower option rule whenever tourType changes
    React.useEffect(() => {
        if (tourType === 'Umihotaru Tour') {
            setOptions(prev => {
                if (prev.tokyoTower) {
                    return { ...prev, tokyoTower: false };
                }
                return prev;
            });
        }
    }, [tourType]);

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

    const getCarCount = () => personCount >= 4 ? 2 : 1;
    const currentCarCount = getCarCount();

    const optionsTotal =
        (options.tokyoTower ? 5000 * currentCarCount : 0) +
        (options.shibuya ? 5000 * currentCarCount : 0) +
        vehiclePrice1 +
        vehiclePrice2;

    const totalPrice = basePrice + optionsTotal;
    const depositAmount = calculateDeposit(personCount);
    // const carCount = depositAmount / 5000; // Unused

    // Stripe Integration
    const [clientSecret, setClientSecret] = useState("");
    // const [showPaymentModal, setShowPaymentModal] = useState(false); // Unused
    const [pendingBookingData, setPendingBookingData] = useState(null);

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

        setIsLoading(true);

        const resolveVehName = (id) => {
            const v = vehicles.find(x => x.id === id);
            return v ? `${v.name}${v.subtitle ? ` (${v.subtitle})` : ''}` : (id === 'none' ? "Random R34" : id);
        };
        const vName1 = resolveVehName(options.selectedVehicle);
        const vName2 = personCount >= 4 ? resolveVehName(options.selectedVehicle2) : null;

        const confirmData = {
            name: guestInfo.name,
            email: guestInfo.email,
            instagram: guestInfo.instagram,
            whatsapp: guestInfo.whatsapp,
            remarks: guestInfo.remarks || "",
            hotel: guestInfo.hotel,
            date: selectedDate?.toDateString(),
            tourType: tourType,
            guests: personCount,
            options: options,
            vehiclePrice1: vehiclePrice1,
            vehiclePrice2: vehiclePrice2,
            vehicleName1: vName1,
            vehicleName2: vName2,
            totalToken: totalPrice,
            deposit: depositAmount,
            status: "Pending", // Will be updated to Confirmed after payment if we want, or keep Pending until manual check? 
            // Actually for Stripe, we should probably mark as "Paid" or "confirmed" if payment succeeds.
            // But let's keep "Pending" as the initial status before payment.
            timestamp: new Date()
        };

        setPendingBookingData(confirmData);

        // Transition to the confirmation/checkout view
        setView('checkout');
        window.scrollTo(0, 0);
        setIsLoading(false);
    };

    const handlePaymentSuccess = async (paymentIntent) => {
        // setShowPaymentModal(false); // Unused
        setIsLoading(true); // Show loading while saving to Firestore

        try {
            // Save to Firestore
            const finalBookingData = {
                ...pendingBookingData,
                paymentIntentId: paymentIntent.id,
                status: "Confirmed", // Auto-confirm!
                paymentStatus: "Paid",
                amountPaid: paymentIntent.amount
            };

            await addDoc(collection(db, "bookings"), finalBookingData);

            // AUTO-BLOCK LOGIC
            const dateString = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
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
            };

            await blockVehicle(options.selectedVehicle);
            if (personCount >= 4) {
                await blockVehicle(options.selectedVehicle2);
            }

            // Send Email (Async)
            // ... (Copy existing email logic) ...
            // Simplified for brevity in this replacement, but crucial to keep.
            // I will re-include the email logic in a separate block or verify it remains if I don't overwrite it.
            // WAIT, I am overwriting the WHOLE handleCheckout. I MUST Include email logic here.

            try {
                const resolveVehName = (id) => {
                    const v = vehicles.find(x => x.id === id);
                    return v ? `${v.name}${v.subtitle ? ` (${v.subtitle})` : ''}` : (id === 'none' ? "Random R34" : id);
                };
                const vName1 = resolveVehName(options.selectedVehicle);
                let finalVehicleString = vName1;
                if (personCount >= 4) {
                    const vName2 = resolveVehName(options.selectedVehicle2);
                    finalVehicleString = `Car 1: ${vName1}, Car 2: ${vName2}`;
                }

                const actualVehicleId = options.selectedVehicle === 'none' ? 'random-r34' : options.selectedVehicle;
                const selectedVehicleData = vehicles.find(v => v.id === actualVehicleId);

                // Compute exact slug to match driver portal URL (for Admin Email)
                const getSlug = (id) => {
                    if (id === 'none') return 'random-r34';
                    const v = vehicles.find(x => x.id === id);
                    return (v && v.slug) ? v.slug : id;
                };
                let adminVehicleSlug = getSlug(options.selectedVehicle);
                if (personCount >= 4) {
                    adminVehicleSlug = `Car 1: ${adminVehicleSlug}, Car 2: ${getSlug(options.selectedVehicle2)}`;
                }

                const notificationData = {
                    ...finalBookingData,
                    driverEmail: selectedVehicleData ? selectedVehicleData.driverEmail : null,
                    vehicleName: finalVehicleString,
                    adminVehicleSlug: adminVehicleSlug
                };
                const { sendBookingNotification } = await import('../utils/notifications');
                await sendBookingNotification(notificationData);
            } catch (emailError) {
                console.error("Email notification failed:", emailError);
            }

            setBookingData(finalBookingData);
            setView('success');
            window.scrollTo(0, 0);

        } catch (error) {
            console.error("Error saving booking:", error);
            alert("Payment successful but booking save failed. Please contact support.");
        } finally {
            setIsLoading(false);
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
                <a href="https://www.daikokuhunter.com/" className="back-to-website-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Website
                </a>
                <a href="https://www.daikokuhunter.com/" style={{ display: 'inline-block' }}>
                    <img
                        src={logo}
                        alt="DAIKOKU HUNTER"
                        style={{
                            maxWidth: '90%',
                            width: '600px', // Increased width for the new wide logo
                            height: 'auto',
                            marginBottom: '0.5rem' // Reduced from 1rem
                        }}
                    />
                </a>
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
                            <div className="tour-type-section" style={{ marginTop: '2rem', width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <TourTypeSelector
                                    selectedTour={tourType}
                                    onSelect={handleTourTypeChange}
                                    selectedDate={selectedDate}
                                    dateSlots={selectedDateSlots}
                                />
                            </div>
                        )}

                        <div className="options-section" id="choose-ride">
                            <OptionsSelector
                                options={options}
                                onChange={setOptions}
                                disabledVehicles={disabledVehicles}
                                vehicles={vehicles}
                                personCount={personCount}
                                isLoading={isVehiclesLoading}
                                tourType={tourType}
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

                        {/* Removed Embedded Payment Form */}
                    </>
                ) : view === 'checkout' && pendingBookingData ? (
                    <CheckoutConfirmation
                        bookingDetails={pendingBookingData}
                        onPaymentSuccess={handlePaymentSuccess}
                        onBack={() => {
                            setView('booking');
                            window.scrollTo(0, 0);
                        }}
                    />
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
                    <li>Date changes are allowed up to 48 hours before the tour (subject to availability).</li>
                </ul>
            </div>
        </div>
    );
}

export default Home;
