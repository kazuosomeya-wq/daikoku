const admin = require("firebase-admin");
const serviceAccount = require("./service-account.json");

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

async function run() {
    const snap = await db.collection("vehicle_availability").get();
    const vehicleAvailability = {};
    snap.forEach(doc => { vehicleAvailability[doc.id] = doc.data(); });
    
    const planType = 'Daikoku Tour';
    const dateString = '2026-05-26';
    const disabled = [];
    
    // 4. Random R34
    const randomData = vehicleAvailability['random-r34'];
    let randomDates = [];
    if (randomData) {
        if (planType === 'Midnight Plan') {
            randomDates = randomData.umihotaruDates || [];
        } else {
            randomDates = randomData.daikokuDates || [];
            if ((!randomDates || randomDates.length === 0) && randomData.availableDates) {
                randomDates = randomData.availableDates;
            }
        }
    }
    console.log("Random R34 daikokuDates:", randomData?.daikokuDates);
    if (!randomDates || !randomDates.includes(dateString)) {
        if (!disabled.includes('random-r34')) disabled.push('random-r34');
    }
    
    console.log("Disabled random-r34?", disabled.includes('random-r34'));
    
    // 5. Random Cars
    const randomCarsData = vehicleAvailability['random-cars'];
    let randomCarsDates = [];
    if (randomCarsData) {
        if (planType === 'Midnight Plan') {
            randomCarsDates = randomCarsData.umihotaruDates || [];
        } else {
            randomCarsDates = randomCarsData.daikokuDates || [];
            if ((!randomCarsDates || randomCarsDates.length === 0) && randomCarsData.availableDates) {
                randomCarsDates = randomCarsData.availableDates;
            }
        }
    }
    if (!randomCarsDates || !randomCarsDates.includes(dateString)) {
        if (!disabled.includes('random-cars')) disabled.push('random-cars');
    }
    
    console.log("Disabled random-cars?", disabled.includes('random-cars'));
}

run().catch(console.error);
