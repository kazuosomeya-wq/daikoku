import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyADAJTHA2x8FR_HqrlnZkOd1ZJCGvO5Jyg",
    authDomain: "daikoku-tour-booking.firebaseapp.com",
    projectId: "daikoku-tour-booking",
    storageBucket: "daikoku-tour-booking.firebasestorage.app",
    messagingSenderId: "393296082463",
    appId: "1:393296082463:web:1bf429cd77d25f9db6872a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const generateDates = (startDate, endDate) => {
    const dates = [];
    let current = new Date(startDate);
    while (current <= endDate) {
        const yyyy = current.getFullYear();
        const mm = String(current.getMonth() + 1).padStart(2, '0');
        const dd = String(current.getDate()).padStart(2, '0');
        dates.push(`${yyyy}-${mm}-${dd}`);
        current.setDate(current.getDate() + 1);
    }
    return dates;
};

const today = new Date();
const endDate = new Date('2026-12-31');
const allDates = generateDates(today, endDate);

const updateAvailability = async () => {
    try {
        const ref = doc(db, 'vehicle_availability', 'random-cars');
        await setDoc(ref, {
            daikokuDates: allDates,
            umihotaruDates: allDates
        }, { merge: true });
        console.log("Successfully opened all dates for random-cars!");
    } catch (e) {
        console.error("Error:", e);
    }
    process.exit(0);
};

updateAvailability();
