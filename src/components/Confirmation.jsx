import React from 'react';
import './Confirmation.css';

const Confirmation = ({ bookingDetails, onReset }) => {
    const { name, email, instagram, date, guests, totalToken, deposit } = bookingDetails;

    return (
        <div className="confirmation-container">
            <div className="confirmation-card">
                <div className="success-icon">✓</div>
                <h2>Booking Request Received!</h2>
                <p className="confirmation-message">
                    Thank you, {name}. We have received your booking request for the Daikoku Tour.
                </p>

                <div className="details-summary">
                    <div className="detail-row">
                        <span>Date</span>
                        <span>{date}</span>
                    </div>
                    <div className="detail-row">
                        <span>Guests</span>
                        <span>{guests}</span>
                    </div>
                    <div className="detail-row">
                        <span>Total Price</span>
                        <span>¥{totalToken}</span>
                    </div>
                    <div className="detail-row highlight">
                        <span>Deposit Paid</span>
                        <span>¥{deposit}</span>
                    </div>
                </div>

                <div className="next-steps">
                    <h3>Next Steps</h3>
                    <ul>
                        <li>You will receive a confirmation email at <strong>{email}</strong> shortly.</li>
                        <li>We may contact you via Instagram ({instagram}) for coordination.</li>
                        <li>The remaining balance will be collected on the day of the tour.</li>
                    </ul>
                </div>

                <button className="reset-btn" onClick={onReset}>
                    Book Another Tour
                </button>
            </div>
        </div>
    );
};

export default Confirmation;
