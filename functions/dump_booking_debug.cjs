const admin = require("firebase-admin");
const serviceAccount = require("./service-account.json");
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

async function run() {
    console.log("Fetching Andres Lopera...");
    const snap1 = await db.collection("bookings").where("name", "==", "Andres Lopera").get();
    snap1.forEach(doc => {
        console.log("Andres Lopera Doc ID:", doc.id);
        console.log("Change History:", JSON.stringify(doc.data().changeHistory, null, 2));
    });

    console.log("\nFetching Owen Adams...");
    const snap2 = await db.collection("bookings").where("name", "==", "Owen Adams").get();
    snap2.forEach(doc => {
        console.log("Owen Adams Doc ID:", doc.id);
        console.log("Change History:", JSON.stringify(doc.data().changeHistory, null, 2));
    });
}
run();
