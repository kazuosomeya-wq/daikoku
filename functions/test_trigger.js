const admin = require("firebase-admin");
const serviceAccount = require("./service-account.json");
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

async function addDummyBooking() {
    try {
        const docRef = await db.collection("bookings").add({
            name: "Test Sync Trigger Final",
            tourType: "Daikoku Tour",
            guests: 2,
            amountPaid: 5000,
            date: "2026-04-01",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            vehicleName1: "r34",
            email: "test@example.com",
            totalToken: 35000,
            notes: "Please delete this test row"
        });
        console.log("Added test booking with ID:", docRef.id);
    } catch (e) {
        console.error("Error:", e);
    }
}
addDummyBooking();
