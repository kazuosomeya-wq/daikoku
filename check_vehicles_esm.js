import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc } from 'firebase/firestore';

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

async function checkAndRestore() {
    const snapshot = await getDocs(collection(db, 'vehicles'));
    console.log('Current Vehicle Count:', snapshot.size);
    const vehicles = [];
    snapshot.forEach(doc => {
        vehicles.push({ id: doc.id, ...doc.data() });
    });

    vehicles.sort((a, b) => {
        const getOrder = (o) => (o !== undefined && o !== null) ? o : 999;
        return getOrder(a.displayOrder) - getOrder(b.displayOrder);
    });

    vehicles.forEach(d => {
        console.log(`Vehicle: ${d.name} | Order: ${d.displayOrder} (${typeof d.displayOrder}) | Visible: ${d.isVisible}`);
    });

    if (snapshot.size === 0) {
        console.log('No vehicles found. Restoring defaults...');
        // Note: Using placeholder images for now as we can't easily upload local files to Storage via Node script without full SDK
        // But we can use public URLs if we had them. For now, we'll verify count 0 first.
    }
}

checkAndRestore();
