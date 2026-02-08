const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

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

async function checkVehicles() {
    const snapshot = await getDocs(collection(db, 'vehicles'));
    console.log('Vehicle Count:', snapshot.size);
    snapshot.forEach(doc => {
        console.log(doc.id, '=>', doc.data().name);
    });
}

checkVehicles();
