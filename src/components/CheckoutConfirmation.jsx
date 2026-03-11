import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from './CheckoutForm';

// It is safe to use the publishable key here, same as in Home.jsx
const stripePromise = loadStripe("pk_live_51T1H5Y1RaFsVb792RMf9QD8VAhb9lyLkVp31e8hAbpCQts42MMsJhJexuNn3NitpZoU40mgBYsTPeicI9ilVWosK00bu7R8PCr");

const CheckoutConfirmation = ({ bookingDetails, onPaymentSuccess, onBack }) => {
    const [clientSecret, setClientSecret] = useState(bookingDetails.clientSecret || null);
    const [isLoading, setIsLoading] = useState(!bookingDetails.clientSecret);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPaymentIntent = async () => {
            if (clientSecret) return; // Already have it from Home.jsx potentially? Actually, Home.jsx won't fetch it anymore.

            setIsLoading(true);
            setError(null);

            try {
                // Determine function URL. Similar to Home.jsx
                const functionUrl = `https://createpaymentintent-3womlkherq-uc.a.run.app`;

                const response = await fetch(functionUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        guests: bookingDetails.guests,
                        tourType: bookingDetails.tourType,
                        options: bookingDetails.options
                    }),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Server error: ${response.status}`);
                }

                const data = await response.json();
                setClientSecret(data.clientSecret);

                // We don't update parent state here, we just pass the secret to the Elements provider
                bookingDetails.clientSecret = data.clientSecret;

            } catch (err) {
                console.error("Error fetching client secret:", err);
                setError("Failed to initialize payment. Please try again or go back.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchPaymentIntent();
    }, [bookingDetails, clientSecret]);

    const formatPrice = (price) => {
        return "¥" + (price || 0).toLocaleString();
    };

    const currentCarCount = bookingDetails.guests >= 4 ? 2 : 1;
    const tokyoTowerCost = bookingDetails.options?.tokyoTower ? 5000 * currentCarCount : 0;
    const shibuyaCost = bookingDetails.options?.shibuya ? 5000 * currentCarCount : 0;

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>

            <button
                onClick={onBack}
                style={{
                    background: 'none',
                    border: 'none',
                    color: '#0066cc',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    marginBottom: '20px',
                    padding: '0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                }}
            >
                ← Back to Edit
            </button>

            <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>Review & Pay</h2>

            <div style={{
                background: '#fff',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                marginBottom: '30px'
            }}>
                <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginTop: 0, color: '#E60012' }}>Booking Details</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '10px', fontSize: '0.95rem', color: '#444' }}>
                    <strong style={{ color: '#666' }}>Name:</strong>
                    <span>{bookingDetails.name}</span>

                    <strong style={{ color: '#666' }}>Email:</strong>
                    <span>{bookingDetails.email}</span>

                    <strong style={{ color: '#666' }}>Tour:</strong>
                    <span>{bookingDetails.tourType}</span>

                    <strong style={{ color: '#666' }}>Date:</strong>
                    <span>{bookingDetails.date}</span>

                    <strong style={{ color: '#666' }}>Guests:</strong>
                    <span>{bookingDetails.guests} people</span>

                    <strong style={{ color: '#666' }}>Instagram ID:</strong>
                    <span>{bookingDetails.instagram}</span>

                    {bookingDetails.whatsapp && (
                        <>
                            <strong style={{ color: '#666' }}>WhatsApp:</strong>
                            <span>{bookingDetails.whatsapp}</span>
                        </>
                    )}

                    {bookingDetails.remarks && (
                        <>
                            <strong style={{ color: '#666' }}>Remarks:</strong>
                            <span style={{ whiteSpace: 'pre-wrap' }}>{bookingDetails.remarks}</span>
                        </>
                    )}

                    {bookingDetails.hotel && (
                        <>
                            <strong style={{ color: '#666' }}>Pickup:</strong>
                            <span>{bookingDetails.hotel}</span>
                        </>
                    )}
                </div>

                <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px dotted #ccc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span>Tour Price</span>
                        <span>{formatPrice(bookingDetails.totalToken - bookingDetails.vehiclePrice1 - bookingDetails.vehiclePrice2 - tokyoTowerCost - shibuyaCost)}</span>
                    </div>

                    {bookingDetails.vehiclePrice1 > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', color: '#666', fontSize: '0.9rem' }}>
                            <span>+ {bookingDetails.vehicleName1 || 'Vehicle Upgrade 1'}</span>
                            <span>{formatPrice(bookingDetails.vehiclePrice1)}</span>
                        </div>
                    )}
                    {bookingDetails.vehiclePrice2 > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', color: '#666', fontSize: '0.9rem' }}>
                            <span>+ {bookingDetails.vehicleName2 || 'Vehicle Upgrade 2'}</span>
                            <span>{formatPrice(bookingDetails.vehiclePrice2)}</span>
                        </div>
                    )}
                    {bookingDetails.options?.tokyoTower && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', color: '#666', fontSize: '0.9rem' }}>
                            <span>+ Tokyo Tower Photo {currentCarCount > 1 ? `(x${currentCarCount})` : ''}</span>
                            <span>{formatPrice(tokyoTowerCost)}</span>
                        </div>
                    )}
                    {bookingDetails.options?.shibuya && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', color: '#666', fontSize: '0.9rem' }}>
                            <span>+ Shibuya Crossing Photo {currentCarCount > 1 ? `(x${currentCarCount})` : ''}</span>
                            <span>{formatPrice(shibuyaCost)}</span>
                        </div>
                    )}

                        {/* Premium Breakdown Section */}
                    
                    <div style={{
                        marginTop: '20px',
                        background: '#f8f9fa',
                        borderRadius: '12px',
                        padding: '20px',
                        border: '1px solid #e9ecef'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <span style={{ fontWeight: '600', color: '#333', fontSize: '1.1rem' }}>Total Cost</span>
                            <span style={{ fontWeight: '700', color: '#1a1a2e', fontSize: '1.2rem' }}>{formatPrice(bookingDetails.totalToken)}</span>
                        </div>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: 'rgba(230, 0, 18, 0.05)',
                            border: '1px solid rgba(230, 0, 18, 0.2)',
                            borderRadius: '8px',
                            padding: '12px 15px',
                            margin: '0 -15px 10px -15px'
                        }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: '700', color: '#333' }}>Required Deposit</span>
                                <span style={{ fontSize: '0.8rem', color: '#666', marginTop: '2px' }}>(Pay Now via Card)</span>
                            </div>
                            <span style={{ fontWeight: '800', color: '#E60012', fontSize: '1.3rem' }}>{formatPrice(bookingDetails.deposit)}</span>
                        </div>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: '#e6f2ff',
                            border: '1px solid #cce5ff',
                            borderRadius: '8px',
                            padding: '12px 15px',
                            margin: '0 -15px'
                        }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: '700', color: '#0056b3' }}>Remaining Balance</span>
                                <span style={{ fontSize: '0.8rem', color: '#0056b3', marginTop: '2px', opacity: 0.8 }}>(Pay to Driver on Tour Day)</span>
                            </div>
                            <span style={{ fontWeight: '800', color: '#0066cc', fontSize: '1.3rem' }}>{formatPrice(bookingDetails.totalToken - bookingDetails.deposit)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{
                background: '#fff',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
            }}>
                <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginTop: 0, color: '#333' }}>Payment</h3>

                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                        <div style={{
                            display: 'inline-block',
                            width: '24px',
                            height: '24px',
                            border: '3px solid #ccc',
                            borderTop: '3px solid #E60012',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }}></div>
                        <p style={{ marginTop: '10px' }}>Loading secure payment form...</p>
                    </div>
                ) : error ? (
                    <div style={{ padding: '15px', color: '#E60012', background: '#ffe6e6', borderRadius: '8px', textAlign: 'center' }}>
                        {error}
                        <button onClick={() => window.location.reload()} style={{ display: 'block', margin: '10px auto 0', padding: '8px 16px', background: '#E60012', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Retry</button>
                    </div>
                ) : clientSecret ? (
                    <Elements options={{ clientSecret, appearance: { theme: 'stripe' } }} stripe={stripePromise}>
                        <CheckoutForm
                            bookingDetails={bookingDetails}
                            onPaymentSuccess={onPaymentSuccess}
                            onCancel={onBack}
                        />
                    </Elements>
                ) : null}
            </div>
            <style>
                {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
            </style>
        </div>
    );
};

export default CheckoutConfirmation;
