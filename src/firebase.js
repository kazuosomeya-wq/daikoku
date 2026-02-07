import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyADAJTHA2x8FR_HqrlnZkOd1ZJCGvO5Jyg",
    authDomain: "daikoku-tour-booking.firebaseapp.com",
    projectId: "daikoku-tour-booking",
    storageBucket: "daikoku-tour-booking.firebasestorage.app",
    messagingSenderId: "393296082463",
    appId: "1:393296082463:web:1bf429cd77d25f9db6872a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Auth and Firestore services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
