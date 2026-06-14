const admin = require("firebase-admin");
const serviceAccount = require("./functions/service-account.json");
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

async function run() {
    // "date" field in bookings is usually a string like "2026-05-22" or something similar?
    // Let's get all bookings for 2026-05.
    const snap = await db.collection("bookings")
                         .where("date", ">=", "2026-05-01")
                         .where("date", "<=", "2026-05-31")
                         .get();
    
    console.log("Total bookings in May 2026:", snap.size);
    // Let's also see what statuses they have
    let statuses = {};
    snap.forEach(doc => {
        let status = doc.data().status || "unknown";
        statuses[status] = (statuses[status] || 0) + 1;
    });
    console.log("Statuses:", statuses);
}
run().catch(console.error);
