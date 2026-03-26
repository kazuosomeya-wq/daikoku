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
        range: "'stripe2026'!A90:Z",
    });
    
    const rows = res.data.values;
    if (!rows || rows.length === 0) return console.log("No data found.");
    
    console.log("Last 5 rows:");
    rows.slice(-5).forEach((row, i) => {
        console.log("Row:", row.join(" | "));
    });
}
run();
