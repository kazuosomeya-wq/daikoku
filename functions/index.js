const { onRequest, onCall } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { google } = require("googleapis");
const path = require("path");

admin.initializeApp();

// Calculate Deposit Helper
const calculateDeposit = (guests) => {
    let deposit = 0;
    // Basic rule: ¥5,000 per car.
    // 1-3 guests = 1 car
    // 4-6 guests = 2 cars
    // 7-9 guests = 3 cars
    // ...
    const carCount = Math.ceil(guests / 3);
    deposit = carCount * 5000;
    return deposit;
};

exports.createPaymentIntent = onRequest({ cors: true }, async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    try {
        const { guests, tourType } = req.body;

        console.log("Received payment request:", { guests, tourType });

        // Calculate deposit amount server-side for security
        const depositAmount = calculateDeposit(guests);

        console.log("Creating PaymentIntent with amount:", depositAmount);

        // Create a PaymentIntent with the order amount and currency
        const paymentIntent = await stripe.paymentIntents.create({
            amount: depositAmount,
            currency: "jpy",
            metadata: {
                tourType: tourType,
                guests: guests,
                integration_check: 'accept_a_payment'
            },
            payment_method_types: ['card'],
        });

        console.log("PaymentIntent created:", paymentIntent.id);
        console.log("Client Secret starts with:", paymentIntent.client_secret ? paymentIntent.client_secret.substring(0, 15) + "..." : "NULL");

        res.status(200).send({
            clientSecret: paymentIntent.client_secret,
            amount: depositAmount
        });

    } catch (error) {
        console.error("Stripe Error:", error);
        res.status(500).send({ error: error.message });
    }
});

// ==========================================
// Google Sheets Integration
// ==========================================
const SPREADSHEET_ID = "18cy4caeDR5ThGkPNRlG3Gx4nuSMC8dLzye216ksJPUk";


function getCarSlug(carName) {
    if (!carName) return "";
    const name = carName.toLowerCase();
    if (name.includes("random")) return "random-r34";
    if (name.includes("600hp") && name.includes("r34")) return "600hp-kae-r34";
    if (name.includes("600hp") && name.includes("r35")) return "600hp-r35";
    if (name.includes("r34") && name.includes("bayside")) return "r34"; 
    if (name.includes("r35")) return "r35";
    if (name.includes("rx7") || name.includes("rx-7")) return "rx7";
    if (name.includes("supra")) return "supra";
    if (name.includes("86")) return "86";
    if (name.includes("evo")) return "evo-x";
    return carName;
}

exports.syncBookingToSheet = functions.region("asia-northeast1").firestore.document("bookings/{docId}").onCreate(async (snap, context) => {
    if (!snap) {
        console.log("No data associated with the event");
        return;
    }

    const newBooking = snap.data();
    const docId = context.params.docId;

    console.log(`New booking detected: ${docId}, syncing to Google Sheets...`);

    try {
        // Build the Auth Client
        const auth = new google.auth.GoogleAuth({
            keyFile: path.join(__dirname, "service-account.json"),
            scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });
        const authClient = await auth.getClient();
        const sheets = google.sheets({ version: "v4", auth: authClient });

        // 1. Parse Created Date (Deposit) "M/D"
        let createdDate = "";
        let d = null;
        const ts = newBooking.timestamp || newBooking.createdAt;
        if (ts && typeof ts.toDate === 'function') {
            d = ts.toDate();
        } else if (ts && typeof ts === 'string') {
            d = new Date(ts);
        } else if (ts && ts._seconds) {
            d = new Date(ts._seconds * 1000);
        } else if (snap.createTime) {
            d = new Date(snap.createTime.toDate());
        }
        if (d) {
            const tokyoDate = new Date(d.toLocaleString("en-US", {timeZone: "Asia/Tokyo"}));
            createdDate = `${tokyoDate.getMonth() + 1}/${tokyoDate.getDate()}`;
        }

        // 2. Parse Tour Date (Balance) "M/D"
        let tourDate = "";
        if (newBooking.date) {
            const td = new Date(newBooking.date);
            if (!isNaN(td)) {
                tourDate = `${td.getMonth() + 1}/${td.getDate()}`;
            } else {
                tourDate = newBooking.date;
            }
        }

        const car1 = getCarSlug(newBooking.vehicleName1);
        const car2 = getCarSlug(newBooking.vehicleName2);
        const car3 = getCarSlug(newBooking.vehicleName3);
        const carDesignation = [car1, car2, car3].filter(Boolean).join(", ") || "なし";

        const optionsRaw = newBooking.options || {};
        let optionsText = "なし";
        let optArr = [];
        if (optionsRaw.tokyoTower) optArr.push("Tokyo Tower");
        if (optionsRaw.shibuya) optArr.push("Shibuya crossing");
        if (optArr.length > 0) optionsText = optArr.join(", ");

        const balance = (parseInt(newBooking.totalToken) || 0) - (parseInt(newBooking.amountPaid) || 0);

        const rowData = [
            "",                                          // A: No.
            "異常なし",                                  // B: キャンセル
            newBooking.name || "",                       // C: 顧客名
            newBooking.planType || newBooking.tourType || "", // D: プラン
            newBooking.guests || "",                     // E: 人数
            optionsText,                                 // F: オプション
            carDesignation,                              // G: 車両指名
            createdDate,                                 // H: デポジット 受取日
            "Stripe",                                    // I: デポジット PF
            newBooking.amountPaid || "",                 // J: デポジット 金額
            tourDate,                                    // K: 残金 受取日 (ツアー日)
            "現金",                                      // L: 残金 PF
            balance,                                     // M: 残金 金額
            newBooking.totalToken || "",                 // N: 売上合計
            car1, "",                                    // O - P: Driver 1 Name & Reward
            car2, "",                                    // Q - R: Driver 2 Name & Reward
            car3, "",                                    // S - T: Driver 3 Name & Reward
            "", "",                                      // U - V: Driver Total, Profit
            `Email: ${newBooking.email || '無'} | Phone: ${newBooking.phone || '無'} | IG: ${newBooking.instagram || '無'}`, // W: 連絡先
            newBooking.notes || newBooking.remarks || "なし", // X: 備考欄
            newBooking.hotel || "",                      // Y: ホテル
            docId || ""                                  // Z: メモ (予約ID)
        ];

        // Find the absolute last row by checking column C (Customer Name)
        const getRes = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: "'stripe2026'!C:C",
        });
        const numRows = getRes.data.values ? getRes.data.values.length : 0;
        const targetRow = numRows + 1; // Insert right after the last name

        const request = {
            spreadsheetId: SPREADSHEET_ID,
            range: `'stripe2026'!A${targetRow}:Z${targetRow}`,
            valueInputOption: "USER_ENTERED",
            resource: {
                values: [rowData],
            },
        };

        const response = await sheets.spreadsheets.values.update(request);
        console.log(`Successfully appended booking ${docId} to row: ${response.data.updatedRange}`);

    } catch (error) {
        console.error("Error syncing to Google Sheets:", error);
    }
});

