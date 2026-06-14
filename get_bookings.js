import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync('./src/firebase_config.json', 'utf8')); // Wait, I need to know how to init firebase in a script
