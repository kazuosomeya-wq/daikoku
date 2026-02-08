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
    snapshot.forEach(doc => {
        console.log('Existing:', doc.id, '=>', doc.data().name);
    });

    if (snapshot.size === 0) {
        console.log('No vehicles found. Restoring defaults...');
        // Note: Using placeholder images for now as we can't easily upload local files to Storage via Node script without full SDK
        // But we can use public URLs if we had them. For now, we'll verify count 0 first.
    }
}

checkAndRestore();