// ==========================================
// Admin: Update existing booking row in Sheets
// ==========================================
exports.updateBookingInSheet = onCall({ region: "asia-northeast1" }, async (request) => {
    const { docId, bookingData } = request.data;
    if (!docId || !bookingData) {
        throw new Error("Missing docId or bookingData");
    }

    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: path.join(__dirname, "service-account.json"),
            scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });
        const authClient = await auth.getClient();
        const sheets = google.sheets({ version: "v4", auth: authClient });

        // Find row by docId in column Z
        const getRes = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: "'stripe2026'!Z:Z",
        });
        const rows = getRes.data.values || [];
        let targetRow = -1;
        for (let i = 0; i < rows.length; i++) {
            if (rows[i][0] === docId) { targetRow = i + 1; break; }
        }
        if (targetRow === -1) {
            console.warn(`Row not found for docId: ${docId}`);
            return { success: false, message: "Row not found" };
        }

        // Parse tour date
        let tourDate = "";
        if (bookingData.date) {
            const td = new Date(bookingData.date);
            if (!isNaN(td)) tourDate = `${td.getMonth() + 1}/${td.getDate()}`;
            else tourDate = bookingData.date;
        }

        const balance = (parseInt(bookingData.totalToken) || 0) - (parseInt(bookingData.deposit) || 0);

        await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            requestBody: {
                valueInputOption: "USER_ENTERED",
                data: [
                    { range: `'stripe2026'!B${targetRow}`, values: [[bookingData.status === "Canceled" ? "キャンセル" : "異常なし"]] },
                    { range: `'stripe2026'!C${targetRow}`, values: [[bookingData.name || ""]] },
                    { range: `'stripe2026'!D${targetRow}`, values: [[bookingData.tourType || ""]] },
                    { range: `'stripe2026'!E${targetRow}`, values: [[bookingData.guests || ""]] },
                    { range: `'stripe2026'!K${targetRow}`, values: [[tourDate]] },
                    { range: `'stripe2026'!M${targetRow}`, values: [[balance]] },
                    { range: `'stripe2026'!N${targetRow}`, values: [[bookingData.totalToken || ""]] },
                    { range: `'stripe2026'!W${targetRow}`, values: [[`Email: ${bookingData.email || "無"} | IG: ${bookingData.instagram || "無"} | WA: ${bookingData.whatsapp || "無"}`]] },
                    { range: `'stripe2026'!X${targetRow}`, values: [[bookingData.adminNote || bookingData.remarks || "なし"]] },
                    { range: `'stripe2026'!Y${targetRow}`, values: [[bookingData.hotel || ""]] },
                ],
            },
        });

        console.log(`Updated booking ${docId} at row ${targetRow}`);
        return { success: true, row: targetRow };

    } catch (error) {
        console.error("Error updating Google Sheets:", error);
        throw new Error("Sheet update failed: " + error.message);
    }
});
