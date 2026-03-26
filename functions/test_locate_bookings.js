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

async function runCheck() {
    const auth = new google.auth.GoogleAuth({
        keyFile: path.join(__dirname, "service-account.json"),
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: authClient });
    
    // Get existing strings from Sheets
    const getRes = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: "'stripe2026'!C1:C120",
    });
    const sheetRows = getRes.data.values || [];
    
    const snap = await db.collection("bookings").orderBy("timestamp", "desc").limit(20).get();
    
    console.log("Recent 20 Bookings vs Sheet Row:");
    snap.forEach(doc => {
        const name = doc.data().name ? doc.data().name.trim() : "";
        if (!name || name.toLowerCase() === "test" || name.includes("Test")) return;
        
        let foundRow = -1;
        for (let i = 0; i < sheetRows.length; i++) {
            if (sheetRows[i] && sheetRows[i][0] && sheetRows[i][0].trim().toLowerCase() === name.toLowerCase()) {
                foundRow = i + 1; // 1-indexed
                break;
            }
        }
        console.log(`- ${name}: ${foundRow !== -1 ? 'Row ' + foundRow : 'MISSING!'}`);
    });
}
runCheck();
