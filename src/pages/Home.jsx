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
import { collection, addDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import '../App.css';

// Toggle this to enable Shopify Checkout
const USE_SHOPIFY = true;

function Home() {
    const [view, setView] = useState('booking'); // 'booking' or 'success'
    const [bookingData, setBookingData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const [tourType, setTourType] = useState('Daikoku Tour');
    const [personCount, setPersonCount] = useState(2);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedDateSlots, setSelectedDateSlots] = useState({}); // Stores availability for selected date
    const [vehicleAvailability, setVehicleAvailability] = useState({}); // { vehicleId: [blockedDates] }
    const [options, setOptions] = useState({
        selectedVehicle: 'none', // 'none', 'vehicle1', 'vehicle2', 'vehicle3'
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

    // Fetch vehicle availability
    React.useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "vehicle_availability"), (snapshot) => {
            const data = {};
            snapshot.forEach((doc) => {
                data[doc.id] = doc.data().availableDates || [];
            });
            setVehicleAvailability(data);
        });
        return () => unsubscribe();
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
        Object.keys(vehicleAvailability).forEach(vehicleId => {
            // Logic change: If date is NOT in availableDates, it is disabled (Blocked by default)
            const availableDates = vehicleAvailability[vehicleId];
            if (!availableDates.includes(dateString)) {
                disabled.push(vehicleId);
            }
        });
        return disabled;
    };

    const disabledVehicles = getDisabledVehicles();

    // Calculate base price from selected date
    const basePrice = selectedDate ? getPriceForDate(selectedDate, personCount) : 0;

    const getVehiclePrice = (vehicle) => {
        switch (vehicle) {
            case 'vehicle1': return 5000;  // R34 - Bayside Blue
            case 'vehicle2': return 15000; // R34 - 600hp
            case 'vehicle3': return 5000;  // R32 - GTR
            case 'vehicle4': return 5000;  // Supra - Purple
            default: return 0;             // None / Random
        }
    };

    // Calculate options total
    const optionsTotal =
        (options.tokyoTower ? 5000 : 0) +
        (options.shibuya ? 5000 : 0) +
        getVehiclePrice(options.selectedVehicle);

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
            totalToken: totalPrice,
            deposit: depositAmount,
            status: "Pending", // Initial status
            timestamp: new Date()
        };

        // Save to Firestore
        try {
            await addDoc(collection(db, "bookings"), confirmData);
        } catch (e) {
            console.error("Error saving booking: ", e);
            // Continue to shopify even if save fails, or alert? 
            // Better to alert but let them pay if possible, but for now just log.
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
                <h1>DAIKOKU TOUR</h1>
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
        </div>
    );
}

export default Home;
