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
    
    // Fetch a larger range to search
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: "'stripe2026'!A1:Z",
    });
    
    const rows = res.data.values;
    if (!rows || rows.length === 0) return console.log("No data found.");
    
    let found = [];
    rows.forEach((row, i) => {
        const str = row.join(" ");
        if (str.includes("Gabriela") || str.includes("Leana") || str.includes("Test Sync Trigger")) {
            found.push(`Row ${i + 1}: ${row.join(" | ")}`);
        }
    });

    if (found.length) {
        console.log("Found matches:");
        console.log(found.join("\n"));
    } else {
        console.log("None of the test terms were found in the entire sheet.");
        console.log("Total rows in sheet:", rows.length);
    }
}
run();
