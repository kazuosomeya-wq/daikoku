import React from 'react';
import './GuestInfo.css';

const GuestInfo = ({ formData, onChange }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        onChange({
            ...formData,
            [name]: value
        });
    };

    return (
        <div className="guest-info-container">
            <h3 className="section-title">Guest Information</h3>

            <div className="form-group">
                <label htmlFor="name">Full Name <span className="required">*</span></label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. John Doe"
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="email">Email Address <span className="required">*</span></label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g. john@example.com"
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="hotel">Hotel / Pickup Location</label>
                <span className="helper-text">If not decided yet, you can let us know later.</span>
                <input
                    type="text"
                    id="hotel"
                    name="hotel"
                    value={formData.hotel}
                    onChange={handleChange}
                    placeholder="e.g. Hilton Tokyo"
                />
            </div>

            <div className="form-group">
                <label htmlFor="instagram">Instagram ID <span className="required">*</span></label>
                <input
                    type="text"
                    id="instagram"
                    name="instagram"
                    value={formData.instagram}
                    onChange={handleChange}
                    placeholder="@username"
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="whatsapp">WhatsApp Number</label>
                <span className="helper-text">For smoother communication.</span>
                <input
                    type="tel"
                    id="whatsapp"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleChange}
                    placeholder="+1 234 567 8900"
                />
            </div>

            <div className="form-group">
                <label htmlFor="remarks">Remarks (Optional)</label>
                <span className="helper-text">Any special requests or questions?</span>
                <textarea
                    id="remarks"
                    name="remarks"
                    value={formData.remarks || ''}
                    onChange={handleChange}
                    rows="3"
                />
            </div>
        </div>
    );
};

export default GuestInfo;
