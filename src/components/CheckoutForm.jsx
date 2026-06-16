import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement, ExpressCheckoutElement } from '@stripe/react-stripe-js';

const CheckoutForm = ({ onPaymentSuccess, onCancel, bookingDetails }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [errorMessage, setErrorMessage] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [isExpressAvailable, setIsExpressAvailable] = useState(false);
    const [isAgreed, setIsAgreed] = useState(false);
    const [modalContent, setModalContent] = useState(null);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!stripe || !elements) {
            // Stripe.js has not yet loaded.
            return;
        }

        setIsProcessing(true);
        setErrorMessage(null);

        try {
            // ExpressCheckoutElement uses its own confirmation logic, but we still need the submit handler for the regular form
            let errorToHandle = null;
            let intentToHandle = null;

            // Confirm the payment
            const result = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: window.location.origin + window.location.pathname + '?payment_redirect=true',
                    payment_method_data: {
                        billing_details: {
                            name: bookingDetails.name,
                            email: bookingDetails.email,
                        }
                    }
                },
                redirect: 'if_required',
            });
            
            errorToHandle = result.error;
            intentToHandle = result.paymentIntent;

            if (errorToHandle) {
                // Show error to your customer (e.g., insufficient funds)
                setErrorMessage(errorToHandle.message);
                setIsProcessing(false);
            } else if (intentToHandle && intentToHandle.status === 'succeeded') {
                // The payment has been processed!
                onPaymentSuccess(intentToHandle);
                setIsProcessing(false);
            } else {
                setErrorMessage("Unexpected payment status: " + (intentToHandle?.status || 'unknown'));
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
                <div style={{ padding: '15px', border: '1px solid #ccc', borderRadius: '5px', backgroundColor: '#fff', marginBottom: '20px', minHeight: '200px' }}>
                    <div style={{ marginBottom: isExpressAvailable ? '20px' : '0' }}>
                        <ExpressCheckoutElement 
                            onClick={({ resolve }) => {
                                if (!isAgreed) {
                                    setErrorMessage('Please agree to the Terms of Service and Cancellation Policy before proceeding.');
                                    resolve({ behavior: 'preventDefault' });
                                } else {
                                    resolve();
                                }
                            }}
                            onConfirm={async (event) => {
                                setIsProcessing(true);
                                setErrorMessage(null);
                                try {
                                    const result = await stripe.confirmPayment({
                                        elements,
                                        confirmParams: {
                                            return_url: window.location.origin + window.location.pathname + '?payment_redirect=true',
                                        },
                                        redirect: 'if_required'
                                    });
                                    if (result.error) {
                                        setErrorMessage(result.error.message);
                                        setIsProcessing(false);
                                    } else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
                                        onPaymentSuccess(result.paymentIntent);
                                        setIsProcessing(false);
                                    }
                                } catch (e) {
                                    setErrorMessage("An unexpected error occurred: " + e.message);
                                    setIsProcessing(false);
                                }
                            }} 
                            onReady={({ availablePaymentMethods }) => {
                                setIsExpressAvailable(!!availablePaymentMethods);
                            }}
                        />
                    </div>
                    
                    {isExpressAvailable && (
                        <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', color: '#999', fontSize: '14px' }}>
                            <div style={{ flex: 1, height: '1px', backgroundColor: '#eee' }}></div>
                            <span style={{ padding: '0 15px' }}>Or pay with card</span>
                            <div style={{ flex: 1, height: '1px', backgroundColor: '#eee' }}></div>
                        </div>
                    )}

                    <PaymentElement 
                        onReady={() => setIsReady(true)}
                        options={{ 
                            layout: 'tabs',
                            wallets: {
                                applePay: 'never',
                                googlePay: 'never'
                            },
                            defaultValues: {
                                billingDetails: {
                                    name: bookingDetails.name,
                                    email: bookingDetails.email
                                }
                            }
                        }} 
                    />

                    <div style={{ marginTop: '15px', padding: '12px', backgroundColor: '#f0f7ff', borderLeft: '4px solid #0066cc', borderRadius: '4px', fontSize: '0.85rem', color: '#444', lineHeight: '1.4' }}>
                        <strong>🇷🇺 To our Russian guests:</strong><br/>
                        Если ваша карта отклонена из-за международных санкций, пожалуйста, <a href="https://instagram.com/daikokuhunters" target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc', textDecoration: 'underline', fontWeight: 'bold' }}>напишите нам в директ Instagram</a> для бронирования.
                    </div>
                </div>

                {errorMessage && (
                    <div style={{ color: '#E60012', marginTop: '15px', fontSize: '0.9rem', padding: '10px', backgroundColor: '#ffe6e6', borderRadius: '4px' }}>
                        {errorMessage}
                    </div>
                )}

                <div style={{ marginTop: '20px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <input 
                        type="checkbox" 
                        id="terms-agreement" 
                        checked={isAgreed}
                        onChange={(e) => {
                            setIsAgreed(e.target.checked);
                            if (e.target.checked && errorMessage === 'Please agree to the Terms of Service and Cancellation Policy before proceeding.') {
                                setErrorMessage(null);
                            }
                        }}
                        style={{ marginTop: '4px', cursor: 'pointer' }}
                    />
                    <label htmlFor="terms-agreement" style={{ fontSize: '0.9rem', color: '#555', cursor: 'pointer', lineHeight: '1.4' }}>
                        I agree to the <span onClick={(e) => { e.preventDefault(); e.stopPropagation(); setModalContent('terms'); }} style={{ color: '#0066cc', textDecoration: 'underline' }}>Terms of Service</span> and <span onClick={(e) => { e.preventDefault(); e.stopPropagation(); setModalContent('policy'); }} style={{ color: '#0066cc', textDecoration: 'underline' }}>Cancellation Policy</span>.
                    </label>
                </div>

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
                        disabled={!stripe || !isReady || isProcessing || !isAgreed}
                        style={{
                            flex: 1,
                            padding: '12px',
                            backgroundColor: (isProcessing || !isAgreed) ? '#999' : '#0066cc',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            cursor: (isProcessing || !isAgreed) ? 'not-allowed' : 'pointer',
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

            {/* Policy Modal */}
            {modalContent && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
                    backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', 
                    justifyContent: 'center', alignItems: 'center', padding: '20px'
                }}>
                    <div style={{
                        backgroundColor: '#fff', borderRadius: '12px', padding: '24px', 
                        width: '100%', maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                    }}>
                        <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#333', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                            {modalContent === 'terms' ? 'Terms of Service' : 'Cancellation Policy'}
                        </h3>
                        <div style={{ marginBottom: '25px', fontSize: '0.85rem', color: '#444', lineHeight: '1.6', maxHeight: '50vh', overflowY: 'auto', padding: '15px', backgroundColor: '#fafafa', border: '1px solid #ddd', borderRadius: '8px' }}>
                            {modalContent === 'terms' ? (
                                <>
                                    <h4 style={{marginTop: '15px'}}>1. Overview</h4>
                                    <p>These Terms of Service ("Terms") govern the use of the matching and coordination platform operated by Daikoku Hunters ("we," "us," or "the Platform"). By making a reservation through the Platform, you ("Customer," "you") agree to these Terms in full.</p>

                                    <h4>2. Nature of Service</h4>
                                    <p>Daikoku Hunters is a platform that provides access to the real JDM culture living in the streets of Tokyo at night. We connect international guests with hosts who are genuinely part of the car scene at Daikoku PA and the Wangan area — giving you access to something that no standard tourist experience can reach.</p>
                                    <p>What you are purchasing is the experience itself, not a means of transport. Our guides are insiders — people who know Daikoku PA and the Tokyo night car scene from the inside out. The core of what they offer is cultural commentary, photography support, and direct access to the local community. Accompanying guests between locations is simply part of how that experience unfolds.</p>
                                    <p><strong>What Daikoku Hunters does not do:</strong></p>
                                    <ul style={{ paddingLeft: '20px' }}>
                                        <li>Provide transportation, taxi, or passenger transport services</li>
                                        <li>Employ, dispatch, direct, or control any Guide</li>
                                        <li>Own, operate, lease, or insure any vehicle used by a Guide</li>
                                        <li>Act as a party to the experience agreement between the Customer and the Guide</li>
                                    </ul>
                                    <p><strong>Regarding vehicles:</strong> All vehicles used in Daikoku Hunters experiences are privately owned by individual guides. They are not registered or insured as rental vehicles, hire vehicles, or commercial transport. Pricing is not based on distance, time, or route. Vehicle rental, shared driving, and driving experiences are outside the scope of what this platform offers.</p>
                                    <p><strong>Regarding social media and marketing materials:</strong> Vehicles such as the Nissan Skyline R34 GT-R appear in our social media and promotional content to convey the world of JDM culture that Daikoku Hunters provides access to. The vehicles are not the product being sold.</p>
                                    <p>By completing a booking, the Customer agrees that: (a) the experience purchased is a cultural and recreational guided activity, (b) each Guide is an independent service provider acting under their own responsibility, and (c) accompanying guests between locations is part of the experience as it naturally unfolds, and is not a standalone paid transport service.</p>
                                    <p>This service does not constitute a passenger transport business under the Japanese Road Transportation Act (道路運送法), nor does it operate as a taxi or any other form of public transportation.</p>

                                    <h4>3. Booking & Payment</h4>
                                    <ul style={{ paddingLeft: '20px' }}>
                                        <li>A platform fee of ¥5,000 per vehicle is payable to Daikoku Hunters in advance to secure a reservation. This fee covers matching and coordination services only and is not a fare or transportation charge.</li>
                                        <li>The reservation is confirmed upon successful payment of the platform fee.</li>
                                        <li>The experience fee for the guided cultural experience is determined by each Guide and is paid directly by the Customer to the Guide in cash on the day of the experience.</li>
                                        <li>Daikoku Hunters does not collect, hold, process, or guarantee the experience fee. The contract for the experience itself is concluded directly between the Customer and the Guide.</li>
                                    </ul>

                                    <h4>4. Participant Requirements</h4>
                                    <p>By booking through the Platform, the Customer represents and warrants that:</p>
                                    <ul style={{ paddingLeft: '20px' }}>
                                        <li>All participants are at least 18 years of age, or are accompanied by a parent or legal guardian.</li>
                                        <li>No participant will be under the influence of alcohol, drugs, or any substance that impairs judgment during the experience.</li>
                                        <li>Participants with serious medical conditions, pregnancy, or other health concerns have consulted a physician prior to participation and accept all associated risks.</li>
                                        <li>Any participant who intends to drive must hold a valid driver's license recognized in Japan (including an International Driving Permit where applicable) and meet all conditions set by the Guide.</li>
                                        <li>All participants will follow the reasonable instructions of the Guide at all times.</li>
                                    </ul>

                                    <h4>5. Cancellation Policy</h4>
                                    <p><strong>Customer-initiated cancellation:</strong></p>
                                    <ul style={{ paddingLeft: '20px' }}>
                                        <li>Free cancellation up to 10 days before the experience date — the platform fee is fully refundable.</li>
                                        <li>Cancellation within 10 days of the experience date — the platform fee (¥5,000 per vehicle) is non-refundable.</li>
                                        <li>No-show or same-day cancellation — the full payment is non-refundable.</li>
                                        <li>Date changes are accepted up to 3 days before the experience date, subject to Guide availability.</li>
                                        <li>Cancellation conditions for the experience fee are set by each Guide and communicated prior to booking.</li>
                                    </ul>
                                    <p><strong>Guide-initiated or Platform-initiated cancellation:</strong></p>
                                    <ul style={{ paddingLeft: '20px' }}>
                                        <li>If a Guide is unable to provide the experience for reasons attributable to the Guide or to Daikoku Hunters, the platform fee will be refunded in full, or, at the Customer's option, the booking will be rescheduled.</li>
                                        <li>Refunds are processed within 14 business days to the original payment method.</li>
                                    </ul>

                                    <h4>6. Participant Responsibility & Conduct</h4>
                                    <ul style={{ paddingLeft: '20px' }}>
                                        <li>All participants must comply with Japanese traffic laws, road traffic regulations (道路交通法), and all safety instructions given by the Guide.</li>
                                        <li>Dangerous driving, illegal racing, public-road drifting, speeding, and any other illegal activity are strictly prohibited.</li>
                                        <li>Participants are solely responsible for their own conduct during the experience and for any damages, fines, or liabilities arising from their actions.</li>
                                        <li>The Guide reserves the right to terminate the experience immediately, without refund, if a participant engages in unsafe, illegal, or disruptive behavior.</li>
                                    </ul>

                                    <h4>7. Guide Independence</h4>
                                    <ul style={{ paddingLeft: '20px' }}>
                                        <li>Guides set their own schedules, routes, vehicles, pricing, and experience content.</li>
                                        <li>Each Guide is solely responsible for maintaining a valid driver's license, valid vehicle registration and inspection (車検), and appropriate vehicle insurance.</li>
                                        <li>Each Guide is solely responsible for compliance with all applicable laws, including but not limited to the Road Transportation Act (道路運送法) and the Road Traffic Act (道路交通法).</li>
                                        <li>Daikoku Hunters does not direct or control the manner in which Guides conduct their experiences and is not a principal, employer, or agent of any Guide.</li>
                                    </ul>

                                    <h4>8. Limitation of Liability</h4>
                                    <ul style={{ paddingLeft: '20px' }}>
                                        <li>Daikoku Hunters acts solely as a matching and coordination platform and is not a party to the experience agreement between the Customer and the Guide.</li>
                                        <li>The cultural and recreational experience, including all driving and vehicle operation, is provided independently by each Guide.</li>
                                        <li>To the maximum extent permitted by applicable law, Daikoku Hunters shall not be liable for any damages, injuries, accidents, losses, delays, or other consequences arising from the acts or omissions of any Guide, any participant, or any third party.</li>
                                        <li>Nothing in these Terms excludes or limits liability for damages caused by Daikoku Hunters' own willful misconduct or gross negligence, or for liability that cannot be excluded under Japanese law (including the Consumer Contract Act, 消費者契約法).</li>
                                        <li>The Customer is encouraged to maintain their own travel and personal accident insurance.</li>
                                    </ul>

                                    <h4>9. Photography & Media</h4>
                                    <p>Guides and Daikoku Hunters may take photographs or video during the experience for promotional purposes. By participating, the Customer consents to the use of such media unless they notify the Guide in writing in advance.</p>

                                    <h4>10. Changes & Force Majeure</h4>
                                    <ul style={{ paddingLeft: '20px' }}>
                                        <li>Experience schedules, routes, or content may be adjusted due to weather, road conditions, traffic, vehicle issues, safety concerns, or the Guide's reasonable judgment.</li>
                                        <li>Daikoku Hunters and Guides shall not be liable for delays, cancellations, or changes caused by circumstances beyond reasonable control, including but not limited to: natural disasters, earthquakes, severe weather, pandemics, government orders, road closures, accidents, vehicle breakdown, or labor disputes.</li>
                                    </ul>

                                    <h4>11. Privacy</h4>
                                    <p>Personal information collected through the Platform is handled in accordance with our Privacy Policy. By making a booking, you consent to the sharing of your contact information with the matched Guide for the purpose of coordinating the experience.</p>

                                    <h4>12. Changes to These Terms</h4>
                                    <p>Daikoku Hunters may update these Terms from time to time. The updated Terms will be posted on this page with a revised "Last updated" date. Bookings made after the update are subject to the updated Terms.</p>

                                    <h4>13. Governing Language</h4>
                                    <p>These Terms are prepared in English. Any translation is provided for convenience only. In the event of any inconsistency between the English version and any translation, the English version shall prevail.</p>

                                    <h4>14. Governing Law & Jurisdiction</h4>
                                    <ul style={{ paddingLeft: '20px' }}>
                                        <li>These Terms shall be governed by and interpreted in accordance with the laws of Japan.</li>
                                        <li>Any disputes arising out of or in connection with these Terms shall be submitted to the Tokyo District Court as the court of first instance with exclusive jurisdiction, except where mandatory consumer protection laws provide otherwise.</li>
                                    </ul>
                                </>
                            ) : (
                                <>
                                    <p><strong>Customer-initiated cancellation:</strong></p>
                                    <ul style={{ paddingLeft: '20px' }}>
                                        <li>Free cancellation up to 10 days before the experience date — the platform fee is fully refundable.</li>
                                        <li>Cancellation within 10 days of the experience date — the platform fee (¥5,000 per vehicle) is non-refundable.</li>
                                        <li>No-show or same-day cancellation — the full payment is non-refundable.</li>
                                        <li>Date changes are accepted up to 3 days before the experience date, subject to Guide availability.</li>
                                        <li>Cancellation conditions for the experience fee are set by each Guide and communicated prior to booking.</li>
                                    </ul>
                                    <p><strong>Guide-initiated or Platform-initiated cancellation:</strong></p>
                                    <ul style={{ paddingLeft: '20px' }}>
                                        <li>If a Guide is unable to provide the experience for reasons attributable to the Guide or to Daikoku Hunters, the platform fee will be refunded in full, or, at the Customer's option, the booking will be rescheduled.</li>
                                        <li>Refunds are processed within 14 business days to the original payment method.</li>
                                    </ul>
                                </>
                            )}
                        </div>
                        <button 
                            type="button"
                            onClick={(e) => { e.preventDefault(); setModalContent(null); }}
                            style={{
                                width: '100%', padding: '14px', backgroundColor: '#333', color: '#fff', 
                                border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer'
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

export default CheckoutForm;
