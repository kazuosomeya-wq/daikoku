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
        if (JSON.stringify(data).includes("34りんごあめ")) {
            console.log("Found:", doc.id, data);
        }
    });
}
run();
