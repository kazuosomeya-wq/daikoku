const admin = require("firebase-admin");
const serviceAccount = require("./service-account.json");

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

async function run() {
    const snap = await db.collection("bookings").limit(5).get();
    snap.forEach(doc => {
        console.log("ID:", doc.id, "Date:", doc.data().date);
    });
}

run().catch(console.error);
