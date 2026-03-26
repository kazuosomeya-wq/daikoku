const admin = require("firebase-admin");
const serviceAccount = require("./service-account.json");
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

async function checkRecent() {
    const snap = await db.collection("bookings").orderBy("timestamp", "desc").limit(20).get();
    snap.forEach(doc => {
        const d = doc.data();
        let ts = d.timestamp;
        if (ts && ts.toDate) ts = ts.toDate();
        console.log(`Booking: ${d.name}, Added: ${ts}`);
    });
}
checkRecent();
