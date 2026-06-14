import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from '../components/CheckoutForm';

// Stripe public key
const stripePromise = loadStripe('pk_live_51H5Y1RaFsVb792O1jLrlIuLto0XyGzUe4p8X9vH1M4H4sZJ0KzX6yX2xW9zV8vH5x1M4H4sZJ0KzX6yX2xW9zV8'); // You may want to replace this with your environment variable

const CustomPayment = () => {
    const [searchParams] = useSearchParams();
    const urlAmount = searchParams.get('amount');

    const [amount, setAmount] = useState(urlAmount || '');
    const [name, setName] = useState('');

    const [isProcessing, setIsProcessing] = useState(false);
    const [clientSecret, setClientSecret] = useState(null);
    const [error, setError] = useState(null);
    const [isSuccess, setIsSuccess] = useState(false);

    // If amount is provided in URL, make it read-only
    const isAmountFixed = !!urlAmount;

    const handleCreateIntent = async (e) => {
        e.preventDefault();
        if (!amount || isNaN(amount) || amount <= 0) {
            setError("Please enter a valid amount.");
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            // Note: Update this URL after deploying the Firebase Function if necessary
            const functionUrl = window.location.hostname === 'localhost' 
                ? 'http://127.0.0.1:5001/daikoku-tour-booking/us-central1/createCustomPaymentIntent'
                : 'https://us-central1-daikoku-tour-booking.cloudfunctions.net/createCustomPaymentIntent';

            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: amount,
                    name: name
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to initialize payment');
            }

            const data = await response.json();
            setClientSecret(data.clientSecret);
        } catch (err) {
            console.error("Payment initialization error:", err);
            setError(err.message || 'An error occurred while connecting to the payment system.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePaymentSuccess = () => {
        setIsSuccess(true);
    };

    if (isSuccess) {
        return (
            <div style={{ maxWidth: '600px', margin: '40px auto', padding: '40px 20px', textAlign: 'center', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#4CAF50', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', margin: '0 auto 20px' }}>
                    ✓
                </div>
                <h1 style={{ color: '#333', marginBottom: '10px' }}>Payment Successful!</h1>
                <p style={{ color: '#666', marginBottom: '30px' }}>Thank you for your payment of ¥{Number(amount).toLocaleString()}.</p>
                <button 
                    onClick={() => window.location.href = '/'}
                    style={{ marginTop: '30px', padding: '12px 24px', backgroundColor: '#E60012', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    Return to Home
                </button>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '600px', margin: '40px auto', padding: '0 20px' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>Secure Payment</h1>

            {!clientSecret ? (
                <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                    <form onSubmit={handleCreateIntent}>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>Payment Amount (JPY) *</label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '15px', top: '12px', color: '#666', fontWeight: 'bold' }}>¥</span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    readOnly={isAmountFixed}
                                    required
                                    min="100"
                                    style={{
                                        width: '100%',
                                        padding: '12px 12px 12px 35px',
                                        fontSize: '1.2rem',
                                        border: '1px solid #ddd',
                                        borderRadius: '8px',
                                        backgroundColor: isAmountFixed ? '#f5f5f5' : '#fff',
                                        fontWeight: 'bold',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '30px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>Full Name *</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                placeholder="John Doe"
                                style={{ width: '100%', padding: '12px', fontSize: '1rem', border: '1px solid #ddd', borderRadius: '8px', boxSizing: 'border-box' }}
                            />
                        </div>

                        {error && (
                            <div style={{ backgroundColor: '#fee', color: '#c00', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem' }}>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isProcessing || !amount || !name}
                            style={{
                                width: '100%',
                                padding: '15px',
                                backgroundColor: isProcessing ? '#ccc' : '#E60012',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '1.1rem',
                                fontWeight: 'bold',
                                cursor: isProcessing ? 'not-allowed' : 'pointer',
                                transition: 'background-color 0.2s'
                            }}
                        >
                            {isProcessing ? 'Processing...' : 'Proceed to Payment'}
                        </button>
                    </form>
                </div>
            ) : (
                <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                    <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <span style={{ color: '#666' }}>Amount to pay:</span>
                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>¥{Number(amount).toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#666' }}>Name:</span>
                            <span style={{ fontWeight: '500' }}>{name}</span>
                        </div>
                    </div>

                    <Elements options={{ clientSecret, appearance: { theme: 'stripe' }, locale: 'en' }} stripe={stripePromise}>
                        <CheckoutForm
                            bookingDetails={{ clientSecret, name }}
                            onPaymentSuccess={handlePaymentSuccess}
                            onCancel={() => setClientSecret(null)}
                        />
                    </Elements>
                </div>
            )}
        </div>
    );
};

export default CustomPayment;
