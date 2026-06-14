const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs } = require('firebase/firestore');

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

async function findBooking() {
    const q = query(collection(db, 'bookings'), where('email', '==', 'klaudia.lalewicz@interia.pl'));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        console.log('No booking found for this email.');
        return;
    }
    snapshot.forEach(doc => {
        console.log('ID:', doc.id);
        console.log('Data:', JSON.stringify(doc.data(), null, 2));
    });
}

findBooking().catch(console.error);
