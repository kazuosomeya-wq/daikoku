const { google } = require("googleapis");
const path = require("path");
const SPREADSHEET_ID = "18cy4caeDR5ThGkPNRlG3Gx4nuSMC8dLzye216ksJPUk";

async function run() {
    const auth = new google.auth.GoogleAuth({
        keyFile: path.join(__dirname, "service-account.json"),
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: authClient });
    
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: "'stripe2026'!A1:Z120",
    });
    
    const rows = res.data.values;
    if (!rows) return;
    
    console.log("Looking for shifted rows (empty C, but data in O/P/Q)...");
    rows.forEach((row, i) => {
        // row[2] is C, row[15] is P
        if (!row[2] && row[14] === "異常なし") {
            console.log(`Row ${i + 1} is shifted:`, row.join(" | "));
        }
    });
}
run();
