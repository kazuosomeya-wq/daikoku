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
        if (data.driverNickname) {
            console.log(doc.id, "=>", data.driverNickname, "(name:", data.name, ")");
        } else {
            console.log(doc.id, "=> No nickname", "(name:", data.name, ")");
        }
    });
}
run();
