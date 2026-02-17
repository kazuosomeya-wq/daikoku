const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkVehicles() {
    const snapshot = await db.collection("vehicles").get();
    console.log(`Found ${snapshot.size} vehicles.`);
    snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`ID: ${doc.id}, Name: ${data.name}, isVisible: ${data.isVisible} (${typeof data.isVisible})`);
    });
}

checkVehicles();
