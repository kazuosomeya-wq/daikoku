import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: 'AIzaSyADAJTHA2x8FR_HqrlnZkOd1ZJCGvO5Jyg',
    authDomain: 'daikoku-tour-booking.firebaseapp.com',
    projectId: 'daikoku-tour-booking',
    storageBucket: 'daikoku-tour-booking.firebasestorage.app',
    messagingSenderId: '393296082463',
    appId: '1:393296082463:web:1bf429cd77d25f9db6872a'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function simulateSort() {
    console.log("Fetching vehicles...");
    const snapshot = await getDocs(collection(db, 'vehicles'));
    const vehicles = [];
    snapshot.forEach(doc => {
        vehicles.push({ id: doc.id, ...doc.data() });
    });

    console.log(`\nFound ${vehicles.length} vehicles.`);

    // EXACT LOGIC FROM DEPLOYED CODE
    const sorted = vehicles
        .filter(v => v.isVisible !== false)
        .sort((a, b) => {
            // Treat 0, null, or undefined as 999 (bottom of list)
            const getOrder = (o) => (!o || o === 0) ? 999 : o;
            return getOrder(a.displayOrder) - getOrder(b.displayOrder);
        });

    console.log("\n--- SORTED RESULT (As it should appear on site) ---");
    sorted.forEach((v, i) => {
        const orderVal = v.displayOrder;
        const treatedAs = (!orderVal || orderVal === 0) ? 999 : orderVal;
        console.log(`#${i + 1}: [${treatedAs}] ${v.name} (Real Val: ${orderVal})`);
    });
}

simulateSort();
