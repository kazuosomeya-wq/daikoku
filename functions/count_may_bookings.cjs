const admin = require("firebase-admin");
const serviceAccount = require("./service-account.json");

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

async function run() {
    const snap = await db.collection("bookings").get();
    
    let total = 0;
    let valid = 0;
    let statuses = {};
    
    snap.forEach(doc => {
        const data = doc.data();
        let dateStr = data.date || "";
        // date string looks like "Thu May 28 2026"
        if (dateStr.includes("May") && dateStr.includes("2026")) {
            let status = data.status || "unknown";
            statuses[status] = (statuses[status] || 0) + 1;
            total++;
            if (status !== 'cancelled' && status !== 'declined') {
                valid++;
            }
        }
    });
    
    console.log(`Total bookings in May 2026: ${total}`);
    console.log(`Valid bookings (excluding cancelled/declined): ${valid}`);
    console.log("Statuses:", statuses);
}

run().catch(console.error);
