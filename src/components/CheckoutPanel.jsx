import React, { useState } from 'react';
import { calculateDeposit } from '../utils/pricing';
import './CheckoutPanel.css';

const CheckoutPanel = ({ selectedDate, personCount, carCount = 1, options, tourPrice, vehiclePrice1 = 0, vehiclePrice2 = 0, vehiclePrice3 = 0, vehiclePrice4 = 0, vehiclePrice5 = 0, onCheckout, isLoading, appliedPromo, promoError, isCheckingPromo, onApplyPromo, onClearPromo }) => {
    const [showPromoInput, setShowPromoInput] = useState(false);
    const [promoInput, setPromoInput] = useState('');

    const depositAmount = calculateDeposit(personCount, carCount);
    const currentCarCount = carCount;

    // Calculate specific option costs
    const optionsTotal =
        vehiclePrice1 +
        vehiclePrice2 +
        vehiclePrice3 +
        vehiclePrice4 +
        vehiclePrice5 +
        (options.tokyoTower ? 7000 * currentCarCount : 0) +
        (options.shibuya ? 7000 * currentCarCount : 0);

    const subTotal = tourPrice + optionsTotal;
    const discountAmount = appliedPromo ? Math.floor(subTotal * (appliedPromo.discountPercentage / 100)) : 0;
    const totalCost = subTotal - discountAmount;

    return (
        <div className="checkout-panel">
            {personCount >= 10 ? (
                <div className="checkout-summary">
                    <div className="summary-row" style={{ color: '#E60012', fontWeight: 'bold' }}>
                        <span>For groups of 10+ people, please DM us on Instagram (@daikoku_hunters) to arrange your tour.</span>
                    </div>
                </div>
            ) : (
                <div className="checkout-summary">
                    <div className="summary-row">
                        <span>Base Plan ({personCount} pax)</span>
                        <span>¥{tourPrice.toLocaleString()}</span>
                    </div>

                    {vehiclePrice1 > 0 && (
                        <div className="summary-row option">
                            <span>Vehicle Selection</span>
                            <span>+¥{vehiclePrice1.toLocaleString()}</span>
                        </div>
                    )}
                    {vehiclePrice2 > 0 && (
                        <div className="summary-row option">
                            <span>Vehicle Selection (Car 2)</span>
                            <span>+¥{vehiclePrice2.toLocaleString()}</span>
                        </div>
                    )}
                    {vehiclePrice3 > 0 && (
                        <div className="summary-row option">
                            <span>Vehicle Selection (Car 3)</span>
                            <span>+¥{vehiclePrice3.toLocaleString()}</span>
                        </div>
                    )}
                    {vehiclePrice4 > 0 && (
                        <div className="summary-row option">
                            <span>Vehicle Selection (Car 4)</span>
                            <span>+¥{vehiclePrice4.toLocaleString()}</span>
                        </div>
                    )}
                    {vehiclePrice5 > 0 && (
                        <div className="summary-row option">
                            <span>Vehicle Selection (Car 5)</span>
                            <span>+¥{vehiclePrice5.toLocaleString()}</span>
                        </div>
                    )}

                    {options.tokyoTower && (
                        <div className="summary-row option">
                            <span>Photo: Tokyo Tower {currentCarCount > 1 ? `(x${currentCarCount})` : ''}</span>
                            <span>+¥{(7000 * currentCarCount).toLocaleString()}</span>
                        </div>
                    )}
                    {options.shibuya && (
                        <div className="summary-row option">
                            <span>Photo: Shibuya Street {currentCarCount > 1 ? `(x${currentCarCount})` : ''}</span>
                            <span>+¥{(7000 * currentCarCount).toLocaleString()}</span>
                        </div>
                    )}

                    <div className="summary-divider"></div>
                    
                    {appliedPromo && (
                        <div className="summary-row option" style={{ color: '#E60012', fontWeight: 'bold' }}>
                            <span>Promo: {appliedPromo.id} ({appliedPromo.discountPercentage}% OFF)</span>
                            <span>-¥{discountAmount.toLocaleString()}</span>
                        </div>
                    )}

                    <div className="summary-row total">
                        <span>Total Cost</span>
                        <span className="price-highlight">¥{totalCost.toLocaleString()}</span>
                    </div>
                    
                    <div className="summary-row deposit-row">
                        <div className="deposit-info">
                            <span className="deposit-label">Required Deposit</span>
                            <span className="deposit-subtext">(¥5,000 x {currentCarCount} car{currentCarCount > 1 ? 's' : ''})</span>
                        </div>
                        <span className="deposit-amount">¥{depositAmount.toLocaleString()}</span>
                    </div>

                    {/* Subtle Promo UI */}
                    <div style={{ marginTop: '1rem', fontSize: '0.8rem' }}>
                        {!appliedPromo && !showPromoInput && (
                            <span 
                                onClick={() => setShowPromoInput(true)}
                                style={{ color: '#888', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                                ✨ Have a referral code?
                            </span>
                        )}
                        
                        {!appliedPromo && showPromoInput && (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <input 
                                    type="text" 
                                    value={promoInput} 
                                    onChange={(e) => setPromoInput(e.target.value)} 
                                    placeholder="Enter code" 
                                    style={{ flex: 1, padding: '6px' }} 
                                />
                                <button 
                                    onClick={() => onApplyPromo(promoInput)} 
                                    disabled={isCheckingPromo}
                                    style={{ padding: '6px 12px', background: '#333', color: 'white', border: 'none', cursor: 'pointer' }}
                                >
                                    {isCheckingPromo ? '...' : 'Apply'}
                                </button>
                            </div>
                        )}
                        {promoError && <div style={{ color: '#E60012', marginTop: '4px' }}>{promoError}</div>}
                        
                        {appliedPromo && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffebee', padding: '6px 8px', borderRadius: '4px' }}>
                                <span style={{ color: '#E60012', fontWeight: 'bold' }}>✓ Code Applied!</span>
                                <span onClick={onClearPromo} style={{ color: '#666', cursor: 'pointer', textDecoration: 'underline' }}>Remove</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {personCount < 10 && (
                <button className="checkout-btn" onClick={onCheckout} disabled={!selectedDate || isLoading}>
                    {isLoading ? "Processing..." : (selectedDate ? `Pay Deposit` : "Select a Date First")}
                </button>
            )}

            {!selectedDate && personCount < 10 && <p className="date-warning">Please select a date on the calendar</p>}
        </div>
    );
};

export default CheckoutPanel;
