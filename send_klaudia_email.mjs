import fetch from 'node-fetch';

const EMAILJS_SERVICE_ID = "service_0bc50bn";
const EMAILJS_CUSTOMER_TEMPLATE_ID = "template_axz7u65";
const EMAILJS_PUBLIC_KEY = "KEPUemG6ObA-0ZwJf";

const customerBody = `
<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333333; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
  <!-- Header -->
  <div style="background-color: #E60012; color: #ffffff; padding: 25px 20px; text-align: center;">
    <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 2px;">DAIKOKU HUNTERS</h1>
    <p style="margin: 8px 0 0; font-size: 15px; opacity: 0.9; font-weight: 500;">Booking Confirmation / ご予約の確認</p>
  </div>
  
  <!-- Content -->
  <div style="padding: 35px 30px;">
    <p style="font-size: 16px; margin-bottom: 25px; line-height: 1.6;">Dear <strong>Klaudia Lalewicz</strong>,</p>
    <p style="font-size: 15px; line-height: 1.6; color: #444444; margin-bottom: 35px;">Thank you for booking a tour with <strong>DAIKOKU HUNTERS</strong>! We have successfully received your request and look forward to showing you the Japanese car scene.</p>
    
    <!-- Booking Details section -->
    <h2 style="font-size: 18px; font-weight: 700; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px; margin-top: 0; color: #111111; letter-spacing: 0.5px;">Your Booking Details</h2>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 35px; font-size: 15px;">
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f5; color: #666666; width: 40%;">Tour Plan</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f5; font-weight: 600; color: #222222;">City Tour</td>
      </tr>
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f5; color: #666666;">Date</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f5; font-weight: 600; color: #222222;">Wed Jun 03 2026</td>
      </tr>
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f5; color: #666666;">Pickup Time</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f5; font-weight: 600; color: #E60012;">11:00 PM</td>
      </tr>
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f5; color: #666666;">Vehicle</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f5; font-weight: 600; color: #222222;">Random Car & Random Car</td>
      </tr>
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f5; color: #666666;">Guests</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f5; font-weight: 600; color: #222222;">5</td>
      </tr>
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f5; color: #666666;">Pickup Location</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f5; font-weight: 600; color: #222222; max-width: 250px; word-wrap: break-word;">Hotel Vista Tokyo Tsukiji</td>
      </tr>
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f5; color: #666666;">Additional Options</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f5; font-weight: 600; color: #222222;">Shibuya</td>
      </tr>
    </table>

    <!-- Payment section -->
    <h2 style="font-size: 18px; font-weight: 700; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px; margin-top: 0; color: #111111; letter-spacing: 0.5px;">Payment Details</h2>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 15px;">
      <tr>
        <td style="padding: 8px 0; color: #666666; width: 40%;">Total Price</td>
        <td style="padding: 8px 0; color: #222222; text-align: right; font-weight: 600;">¥88,000</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #666666;">Deposit Paid</td>
        <td style="padding: 8px 0; color: #222222; text-align: right; font-weight: 600;">¥10,000</td>
      </tr>
    </table>
    
    <!-- Balance Due Box - EMPHASIZED CASH ONLY -->
    <div style="background-color: #fff5f5; border: 2px solid #E60012; border-radius: 8px; padding: 20px; margin: 15px 0 35px 0; text-align: center;">
      <h3 style="color: #E60012; margin: 0 0 12px 0; font-size: 18px;">
        ⚠️ IMPORTANT NOTICE FOR TOUR DAY
      </h3>
      <p style="margin: 0; font-size: 16px; font-weight: bold; color: #111111; line-height: 1.5;">
        On the day of your tour, please pay the remaining balance in <strong style="color: #E60012; text-decoration: underline;">CASH (JPY)</strong> directly to the driver.
      </p>
    </div>

    <!-- Contact section -->
    <h2 style="font-size: 18px; font-weight: 700; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px; margin-top: 0; color: #111111; letter-spacing: 0.5px;">Contact Information</h2>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 15px;">
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #f5f5f5; color: #666666; width: 40%;">Email</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #f5f5f5; font-weight: 600; color: #222222;">klaudia.lalewicz@interia.pl</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #f5f5f5; color: #666666;">Instagram</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #f5f5f5; font-weight: 600; color: #222222;">clauddie_</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #f5f5f5; color: #666666;">WhatsApp</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #f5f5f5; font-weight: 600; color: #222222;">+48 608899236</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #f5f5f5; color: #666666;">Remarks</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #f5f5f5; font-weight: 600; color: #222222; max-width: 250px; word-wrap: break-word;">Poland</td>
      </tr>
    </table>

    <div style="margin-top: 40px; font-size: 15px; color: #555555; line-height: 1.6; background-color: #fcfcfc; padding: 20px; border-radius: 8px;">
      <p style="margin-top: 0;">We will contact you via WhatsApp or Instagram before the tour day to confirm finalized details and precise pickup times.</p>
      <p>If you have any questions or need to make changes, please reply to our Instagram (<a href="https://instagram.com/daikoku_hunters" style="color: #E60012; font-weight: bold; text-decoration: none;">@daikoku_hunters</a>) or simply reply to this email.</p>
      
      <p style="margin: 25px 0 0;">Best regards,</p>
      <p style="margin: 5px 0 0; font-weight: 800; color: #111111; font-size: 16px;">DAIKOKU HUNTERS Tours</p>
    </div>
  </div>
  
  <!-- Footer -->
  <div style="background-color: #1a1a1a; color: #888888; text-align: center; padding: 20px; font-size: 12px;">
    &copy; 2026 DAIKOKU HUNTERS. All rights reserved.<br>
    <a href="https://www.daikokuhunter.com" style="color: #cccccc; text-decoration: none; margin-top: 10px; display: inline-block;">www.daikokuhunter.com</a>
  </div>
</div>
`.trim();

const params = {
    to_name: "Klaudia Lalewicz",
    from_name: "Highway Godzilla Tours",
    driver_email: "tour@daikokuhunter.com",
    to_email: "klaudia.lalewicz@interia.pl",
    recipient_email: "klaudia.lalewicz@interia.pl",
    reply_to: "tour@daikokuhunter.com",
    message_body: customerBody,
    tour_date: "Wed Jun 03 2026",
    tour_type: "City Tour 11:00 PM",
    vehicle: "Random Car & Random Car",
    guests: "5",
    contact_email: "klaudia.lalewicz@interia.pl",
    contact_instagram: "clauddie_",
    contact_whatsapp: "+48 608899236",
    hotel: "Hotel Vista Tokyo Tsukiji",
    options_detail: "Shibuya",
    options: "Shibuya",
    total_price: "¥88,000",
    deposit: "¥10,000",
    balance: "¥78,000"
};

const payload = {
    service_id: EMAILJS_SERVICE_ID,
    template_id: EMAILJS_CUSTOMER_TEMPLATE_ID,
    user_id: EMAILJS_PUBLIC_KEY,
    template_params: params
};

async function send() {
    console.log("Sending email to Klaudia...");
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Origin': 'http://localhost:5173',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
        },
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        const text = await response.text();
        console.error("EmailJS Error:", text);
    } else {
        console.log("Email sent successfully!");
    }
}
send();
