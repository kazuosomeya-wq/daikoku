const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

async function run() {
    try {
        const docRef = db.collection('vehicles').doc('9Z0u7MsAKxPDJxKGBzj7');
        const docSnap = await docRef.get();
        if (docSnap.exists) {
            console.log("Vehicle found:");
            console.log(docSnap.data());
        } else {
            console.log("Vehicle not found in vehicles collection.");
        }
        
        // Also let's check recent bookings to see Ranno's booking
        const snapshot = await db.collection('bookings')
            .orderBy('timestamp', 'desc')
            .limit(5)
            .get();
        
        console.log("\nRecent bookings:");
        snapshot.forEach(doc => {
            const data = doc.data();
            console.log(`- ${data.name} / ${data.date} / Vehicle1: ${data.vehicleName1} / options.selectedVehicle: ${data.options?.selectedVehicle}`);
        });

    } catch (e) {
        console.error(e);
    }
}

run();
