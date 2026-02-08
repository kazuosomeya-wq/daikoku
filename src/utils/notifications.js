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
    // If keys are missing, just log a warning (so screen doesn't crash)
    if (EMAILJS_SERVICE_ID === "YOUR_SERVICE_ID" || EMAILJS_PUBLIC_KEY === "YOUR_PUBLIC_KEY") {
        console.warn("⚠️ EmailJS keys are not set! Notification skipped.");
        console.log("Would have sent email for:", bookingData);
        return;
    }

    try {
        const vehicleName = bookingData.vehicleName || bookingData.options?.selectedVehicle || "None";
        const optionsDetail = formatOptionsForEmail(bookingData.options);
        const totalPrice = `¥${Number(bookingData.totalToken).toLocaleString()}`;
        const deposit = `¥${Number(bookingData.deposit).toLocaleString()}`;

        // Create a comprehensive summary string
        const messageBody = `
=== NEW BOOKING ===
Name: ${bookingData.name}
Date: ${bookingData.date}
Tour: ${bookingData.tourType}
Vehicle: ${vehicleName}
Guests: ${bookingData.guests}
-------------------
Pickup: ${bookingData.hotel || "Not specified"}
Options: ${optionsDetail}
Total Price: ${totalPrice}
Deposit Paid: ${deposit}
Booking ID: ${bookingData.id || "Pending"}
-------------------
CONTACT INFO:
Email: ${bookingData.email}
Instagram: ${bookingData.instagram}
WhatsApp: ${bookingData.whatsapp}
===================
        `.trim();

        const templateParams = {
            // Standard Fields
            to_name: "Admin / Driver",
            from_name: bookingData.name,
            tour_date: bookingData.date,
            tour_type: bookingData.tourType,
            vehicle: vehicleName,
            guests: bookingData.guests,
            contact_email: bookingData.email,
            contact_instagram: bookingData.instagram,
            contact_whatsapp: bookingData.whatsapp,
            hotel: bookingData.hotel || "Not specified",
            options_detail: optionsDetail,
            total_price: totalPrice,
            deposit: deposit,
            booking_id: bookingData.id || "New Booking",
            driver_email: bookingData.driverEmail || "admin@test.com",

            // Consolidated Body (for easy template setup)
            message_body: messageBody,

            // Raw/Extra fields if user wants specific access
            pickup_location: bookingData.hotel || "Not specified",
            whatsapp: bookingData.whatsapp,
            instagram: bookingData.instagram
        };

        const response = await emailjs.send(
            EMAILJS_SERVICE_ID,
            EMAILJS_TEMPLATE_ID,
            templateParams,
            EMAILJS_PUBLIC_KEY
        );

        console.log("✅ Email sent successfully!", response.status, response.text);
    } catch (error) {
        console.error("❌ Failed to send email:", error);
        // We catch the error so it doesn't break the booking flow user experience
    }
};
