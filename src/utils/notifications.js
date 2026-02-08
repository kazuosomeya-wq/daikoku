import emailjs from '@emailjs/browser';

// TODO: Replace these with your actual EmailJS keys!
const EMAILJS_SERVICE_ID = "service_0bc50bn";
const EMAILJS_TEMPLATE_ID = "template_tomw358";
const EMAILJS_PUBLIC_KEY = "KEPUemG6ObA-0ZwJf";

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
        const templateParams = {
            to_name: "Admin / Driver", // Could be dynamic if needed
            from_name: bookingData.name,
            tour_date: bookingData.date,
            tour_type: bookingData.tourType,
            vehicle: bookingData.vehicleName || bookingData.options?.selectedVehicle || "None",
            guests: bookingData.guests,
            contact_email: bookingData.email,
            contact_instagram: bookingData.instagram,
            contact_whatsapp: bookingData.whatsapp,
            total_price: `¥${Number(bookingData.totalToken).toLocaleString()}`,
            booking_id: bookingData.id || "New Booking",
            driver_email: bookingData.driverEmail || "admin@test.com" // Provide fallback or handle in template
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
