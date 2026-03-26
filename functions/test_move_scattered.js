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

async function runFix() {
    console.log("Starting to fix scattered bookings...");
    const auth = new google.auth.GoogleAuth({
        keyFile: path.join(__dirname, "service-account.json"),
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: authClient });
    
    // Get all rows to check
    const getRes = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: "'stripe2026'!A1:Z120",
    });
    const sheetRows = getRes.data.values || [];
    
    const snap = await db.collection("bookings").orderBy("timestamp", "desc").limit(30).get();
    
    const toMove = [];
    
    snap.forEach(doc => {
        const d = doc.data();
        const name = d.name ? d.name.trim() : "";
        if (!name || name.toLowerCase() === "test" || name.includes("Test")) return;
        
        let foundRowIndex = -1;
        for (let i = 0; i < sheetRows.length; i++) {
            if (sheetRows[i] && sheetRows[i][2] && sheetRows[i][2].trim().toLowerCase() === name.toLowerCase()) {
                foundRowIndex = i;
                break;
            }
        }
        
        // If it's found in the upper portion (e.g. before Row 97)
        if (foundRowIndex !== -1 && foundRowIndex < 96) {
            toMove.push({
                name: name,
                oldRowIndex: foundRowIndex,
                rowData: sheetRows[foundRowIndex],
                date: d.timestamp ? (d.timestamp.toDate ? d.timestamp.toDate() : new Date(d.timestamp)) : new Date()
            });
        }
    });
    
    if (toMove.length === 0) {
        console.log("No scattered bookings found to move.");
        return;
    }
    
    console.log(`Found ${toMove.length} scattered bookings. Moving them to the bottom...`);
    
    // Sort them chronologically just in case
    toMove.sort((a, b) => a.date - b.date);
    
    for (const item of toMove) {
        const oldRowNumber = item.oldRowIndex + 1;
        console.log(`Moving ${item.name} from Row ${oldRowNumber}...`);
        
        // 1. Clear the old row
        await sheets.spreadsheets.values.clear({
            spreadsheetId: SPREADSHEET_ID,
            range: `'stripe2026'!A${oldRowNumber}:Z${oldRowNumber}`,
        });
        
        // 2. Find the absolute bottom (using C column)
        const currentRes = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: "'stripe2026'!C:C",
        });
        const numRows = currentRes.data.values ? currentRes.data.values.length : 0;
        const targetRow = numRows + 1;
        
        // 3. Insert the exact preserved row data at the bottom
        const request = {
            spreadsheetId: SPREADSHEET_ID,
            range: `'stripe2026'!A${targetRow}:Z${targetRow}`,
            valueInputOption: "USER_ENTERED",
            resource: {
                values: [item.rowData],
            },
        };
        await sheets.spreadsheets.values.update(request);
        console.log(`Successfully moved ${item.name} to Row ${targetRow}.`);

        // Add a delay to avoid API rate limits / ECONNRESET
        await new Promise(r => setTimeout(r, 1500));
    }
    
    console.log("All scattered bookings moved successfully!");
}
runFix();
