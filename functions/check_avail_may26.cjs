const admin = require("firebase-admin");
const serviceAccount = require("./service-account.json");

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

async function run() {
    const snap = await db.collection("vehicle_availability").get();
    let count = 0;
    snap.forEach(doc => {
        const data = doc.data();
        if (data.daikokuDates && data.daikokuDates.includes("2026-05-26")) {
            count++;
            console.log(`${doc.id} is available for Daikoku Tour on May 26`);
        }
    });
    console.log(`Total vehicles available on May 26: ${count}`);
}

run().catch(console.error);
