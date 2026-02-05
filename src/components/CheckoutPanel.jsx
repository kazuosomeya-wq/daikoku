import React from 'react';
import { calculateDeposit } from '../utils/pricing';
import './CheckoutPanel.css';

const CheckoutPanel = ({ selectedDate, personCount, options, tourPrice, onCheckout, isLoading }) => {
    const depositAmount = calculateDeposit(personCount);

    // Calculate specific option costs
    const optionsTotal =
        (options.colorRequest ? 10000 : 0) +
        (options.modelRequest ? 10000 : 0) +
        (options.tunedCarRequest ? 10000 : 0) +
        (options.tokyoTower ? 5000 : 0) +
        (options.shibuya ? 5000 : 0);

    const totalCost = tourPrice + optionsTotal;

    return (
        <div className="checkout-panel">
            <div className="checkout-summary">
                <div className="summary-row">
                    <span>Base Plan ({personCount} pax)</span>
                    <span>¥{tourPrice.toLocaleString()}</span>
                </div>

                {options.colorRequest && (
                    <div className="summary-row option">
                        <span>Color Request</span>
                        <span>+¥10,000</span>
                    </div>
                )}
                {options.modelRequest && (
                    <div className="summary-row option">
                        <span>Specific Model Request</span>
                        <span>+¥10,000</span>
                    </div>
                )}
                {options.tunedCarRequest && (
                    <div className="summary-row option">
                        <span>High-Power / Tuned Car</span>
                        <span>+¥10,000</span>
                    </div>
                )}
                {options.tokyoTower && (
                    <div className="summary-row option">
                        <span>Photo: Tokyo Tower</span>
                        <span>+¥5,000</span>
                    </div>
                )}
                {options.shibuya && (
                    <div className="summary-row option">
                        <span>Photo: Shibuya Crossing</span>
                        <span>+¥5,000</span>
                    </div>
                )}

                <div className="summary-divider"></div>
                <div className="summary-row total">
                    <span>Total Cost</span>
                    <span className="price-highlight">¥{totalCost.toLocaleString()}</span>
                </div>
            </div>

            <div className="deposit-section">
                <div className="deposit-info">
                    <span className="deposit-label">Required Deposit</span>
                    <span className="deposit-subtext">(¥5,000 x {calculateDeposit(personCount) / 5000} car{calculateDeposit(personCount) / 5000 > 1 ? 's' : ''})</span>
                </div>
                <span className="deposit-amount">¥{depositAmount.toLocaleString()}</span>
            </div>

            <button className="checkout-btn" onClick={onCheckout} disabled={!selectedDate || isLoading}>
                {isLoading ? "Processing..." : (selectedDate ? `Pay Deposit ¥${depositAmount.toLocaleString()}` : "Select a Date First")}
            </button>

            {!selectedDate && <p className="date-warning">Please select a date on the calendar</p>}
        </div>
    );
};

export default CheckoutPanel;
