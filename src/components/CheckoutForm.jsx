import React, { useState } from 'react';
import { useStripe, useElements, CardNumberElement, CardExpiryElement, CardCvcElement } from '@stripe/react-stripe-js';

const CheckoutForm = ({ onPaymentSuccess, onCancel, bookingDetails }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [errorMessage, setErrorMessage] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isReady, setIsReady] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!stripe || !elements) {
            // Stripe.js has not yet loaded.
            return;
        }

        setIsProcessing(true);
        setErrorMessage(null);

        try {
            const cardElement = elements.getElement(CardNumberElement);

            // Confirm the payment
            const { error, paymentIntent } = await stripe.confirmCardPayment(bookingDetails.clientSecret, {
                payment_method: {
                    card: cardElement,
                    billing_details: {
                        name: bookingDetails.name,
                        email: bookingDetails.email,
                    },
                },
            });

            if (error) {
                // Show error to your customer (e.g., insufficient funds)
                setErrorMessage(error.message);
                setIsProcessing(false);
            } else if (paymentIntent && paymentIntent.status === 'succeeded') {
                // The payment has been processed!
                onPaymentSuccess(paymentIntent);
                setIsProcessing(false);
            } else {
                setErrorMessage("Unexpected payment status: " + (paymentIntent?.status || 'unknown'));
                setIsProcessing(false);
            }
        } catch (e) {
            setErrorMessage("An unexpected error occurred: " + e.message);
            setIsProcessing(false);
        }
    };

    return (
        <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <h3 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>Secure Payment</h3>
            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #ddd' }}>
                <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#666' }}>Deposit Amount:</p>
                <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#E60012' }}>
                    ¥{bookingDetails.deposit.toLocaleString()}
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                <div style={{ padding: '15px', border: '1px solid #ccc', borderRadius: '5px', backgroundColor: '#fff', marginBottom: '20px' }}>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: '#555', fontWeight: 'bold' }}>Card Number</label>
                        <div style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#fafafa' }}>
                            <CardNumberElement
                                onReady={() => setIsReady(true)}
                                options={{
                                    style: { base: { fontSize: '16px', color: '#424770', '::placeholder': { color: '#aab7c4' } }, invalid: { color: '#9e2146' } },
                                }}
                            />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: '#555', fontWeight: 'bold' }}>MM / YY</label>
                            <div style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#fafafa' }}>
                                <CardExpiryElement
                                    options={{
                                        style: { base: { fontSize: '16px', color: '#424770', '::placeholder': { color: '#aab7c4' } }, invalid: { color: '#9e2146' } },
                                    }}
                                />
                            </div>
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: '#555', fontWeight: 'bold' }}>CVC</label>
                            <div style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#fafafa' }}>
                                <CardCvcElement
                                    options={{
                                        style: { base: { fontSize: '16px', color: '#424770', '::placeholder': { color: '#aab7c4' } }, invalid: { color: '#9e2146' } },
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {errorMessage && (
                    <div style={{ color: '#E60012', marginTop: '15px', fontSize: '0.9rem', padding: '10px', backgroundColor: '#ffe6e6', borderRadius: '4px' }}>
                        {errorMessage}
                    </div>
                )}

                <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isProcessing}
                        style={{
                            flex: 1,
                            padding: '12px',
                            backgroundColor: '#666',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            cursor: isProcessing ? 'not-allowed' : 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={!stripe || !isReady || isProcessing}
                        style={{
                            flex: 1,
                            padding: '12px',
                            backgroundColor: isProcessing ? '#999' : '#0066cc',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            cursor: isProcessing ? 'not-allowed' : 'pointer',
                            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
                        }}
                    >
                        {isProcessing ? (
                            <>
                                <span className="spinner" style={{ width: '16px', height: '16px', border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
                                Processing...
                            </>
                        ) : 'Pay & Book'}
                    </button>
                </div>
            </form>
            <style>
                {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
            </style>
        </div>
    );
};

export default CheckoutForm;
