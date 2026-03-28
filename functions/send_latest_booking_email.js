const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const formatOptionsForEmail = (options) => {
    if (!options) return "None";
    const parts = [];
    if (options.tokyoTower) parts.push("Tokyo Tower");
    if (options.shibuya) parts.push("Shibuya");
    return parts.length > 0 ? parts.join("<br>") : "None";
};

async function run() {
  const snapshot = await db.collection('bookings').orderBy('timestamp', 'desc').limit(1).get();
  if (snapshot.empty) return;
  
  const doc = snapshot.docs[0];
  const bookingData = { id: doc.id, ...doc.data() };
  if (bookingData.timestamp) bookingData.timestamp = bookingData.timestamp.toDate();
  console.log('Processing booking for: ' + bookingData.name);

  const vehicleName = bookingData.vehicleName1 || bookingData.options?.selectedVehicle || "None";
  const optionsDetail = formatOptionsForEmail(bookingData.options);
  const totalPrice = '¥' + Number(bookingData.totalToken || 0).toLocaleString();
  const deposit = '¥' + Number(bookingData.deposit || 0).toLocaleString();
  const remainingBalance = (bookingData.totalToken || 0) - (bookingData.deposit || 0);
  const balanceStr = '¥' + remainingBalance.toLocaleString();
  const adminEmail = "tour@daikokuhunter.com";

  let adminVehicleName = bookingData.options?.selectedVehicle === 'none' ? 'random-r34' : (bookingData.options?.selectedVehicle || "None");
  if (bookingData.guests >= 4 && bookingData.options?.selectedVehicle2) {
      const adminVehicleName2 = bookingData.options.selectedVehicle2 === 'none' ? 'random-r34' : bookingData.options.selectedVehicle2;
      adminVehicleName = 'Car 1: ' + adminVehicleName + ', Car 2: ' + adminVehicleName2;
  }

  const dateObj = new Date(bookingData.date);
  const adminFormattedDate = !isNaN(dateObj)
      ? dateObj.getFullYear() + '年' + (dateObj.getMonth() + 1) + '月' + dateObj.getDate() + '日'
      : bookingData.date;

  const displayTourType = (bookingData.tourType === 'Midnight Plan' || bookingData.tourType === 'Umihotaru Tour') 
    ? 'Midnight Tour (' + (bookingData.options?.midnightTimeSlot || '8:30 PM') + ')' 
    : bookingData.tourType;

  // サーバーエラー防止のため、テンプレートリテラルを少し避けて書く
  const adminBody = [
    "=== NEW BOOKING REQUEST ===",
    "Name: " + bookingData.name,
    "Date: " + adminFormattedDate,
    "Tour: " + displayTourType,
    "Vehicle: " + adminVehicleName,
    "Guests: " + bookingData.guests,
    "-------------------",
    "Pickup: " + (bookingData.hotel || "Not specified"),
    "Options: " + optionsDetail,
    bookingData.vehiclePrice1 > 0 ? "Vehicle Price: ¥" + bookingData.vehiclePrice1.toLocaleString() : "",
    bookingData.vehiclePrice2 > 0 ? "Vehicle 2 Price: ¥" + bookingData.vehiclePrice2.toLocaleString() : "",
    "Total Price: " + totalPrice,
    "Deposit: " + deposit,
    "Balance Due: " + balanceStr + " (Cash)",
    "Booking ID: " + (bookingData.id || "Pending"),
    "-------------------",
    "CONTACT:",
    "Email: " + bookingData.email,
    "Insta: " + bookingData.instagram,
    "WhatsApp: " + (bookingData.whatsapp || "Not provided"),
    "Remarks: " + (bookingData.remarks || "None"),
    "==================="
  ].filter(Boolean).join("\n");

  const customerBody = [
    "<div style=\"font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333333; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);\">",
    "  <div style=\"background-color: #E60012; color: #ffffff; padding: 25px 20px; text-align: center;\">",
    "    <h1 style=\"margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 2px;\">DAIKOKU HUNTERS</h1>",
    "    <p style=\"margin: 8px 0 0; font-size: 15px; opacity: 0.9; font-weight: 500;\">Booking Confirmation / ご予約の確認</p>",
    "  </div>",
    "  <div style=\"padding: 35px 30px;\">",
    "    <p style=\"font-size: 16px; margin-bottom: 25px; line-height: 1.6;\">Dear <strong>" + bookingData.name + "</strong>,</p>",
    "    <p style=\"font-size: 15px; line-height: 1.6; color: #444444; margin-bottom: 35px;\">Thank you for booking a tour with <strong>DAIKOKU HUNTERS</strong>! We have successfully received your request and look forward to showing you the Japanese car scene.</p>",
    "    <h2 style=\"font-size: 18px; font-weight: 700; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px; margin-top: 0; color: #111111; letter-spacing: 0.5px;\">Your Booking Details</h2>",
    "    <table style=\"width: 100%; border-collapse: collapse; margin-bottom: 35px; font-size: 15px;\">",
    "      <tr><td style=\"padding: 12px 0; border-bottom: 1px solid #f5f5f5; color: #666666; width: 40%;\">Tour Plan</td><td style=\"padding: 12px 0; border-bottom: 1px solid #f5f5f5; font-weight: 600; color: #222222;\">" + displayTourType + "</td></tr>",
    "      <tr><td style=\"padding: 12px 0; border-bottom: 1px solid #f5f5f5; color: #666666;\">Date</td><td style=\"padding: 12px 0; border-bottom: 1px solid #f5f5f5; font-weight: 600; color: #222222;\">" + bookingData.date + "</td></tr>",
    "      <tr><td style=\"padding: 12px 0; border-bottom: 1px solid #f5f5f5; color: #666666;\">Vehicle</td><td style=\"padding: 12px 0; border-bottom: 1px solid #f5f5f5; font-weight: 600; color: #222222;\">" + vehicleName + "</td></tr>",
    "      <tr><td style=\"padding: 12px 0; border-bottom: 1px solid #f5f5f5; color: #666666;\">Guests</td><td style=\"padding: 12px 0; border-bottom: 1px solid #f5f5f5; font-weight: 600; color: #222222;\">" + bookingData.guests + "</td></tr>",
    "      <tr><td style=\"padding: 12px 0; border-bottom: 1px solid #f5f5f5; color: #666666;\">Pickup Location</td><td style=\"padding: 12px 0; border-bottom: 1px solid #f5f5f5; font-weight: 600; color: #222222; max-width: 250px; word-wrap: break-word;\">" + (bookingData.hotel || "Not specified") + "</td></tr>",
    "      <tr><td style=\"padding: 12px 0; border-bottom: 1px solid #f5f5f5; color: #666666;\">Additional Options</td><td style=\"padding: 12px 0; border-bottom: 1px solid #f5f5f5; font-weight: 600; color: #222222;\">" + optionsDetail + "</td></tr>",
    "    </table>",
    "    <h2 style=\"font-size: 18px; font-weight: 700; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px; margin-top: 0; color: #111111; letter-spacing: 0.5px;\">Payment Details</h2>",
    "    <table style=\"width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 15px;\">",
    "      <tr><td style=\"padding: 8px 0; color: #666666; width: 40%;\">Total Price</td><td style=\"padding: 8px 0; color: #222222; text-align: right; font-weight: 600;\">" + totalPrice + "</td></tr>",
    "      <tr><td style=\"padding: 8px 0; color: #666666;\">Deposit Paid</td><td style=\"padding: 8px 0; color: #222222; text-align: right; font-weight: 600;\">" + deposit + "</td></tr>",
    "    </table>",
    "    <div style=\"background-color: #fafafa; border: 1px solid #eeeeee; border-left: 5px solid #E60012; border-radius: 4px; padding: 18px 20px; margin: 15px 0 35px 0;\">",
    "      <p style=\"margin: 0; font-size: 16px; font-weight: 700; color: #333333; display: flex; justify-content: space-between; align-items: center;\"><span>Cash Due on Day:</span> <span style=\"color: #E60012; font-size: 22px; margin-left: auto; float: right;\">" + balanceStr + "</span></p>",
    "      <div style=\"clear: both;\"></div>",
    "      <p style=\"margin: 8px 0 0; font-size: 13px; color: #666666; font-style: italic;\">* Please prepare this exact amount in cash (JPY) on the day of your tour.</p>",
    "    </div>",
    "    <h2 style=\"font-size: 18px; font-weight: 700; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px; margin-top: 0; color: #111111; letter-spacing: 0.5px;\">Contact Information</h2>",
    "    <table style=\"width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 15px;\">",
    "      <tr><td style=\"padding: 10px 0; border-bottom: 1px solid #f5f5f5; color: #666666; width: 40%;\">Email</td><td style=\"padding: 10px 0; border-bottom: 1px solid #f5f5f5; font-weight: 600; color: #222222;\">" + bookingData.email + "</td></tr>",
    "      <tr><td style=\"padding: 10px 0; border-bottom: 1px solid #f5f5f5; color: #666666;\">Instagram</td><td style=\"padding: 10px 0; border-bottom: 1px solid #f5f5f5; font-weight: 600; color: #222222;\">" + bookingData.instagram + "</td></tr>",
    "      <tr><td style=\"padding: 10px 0; border-bottom: 1px solid #f5f5f5; color: #666666;\">WhatsApp</td><td style=\"padding: 10px 0; border-bottom: 1px solid #f5f5f5; font-weight: 600; color: #222222;\">" + (bookingData.whatsapp || "Not provided") + "</td></tr>",
    "      <tr><td style=\"padding: 10px 0; border-bottom: 1px solid #f5f5f5; color: #666666;\">Remarks</td><td style=\"padding: 10px 0; border-bottom: 1px solid #f5f5f5; font-weight: 600; color: #222222; max-width: 250px; word-wrap: break-word;\">" + (bookingData.remarks || "None") + "</td></tr>",
    "    </table>",
    "    <div style=\"margin-top: 40px; font-size: 15px; color: #555555; line-height: 1.6; background-color: #fcfcfc; padding: 20px; border-radius: 8px;\">",
    "      <p style=\"margin-top: 0;\">We will contact you via WhatsApp or Instagram before the tour day to confirm finalized details and precise pickup times.</p>",
    "      <p>If you have any questions or need to make changes, please reply to our Instagram (<a href=\"https://instagram.com/daikoku_hunters\" style=\"color: #E60012; font-weight: bold; text-decoration: none;\">@daikoku_hunters</a>) or simply reply to this email.</p>",
    "      <p style=\"margin: 25px 0 0;\">Best regards,</p>",
    "      <p style=\"margin: 5px 0 0; font-weight: 800; color: #111111; font-size: 16px;\">DAIKOKU HUNTERS Tours</p>",
    "    </div>",
    "  </div>",
    "  <div style=\"background-color: #1a1a1a; color: #888888; text-align: center; padding: 20px; font-size: 12px;\">",
    "    &copy; " + new Date().getFullYear() + " DAIKOKU HUNTERS. All rights reserved.<br>",
    "    <a href=\"https://www.daikokuhunter.com\" style=\"color: #cccccc; text-decoration: none; margin-top: 10px; display: inline-block;\">www.daikokuhunter.com</a>",
    "  </div>",
    "</div>"
  ].join("\n");

  const sendEmailJS = async (params, templateId) => {
    const payload = {
        service_id: "service_0bc50bn",
        template_id: templateId,
        user_id: "KEPUemG6ObA-0ZwJf",
        template_params: params
    };
    const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Origin': 'https://www.daikokuhunter.com',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
        },
        body: JSON.stringify(payload)
    });
    if (!res.ok) {
        console.error("Failed to send:", await res.text());
    } else {
        console.log("Successfully sent target:", params.to_email, "Template:", templateId);
    }
  };

  let adminTargets = [];
  if (Array.isArray(bookingData.driverEmail)) {
      adminTargets = bookingData.driverEmail;
  } else if (bookingData.driverEmail) {
      adminTargets = [bookingData.driverEmail];
  } else {
      adminTargets = [adminEmail];
  }
  adminTargets = [...new Set(adminTargets)];

  for (const target of adminTargets) {
      await sendEmailJS({
            to_name: "Admin",
            from_name: bookingData.name,
            driver_email: target,
            to_email: target,
            recipient_email: target,
            reply_to: bookingData.email,
            message_body: adminBody,
            tour_date: bookingData.date,
            tour_type: displayTourType,
            vehicle: vehicleName,
            guests: bookingData.guests,
            contact_email: bookingData.email,
            contact_instagram: bookingData.instagram,
            contact_whatsapp: bookingData.whatsapp,
            hotel: bookingData.hotel || "Not specified",
            remarks: bookingData.remarks || "None",
            options_detail: optionsDetail,
            options: optionsDetail,
            total_price: totalPrice,
            deposit: deposit,
            balance: balanceStr,
            driver_url: 'https://www.daikokuhunter.com/driver/' + (bookingData.adminVehicleSlug || 'none')
      }, "template_tomw358");
  }

  if (bookingData.email) {
      await sendEmailJS({
            to_name: bookingData.name,
            from_name: "Highway Godzilla Tours",
            driver_email: bookingData.email,
            to_email: bookingData.email,
            recipient_email: bookingData.email,
            reply_to: adminEmail,
            message_body: customerBody,
            tour_date: bookingData.date,
            tour_type: displayTourType,
            vehicle: vehicleName,
            guests: bookingData.guests,
            contact_email: bookingData.email,
            contact_instagram: bookingData.instagram,
            contact_whatsapp: bookingData.whatsapp,
            hotel: bookingData.hotel || "Not specified",
            options_detail: optionsDetail,
            options: optionsDetail,
            total_price: totalPrice,
            deposit: deposit,
            balance: balanceStr
      }, "template_axz7u65");
  }
}
run().catch(console.error);
