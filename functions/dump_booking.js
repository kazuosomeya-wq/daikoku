const admin = require("firebase-admin");
const serviceAccount = require("./service-account.json");

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

async function run() {
    console.log("Fetching booking...");
    const snap = await db.collection("bookings").orderBy("date", "desc").limit(5).get();
    if (snap.empty) { 
        console.log("Empty"); 
        return; 
    }
    snap.docs.forEach(doc => {
        const data = doc.data();
        console.log("ID:", doc.id);
        console.log("Fields:", JSON.stringify(data, null, 2));
    });
}
run();
