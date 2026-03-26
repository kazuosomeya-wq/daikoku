const admin = require("firebase-admin");
const serviceAccount = require("./service-account.json");
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function runTest3() {
    const snap = await db.collection("bookings").get();
    snap.forEach((doc) => {
        const data = doc.data();
        let createdDate = "";
        let d = null;
        const ts = data.timestamp || data.createdAt;
        if (ts && typeof ts.toDate === 'function') {
            d = ts.toDate();
        } else if (ts && typeof ts === 'string') {
            d = new Date(ts);
        } else if (ts && ts._seconds) {
            d = new Date(ts._seconds * 1000);
        }
        if (d) {
            const tokyoDate = new Date(d.toLocaleString("en-US", {timeZone: "Asia/Tokyo"}));
            createdDate = `${tokyoDate.getMonth() + 1}/${tokyoDate.getDate()}`;
        }
        if (data.name === "Tobias Lippert") {
            console.log("Found Tobias!", createdDate, data.date);
        }
    });
}
runTest3();
