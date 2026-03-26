import React, { useState } from 'react';
import PeopleSelector from '../components/PeopleSelector';
import Calendar from '../components/Calendar';
import PlanSelector from '../components/PlanSelector';
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

function Home({ isDedicatedPage = false }) {
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

    const [planType, setPlanType] = useState('Standard Plan');
    const [personCount, setPersonCount] = useState(2);
    const [carCount, setCarCount] = useState(1);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedDateSlots, setSelectedDateSlots] = useState({}); // Stores availability for selected date
    const [globalSettings, setGlobalSettings] = useState({ is1130Enabled: true }); // Global controls

    // Used to skip form fields internally
    const [vehicleAvailability, setVehicleAvailability] = useState({}); // { vehicleId: [blockedDates] }
    const [vehicles, setVehicles] = useState([]); // Dynamic vehicles from Firestore

    const [options, setOptions] = useState({
        selectedVehicle: 'none', // 'none', 'vehicle1', 'vehicle2', 'vehicle3' or ID
        selectedVehicle2: 'none', // For groups of 4-6
        selectedVehicle3: 'none', // For groups of 7-9
        selectedVehicle4: 'none',
        selectedVehicle5: 'none',
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

        // Global Settings
        const unsubscribeSettings = onSnapshot(doc(db, "settings", "global"), (docSnapshot) => {
            if (docSnapshot.exists()) {
                setGlobalSettings(docSnapshot.data());
            } else {
                setGlobalSettings({ is1130Enabled: true });
            }
        });

        return () => {
            unsubscribeAvailability();
            unsubscribeVehicles();
            unsubscribeBookings();
            unsubscribeSettings();
        };
    }, []);

    const handleDateSelect = (date, slots) => {
        setSelectedDate(date);
        setSelectedDateSlots(slots || {});
        // Determine whether this new date qualifies as a late booking with randomCars
        const now = new Date();
        let isLate = false;
        let isLateMidnight = false;
        if (
            date.getDate() === now.getDate() &&
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear()
        ) {
            if (planType === 'Midnight Plan') {
                if (now.getHours() >= 19 && date.getDay() !== 0) isLateMidnight = true;
                if (now.getHours() >= 19) isLate = true; // Still triggers random car fallback
            }
            if (planType !== 'Midnight Plan' && now.getHours() >= 7) isLate = true;
        }

        // Reset vehicle selection when date changes, as availability might differ
        setOptions(prev => ({
            ...prev,
            midnightTimeSlot: isLateMidnight ? '11:30 PM' : '8:30 PM',
            selectedVehicle: isLate ? 'random-cars' : 'none',
            selectedVehicle2: isLate ? 'random-cars' : 'none',
            selectedVehicle3: isLate ? 'random-cars' : 'none',
            selectedVehicle4: isLate ? 'random-cars' : 'none',
            selectedVehicle5: isLate ? 'random-cars' : 'none'
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
                if (planType === 'Midnight Plan') {
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
        // If it is TODAY, and current time is past the cutoff,
        // Block ALL specific vehicles. Only "Random R34" (which selects 'none') is allowed if they somehow bypass the calendar.
        // The Calendar component handles the Hard Cutoff for the date itself.
        const now = new Date();
        let specificCarsClosed = false;
        if (
            selectedDate.getDate() === now.getDate() &&
            selectedDate.getMonth() === now.getMonth() &&
            selectedDate.getFullYear() === now.getFullYear()
        ) {
            // Specific cars cutoff
            if (planType === 'Midnight Plan' && now.getHours() >= 19) specificCarsClosed = true;
            if (planType !== 'Midnight Plan' && now.getHours() >= 7) specificCarsClosed = true;
            
            if (specificCarsClosed) {
                // Block all specific vehicles if they aren't already blocked
                vehicles.forEach(v => {
                    if (!disabled.includes(v.id)) {
                        disabled.push(v.id);
                    }
                });
            }
        }

        // 3.5 11:30 PM Midnight Tour Force Random R34
        if (planType === 'Midnight Plan' && options.midnightTimeSlot === '11:30 PM') {
            vehicles.forEach(v => {
                if (!disabled.includes(v.id)) {
                    disabled.push(v.id);
                }
            });
        }

        // 4. Explicit check for "Random R34" since it is not a database vehicle
        const randomData = vehicleAvailability['random-r34'];
        let randomDates = [];
        if (randomData) {
            if (planType === 'Midnight Plan') {
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

        // Force UNBLOCK Random R34 if 11:30 PM slot is selected, because it's the only option and must be bookable
        if (planType === 'Midnight Plan' && options.midnightTimeSlot === '11:30 PM') {
            const idx = disabled.indexOf('random-r34');
            if (idx > -1) {
                disabled.splice(idx, 1);
            }
        }

        return disabled;
    };

    const handlePlanTypeChange = (type) => {
        setPlanType(type);
    };

    const handlePersonCountChange = (newCount) => {
        setPersonCount(newCount);
        
        // Always reset to minimum required cars when guest count changes 
        // to prevent users from getting stuck with expensive multi-car selections 
        const minCars = Math.ceil(newCount / 3);
        setCarCount(minCars);
    };

    // Enforce optional rules whenever planType changes
    React.useEffect(() => {
        setOptions(prev => {
            const newOpts = { ...prev };
            let hasChanges = false;
            
            // Tokyo Tower rule for Midnight
            if (planType === 'Midnight Plan' && prev.tokyoTower) {
                newOpts.tokyoTower = false;
                hasChanges = true;
            }
            
            // Vehicle restriction for Sunday Morning
            if (planType === 'Sunday Morning Plan') {
                if (prev.selectedVehicle !== 'none') { newOpts.selectedVehicle = 'none'; hasChanges = true; }
                if (prev.selectedVehicle2 !== 'none') { newOpts.selectedVehicle2 = 'none'; hasChanges = true; }
                if (prev.selectedVehicle3 !== 'none') { newOpts.selectedVehicle3 = 'none'; hasChanges = true; }
                if (prev.selectedVehicle4 !== 'none') { newOpts.selectedVehicle4 = 'none'; hasChanges = true; }
                if (prev.selectedVehicle5 !== 'none') { newOpts.selectedVehicle5 = 'none'; hasChanges = true; }
            }
            
            return hasChanges ? newOpts : prev;
        });
    }, [planType]);

    // ... (existing code for price calculation etc.) ...
    const disabledVehicles = getDisabledVehicles();

    // Calculate base price from selected date
    const basePrice = selectedDate ? getPriceForDate(selectedDate, personCount, carCount, planType) : 0;

    const getVehiclePrice = (vehicleId) => {
        if (vehicleId === 'none' || vehicleId === 'random-cars') return 0;

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

    const vehiclePrice1 = getVehiclePrice(options.selectedVehicle);
    const vehiclePrice2 = carCount >= 2 ? getVehiclePrice(options.selectedVehicle2) : 0;
    const vehiclePrice3 = carCount >= 3 ? getVehiclePrice(options.selectedVehicle3) : 0;
    const vehiclePrice4 = carCount >= 4 ? getVehiclePrice(options.selectedVehicle4) : 0;
    const vehiclePrice5 = carCount >= 5 ? getVehiclePrice(options.selectedVehicle5) : 0;

    const currentCarCount = carCount;

    const optionsTotal =
        (options.tokyoTower ? 5000 * currentCarCount : 0) +
        (options.shibuya ? 5000 * currentCarCount : 0) +
        vehiclePrice1 +
        vehiclePrice2 +
        vehiclePrice3 +
        vehiclePrice4 +
        vehiclePrice5;

    const totalPrice = basePrice + optionsTotal;
    const depositAmount = calculateDeposit(personCount, carCount);
    // const carCountDisplay = depositAmount / 5000; // Unused

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
            if (id === 'none') return "Random R34";
            if (id === 'random-cars') return "Random cars";
            const v = vehicles.find(x => x.id === id);
            return v ? `${v.name}${v.subtitle ? ` (${v.subtitle})` : ''}` : id;
        };
        const vName1 = resolveVehName(options.selectedVehicle);
        const vName2 = carCount >= 2 ? resolveVehName(options.selectedVehicle2) : null;
        const vName3 = carCount >= 3 ? resolveVehName(options.selectedVehicle3) : null;
        const vName4 = carCount >= 4 ? resolveVehName(options.selectedVehicle4) : null;
        const vName5 = carCount >= 5 ? resolveVehName(options.selectedVehicle5) : null;

        const confirmData = {
            name: guestInfo.name,
            email: guestInfo.email,
            instagram: guestInfo.instagram,
            whatsapp: guestInfo.whatsapp,
            remarks: guestInfo.remarks || "",
            hotel: guestInfo.hotel,
            date: selectedDate?.toDateString(),
            tourType: planType, // Keeping the field name 'tourType' in Firestore for backwards compat but storing the new plan name
            guests: personCount,
            carCount: carCount,
            options: options,
            vehiclePrice1: vehiclePrice1,
            vehiclePrice2: vehiclePrice2,
            vehiclePrice3: vehiclePrice3,
            vehiclePrice4: vehiclePrice4,
            vehiclePrice5: vehiclePrice5,
            vehicleName1: vName1,
            vehicleName2: vName2,
            vehicleName3: vName3,
            vehicleName4: vName4,
            vehicleName5: vName5,
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

            // Track Meta Pixel Purchase Event
            if (window.fbq) {
                window.fbq('track', 'Purchase', {
                    currency: 'JPY',
                    value: finalBookingData.amountPaid || pendingBookingData.totalToken
                });
            }

            // AUTO-BLOCK LOGIC
            const dateString = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
            const blockVehicle = async (vehId) => {
                if (!vehId || vehId === 'none') return;
                const availabilityRef = doc(db, "vehicle_availability", vehId);
                const updates = {};
                if (planType === 'Midnight Plan') {
                    updates.umihotaruDates = arrayRemove(dateString);
                } else {
                    updates.daikokuDates = arrayRemove(dateString);
                }
                await updateDoc(availabilityRef, updates);
            };

            await blockVehicle(options.selectedVehicle);
            if (carCount >= 2) {
                await blockVehicle(options.selectedVehicle2);
            }
            if (carCount >= 3) {
                await blockVehicle(options.selectedVehicle3);
            }
            if (carCount >= 4) {
                await blockVehicle(options.selectedVehicle4);
            }
            if (carCount >= 5) {
                await blockVehicle(options.selectedVehicle5);
            }

            // Send Email (Async)
            // ... (Copy existing email logic) ...
            // Simplified for brevity in this replacement, but crucial to keep.
            // I will re-include the email logic in a separate block or verify it remains if I don't overwrite it.
            // WAIT, I am overwriting the WHOLE handleCheckout. I MUST Include email logic here.

            try {
                const resolveVehName = (id) => {
                    if (id === 'none') return "Random R34";
                    if (id === 'random-cars') return "Random cars";
                    const v = vehicles.find(x => x.id === id);
                    return v ? `${v.name}${v.subtitle ? ` (${v.subtitle})` : ''}` : id;
                };
                const vName1 = resolveVehName(options.selectedVehicle);
                let finalVehicleString = vName1;
                if (carCount >= 2) {
                    const vName2 = resolveVehName(options.selectedVehicle2);
                    finalVehicleString += `, Car 2: ${vName2}`;
                }
                if (carCount >= 3) {
                    const vName3 = resolveVehName(options.selectedVehicle3);
                    finalVehicleString += `, Car 3: ${vName3}`;
                }
                if (carCount >= 4) {
                    const vName4 = resolveVehName(options.selectedVehicle4);
                    finalVehicleString += `, Car 4: ${vName4}`;
                }
                if (carCount >= 5) {
                    const vName5 = resolveVehName(options.selectedVehicle5);
                    finalVehicleString += `, Car 5: ${vName5}`;
                }

                const actualVehicleId = options.selectedVehicle === 'none' ? 'random-r34' : options.selectedVehicle;
                const selectedVehicleData = vehicles.find(v => v.id === actualVehicleId);

                // Compute exact slug to match driver portal URL (for Admin Email)
                const getSlug = (id) => {
                    if (id === 'none') return 'random-r34';
                    if (id === 'random-cars') return 'random-cars';
                    const v = vehicles.find(x => x.id === id);
                    return (v && v.slug) ? v.slug : id;
                };
                let adminVehicleSlug = getSlug(options.selectedVehicle);
                if (carCount >= 2) adminVehicleSlug += `, Car 2: ${getSlug(options.selectedVehicle2)}`;
                if (carCount >= 3) adminVehicleSlug += `, Car 3: ${getSlug(options.selectedVehicle3)}`;
                if (carCount >= 4) adminVehicleSlug += `, Car 4: ${getSlug(options.selectedVehicle4)}`;
                if (carCount >= 5) adminVehicleSlug += `, Car 5: ${getSlug(options.selectedVehicle5)}`;

                let driverEmails = [];
                if (selectedVehicleData && selectedVehicleData.driverEmail) {
                    driverEmails.push(selectedVehicleData.driverEmail);
                }

                if (carCount >= 2) {
                    const actualVehicleId2 = options.selectedVehicle2 === 'none' ? 'random-r34' : options.selectedVehicle2;
                    const selectedVehicleData2 = vehicles.find(v => v.id === actualVehicleId2);
                    if (selectedVehicleData2 && selectedVehicleData2.driverEmail && !driverEmails.includes(selectedVehicleData2.driverEmail)) {
                        driverEmails.push(selectedVehicleData2.driverEmail);
                    }
                }
                
                if (carCount >= 3) {
                    const actualVehicleId3 = options.selectedVehicle3 === 'none' ? 'random-r34' : options.selectedVehicle3;
                    const selectedVehicleData3 = vehicles.find(v => v.id === actualVehicleId3);
                    if (selectedVehicleData3 && selectedVehicleData3.driverEmail && !driverEmails.includes(selectedVehicleData3.driverEmail)) {
                        driverEmails.push(selectedVehicleData3.driverEmail);
                    }
                }

                if (carCount >= 4) {
                    const actualVehicleId4 = options.selectedVehicle4 === 'none' ? 'random-r34' : options.selectedVehicle4;
                    const selectedVehicleData4 = vehicles.find(v => v.id === actualVehicleId4);
                    if (selectedVehicleData4 && selectedVehicleData4.driverEmail && !driverEmails.includes(selectedVehicleData4.driverEmail)) {
                        driverEmails.push(selectedVehicleData4.driverEmail);
                    }
                }

                if (carCount >= 5) {
                    const actualVehicleId5 = options.selectedVehicle5 === 'none' ? 'random-r34' : options.selectedVehicle5;
                    const selectedVehicleData5 = vehicles.find(v => v.id === actualVehicleId5);
                    if (selectedVehicleData5 && selectedVehicleData5.driverEmail && !driverEmails.includes(selectedVehicleData5.driverEmail)) {
                        driverEmails.push(selectedVehicleData5.driverEmail);
                    }
                }

                const notificationData = {
                    ...finalBookingData,
                    driverEmail: driverEmails.length > 0 ? driverEmails : null,
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
            {!isDedicatedPage && (
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
            )}

            <main className="main-content">
                {view === 'booking' ? (
                    <>
                        <BookingSummary
                            selectedDate={selectedDate}
                            personCount={personCount}
                            totalPrice={totalPrice}
                            tourType={planType}
                            options={options}
                        />

                        <div className="control-panel">
                            <PeopleSelector
                                value={personCount}
                                onChange={handlePersonCountChange}
                                carCount={carCount}
                                onCarCountChange={setCarCount}
                                planType={planType}
                            />
                        </div>

                        <div className="tour-type-section" style={{ marginTop: '1rem', width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <PlanSelector
                                selectedPlan={planType}
                                onSelect={handlePlanTypeChange}
                                selectedDate={selectedDate}
                                dateSlots={selectedDateSlots}
                                options={options}
                                onChangeOptions={setOptions}
                                globalSettings={globalSettings}
                            />
                        </div>

                        <div className="calendar-section">
                            <Calendar
                                personCount={personCount}
                                carCount={carCount}
                                selectedDate={selectedDate}
                                onDateSelect={handleDateSelect}
                                tourType={planType} // Pass the selected plan down to calendar
                            />
                        </div>

                        <div className="options-section" id="choose-ride" style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
                            <OptionsSelector
                                options={options}
                                onChange={setOptions}
                                disabledVehicles={disabledVehicles}
                                vehicles={vehicles}
                                personCount={personCount}
                                carCount={carCount}
                                isLoading={isVehiclesLoading}
                                tourType={planType}
                                selectedDate={selectedDate}
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
                                carCount={carCount}
                                options={options}
                                tourPrice={basePrice}
                                vehiclePrice1={vehiclePrice1}
                                vehiclePrice2={vehiclePrice2}
                                vehiclePrice3={vehiclePrice3}
                                vehiclePrice4={vehiclePrice4}
                                vehiclePrice5={vehiclePrice5}
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
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: '3rem', marginBottom: '2rem' }}>
                <div style={{
                    width: '100%',
                    maxWidth: '1000px',
                    padding: '1.5rem',
                    textAlign: 'left',
                    color: '#aaa',
                    fontSize: '0.9rem',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '8px',
                    lineHeight: '1.6'
                }}>
                    <h3 style={{ color: '#E60012', marginBottom: '1rem', fontSize: '1.05rem', marginTop: 0, fontWeight: 'bold', textTransform: 'uppercase' }}>Cancel Policy</h3>
                    <ul style={{ paddingLeft: '1.2rem', margin: 0, listStyleType: 'disc' }}>
                        <li>Free cancellation up to 10 days before the tour.</li>
                        <li>Cancellations within 10 days: deposit (¥5,000 per car) is non-refundable.</li>
                        <li>No-shows or same-day cancellations: full payment is non-refundable.</li>
                        <li>Date changes accepted up to 3 days before the tour.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default Home;
