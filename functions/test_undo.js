const { google } = require("googleapis");
const path = require("path");
const SPREADSHEET_ID = "18cy4caeDR5ThGkPNRlG3Gx4nuSMC8dLzye216ksJPUk";

async function undo() {
    const auth = new google.auth.GoogleAuth({
        keyFile: path.join(__dirname, "service-account.json"),
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: authClient });
    
    // Get the mistakenly moved rows
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: "'stripe2026'!A99:Z101",
    });
    const rows = res.data.values;
    
    // Put them back
    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: "'stripe2026'!A92:Z92",
        valueInputOption: "USER_ENTERED",
        resource: { values: [rows[0]] }, // Miranda
    });
    
    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: "'stripe2026'!A48:Z48",
        valueInputOption: "USER_ENTERED",
        resource: { values: [rows[1]] }, // Raul
    });

    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: "'stripe2026'!A50:Z50",
        valueInputOption: "USER_ENTERED",
        resource: { values: [rows[2]] }, // Ricardo
    });
    
    // Clear 99 to 101
    await sheets.spreadsheets.values.clear({
        spreadsheetId: SPREADSHEET_ID,
        range: "'stripe2026'!A99:Z101",
    });
    
    console.log("Restored original order!");
}
undo();
