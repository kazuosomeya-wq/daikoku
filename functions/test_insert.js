const admin = require("firebase-admin");
const { google } = require("googleapis");
const path = require("path");

const SPREADSHEET_ID = "18cy4caeDR5ThGkPNRlG3Gx4nuSMC8dLzye216ksJPUk";

const serviceAccount = require("./service-account.json");
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

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

async function runTestInsert() {
    try {
        const bookingsSnapshot = await db.collection("bookings").orderBy("date", "desc").limit(1).get();
        if (bookingsSnapshot.empty) return console.log("No bookings found.");
        
        const doc = bookingsSnapshot.docs[0];
        const data = doc.data();

        // 1. Parse Created Date (Deposit) "M/D"
        let createdDate = "";
        let d = null;
        const ts = data.timestamp || data.createdAt;
        if (ts && typeof ts.toDate === 'function') {
            d = ts.toDate();
        } else if (ts && typeof ts === 'string') {
            d = new Date(ts);
        } else if (ts && ts._seconds) {
            d = new Date(ts._seconds * 1000);
        }
        if (d) {
            const tokyoDate = new Date(d.toLocaleString("en-US", {timeZone: "Asia/Tokyo"}));
            createdDate = `${tokyoDate.getMonth() + 1}/${tokyoDate.getDate()}`;
        }

        // 2. Parse Tour Date (Balance) "M/D"
        let tourDate = "";
        if (data.date) {
            const td = new Date(data.date);
            if (!isNaN(td)) {
                tourDate = `${td.getMonth() + 1}/${td.getDate()}`;
            } else {
                tourDate = data.date;
            }
        }

        const car1 = getCarSlug(data.vehicleName1);
        const car2 = getCarSlug(data.vehicleName2);
        const car3 = getCarSlug(data.vehicleName3);
        const carDesignation = [car1, car2, car3].filter(Boolean).join(", ") || "なし";

        const optionsRaw = data.options || {};
        let optionsText = "なし";
        let optArr = [];
        if (optionsRaw.tokyoTower) optArr.push("Tokyo Tower");
        if (optionsRaw.shibuya) optArr.push("Shibuya crossing");
        if (optArr.length > 0) optionsText = optArr.join(", ");

        const balance = (parseInt(data.totalToken) || 0) - (parseInt(data.amountPaid) || 0);

        const rowData = [
            "",                                          // A: No.
            "異常なし",                                  // B: キャンセル
            data.name || "",                             // C: 顧客名
            data.planType || data.tourType || "",        // D: プラン
            data.guests || "",                           // E: 人数
            optionsText,                                 // F: オプション
            carDesignation,                              // G: 車両指名
            createdDate,                                 // H: デポジット 受取日
            "Stripe",                                    // I: デポジット PF
            data.amountPaid || "",                       // J: デポジット 金額
            tourDate,                                    // K: 残金 受取日 (ツアー日)
            "現金",                                      // L: 残金 PF
            balance,                                     // M: 残金 金額
            data.totalToken || "",                       // N: 売上合計
            car1, "",                                    // O - P: Driver 1 Name & Reward
            car2, "",                                    // Q - R: Driver 2 Name & Reward
            car3, "",                                    // S - T: Driver 3 Name & Reward
            "", "",                                      // U - V: Driver Total, Profit
            `Email: ${data.email || '無'} | Phone: ${data.phone || '無'} | IG: ${data.instagram || '無'}`, // W: 連絡先
            data.notes || data.remarks || "なし",        // X: 備考欄
            data.hotel || "",                            // Y: ホテル
            doc.id || ""                                 // Z: メモ (予約ID)
        ];

        const auth = new google.auth.GoogleAuth({
            keyFile: path.join(__dirname, "service-account.json"),
            scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });
        const authClient = await auth.getClient();
        const sheets = google.sheets({ version: "v4", auth: authClient });

        const request = {
            spreadsheetId: SPREADSHEET_ID,
            range: "'stripe2026'!A38:Z38", // Force EXACTLY row 38
            valueInputOption: "USER_ENTERED",
            resource: {
                values: [rowData],
            },
        };

        const response = await sheets.spreadsheets.values.update(request); 
        console.log(`Successfully updated 1 test booking to row: ${response.data.updatedRange}`);

    } catch (error) {
        console.error("Error:", error);
    }
}
runTestInsert();
