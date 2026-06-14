const admin = require("firebase-admin");
const serviceAccount = require("./service-account.json");
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

async function run() {
    const snap = await db.collection("vehicles").get();
    snap.forEach(doc => {
        const data = doc.data();
        if (data.driverNickname && data.driverNickname.includes("34りんごあめ")) {
            console.log("Vehicle ID:", doc.id);
            console.log("Data:", data);
        }
    });
}
run();
