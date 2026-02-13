import emailjs from '@emailjs/browser';

// TODO: Replace these with your actual EmailJS keys!
const EMAILJS_SERVICE_ID = "service_0bc50bn";
const EMAILJS_TEMPLATE_ID = "template_tomw358";
const EMAILJS_PUBLIC_KEY = "KEPUemG6ObA-0ZwJf";

/**
 * Formats the options object into a readable string for email.
 */
const formatOptionsForEmail = (options) => {
    if (!options) return "None";
    const parts = [];
    if (options.tokyoTower) parts.push("Tokyo Tower");
    if (options.shibuya) parts.push("Shibuya");
    return parts.length > 0 ? parts.join(", ") : "None";
};

/**
 * Sends a booking notification email to the driver/admin.
 * @param {Object} bookingData - The booking details (name, date, vehicle, etc.)
 */
export const sendBookingNotification = async (bookingData) => {
    // If keys are missing, just log a warning
    if (EMAILJS_SERVICE_ID === "YOUR_SERVICE_ID" || EMAILJS_PUBLIC_KEY === "YOUR_PUBLIC_KEY") {
        console.warn("⚠️ EmailJS keys are not set! Notification skipped.");
        console.log("Would have sent email for:", bookingData);
        return;
    }

    const vehicleName = bookingData.vehicleName || bookingData.options?.selectedVehicle || "None";
    const optionsDetail = formatOptionsForEmail(bookingData.options);
    const totalPrice = `¥${Number(bookingData.totalToken).toLocaleString()}`;
    const deposit = `¥${Number(bookingData.deposit).toLocaleString()}`;
    const remainingBalance = bookingData.totalToken - bookingData.deposit;
    const balanceStr = `¥${remainingBalance.toLocaleString()}`;
    const adminEmail = "gtrgtt34@gmail.com"; // Default Admin Email

    // --- 1. Admin / Driver Notification Body ---
    const adminBody = `
=== NEW BOOKING REQUEST ===
Name: ${bookingData.name}
Date: ${bookingData.date}
Tour: ${bookingData.tourType}
Vehicle: ${vehicleName}
Guests: ${bookingData.guests}
-------------------
Pickup: ${bookingData.hotel || "Not specified"}
Options: ${optionsDetail}
${bookingData.vehiclePrice1 > 0 ? `Vehicle Price: ¥${bookingData.vehiclePrice1.toLocaleString()}` : ''}
${bookingData.vehiclePrice2 > 0 ? `Vehicle 2 Price: ¥${bookingData.vehiclePrice2.toLocaleString()}` : ''}
Total Price: ${totalPrice}
Deposit: ${deposit}
Balance Due: ${balanceStr} (Cash)
Booking ID: ${bookingData.id || "Pending"}
-------------------
CONTACT:
Email: ${bookingData.email}
Insta: ${bookingData.instagram}
WhatsApp: ${bookingData.whatsapp}
===================
    `.trim();

    // --- 2. Customer Confirmation Body ---
    const customerBody = `
Dear ${bookingData.name},

Thank you for requesting a tour with Highway Godzilla!
We have received your booking details.

=== YOUR BOOKING DETAILS ===
Tour Plan: ${bookingData.tourType}
Date: ${bookingData.date}
Vehicle: ${vehicleName}
Guests: ${bookingData.guests}
Pickup Location: ${bookingData.hotel || "Not specified"}
Options: ${optionsDetail}

=== PAYMENT DETAILS ===
Total Price: ${totalPrice}
Deposit Paid: ${deposit}
--------------------------------------------------
CASH DUE ON DAY: ${balanceStr}
--------------------------------------------------
*Please bring this amount in cash (JPY) on the day of the tour.

=== YOUR CONTACT INFO ===
Email: ${bookingData.email}
Instagram: ${bookingData.instagram}
WhatsApp: ${bookingData.whatsapp}

We will contact you shortly via WhatsApp or Email to confirm finalized details and pickup times.
If you have any questions, please reply to this email.

Best regards,
Highway Godzilla Tours
    `.trim();

    const sendEmail = async (params) => {
        return emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, params, EMAILJS_PUBLIC_KEY);
    };

    try {
        // Send to Admin/Driver
        // We assume 'driver_email' is the variable mapped to "To Email" in EmailJS dashboard
        await sendEmail({
            to_name: "Admin",
            from_name: "System",
            driver_email: bookingData.driverEmail || adminEmail, // Send to specific driver or default admin
            message_body: adminBody,
            // Extra context fields
            tour_date: bookingData.date,
            tour_type: bookingData.tourType,
            vehicle: vehicleName,
            guests: bookingData.guests,
            contact_email: bookingData.email,
            contact_instagram: bookingData.instagram,
            contact_whatsapp: bookingData.whatsapp
        });
        console.log("✅ Admin notification sent");

        // Send to Customer
        if (bookingData.email) {
            await sendEmail({
                to_name: bookingData.name,
                from_name: "Highway Godzilla Tours",
                driver_email: bookingData.email, // RE-PURPOSING THIS FIELD to send to customer
                message_body: customerBody,
                // Context fields
                tour_date: bookingData.date,
                vehicle: vehicleName
            });
            console.log("✅ Customer confirmation sent");
        }

    } catch (error) {
        console.error("❌ Failed to send email:", error);
    }
};
