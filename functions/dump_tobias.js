const admin = require("firebase-admin");
const serviceAccount = require("./service-account.json");
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

async function run() {
    const snap = await db.collection("bookings").where("name", "==", "Tobias Lippert").get();
    if (snap.empty) {
        console.log("No bookings found for Tobias");
        return;
    }
    snap.forEach(doc => {
        console.log("ID:", doc.id);
        console.log(doc.data());
    });
}
run();
