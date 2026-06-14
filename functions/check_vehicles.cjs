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
    let numVisible = 0;
    snap.forEach(doc => {
        const data = doc.data();
        if (data.isVisible !== false) numVisible++;
    });
    console.log(`Total vehicles: ${snap.size}, Visible vehicles: ${numVisible}`);
}

run().catch(console.error);
