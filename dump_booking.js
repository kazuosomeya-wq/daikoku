const admin = require("firebase-admin");
const serviceAccount = require("./functions/service-account.json");
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

async function run() {
    const snap = await db.collection("bookings").orderBy("date", "desc").limit(1).get();
    if (snap.empty) { console.log("Empty"); return; }
    console.log(snap.docs[0].data());
}
run();
