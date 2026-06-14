const admin = require("firebase-admin");
const serviceAccount = require("./service-account.json");

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

async function run() {
    const snap = await db.collection("vehicle_availability").doc("random-cars").get();
    console.log("Random Cars Data:", snap.data());
}

run().catch(console.error);
