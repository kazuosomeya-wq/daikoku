import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

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

async function setupRandomR34() {
    try {
        console.log("Setting up Random R34 virtual vehicle...");

        const vehicleRef = doc(db, "vehicles", "random-r34");
        const vehicleSnap = await getDoc(vehicleRef);

        if (!vehicleSnap.exists()) {
            await setDoc(vehicleRef, {
                name: "Random R34 Pool",
                subtitle: "For any random R34 assignment",
                slug: "random-r34",
                isVisible: false, // Hide from specific vehicle selection
                price: 0,
                createdAt: new Date(),
                driverEmail: ""
            });
            console.log("Created 'random-r34' in vehicles collection.");
        } else {
            console.log("'random-r34' already exists. Updating visibility.");
            await setDoc(vehicleRef, { isVisible: false }, { merge: true });
        }

        // Initialize availability for the next 365 days so it's OPEN by default
        const availRef = doc(db, "vehicle_availability", "random-r34");
        const availSnap = await getDoc(availRef);

        if (!availSnap.exists() || !availSnap.data().daikokuDates) {
            const daikokuDates = [];
            const umihotaruDates = [];
            const today = new Date();

            for (let i = 0; i < 365; i++) {
                const date = new Date(today);
                date.setDate(today.getDate() + i);
                const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                daikokuDates.push(dateString);
                umihotaruDates.push(dateString);
            }

            await setDoc(availRef, {
                daikokuDates,
                umihotaruDates
            }, { merge: true });

            console.log("Seeded 365 days of availability for 'random-r34'.");
        } else {
            console.log("'random-r34' availability already seeded.");
        }

        console.log("Done!");
        process.exit(0);
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
}

setupRandomR34();
