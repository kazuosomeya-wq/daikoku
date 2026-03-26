const admin = require("firebase-admin");
const serviceAccount = require("./service-account.json");
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function runTest2() {
    console.log("Starting test...");
    const snap = await db.collection("bookings").where("name", "==", "Tobias Lippert").get();
    if(snap.empty) console.log("Empty snap");
    snap.forEach((doc) => {
        const data = doc.data();
        let createdDate = "";
        let d = null;
        const ts = data.timestamp || data.createdAt;
        console.log("Raw ts:", ts);
        console.log("typeof ts.toDate:", typeof ts?.toDate);
        
        if (ts && typeof ts.toDate === 'function') {
            d = ts.toDate();
            console.log("Matched: ts.toDate() =", d);
        } else if (ts && typeof ts === 'string') {
            d = new Date(ts);
            console.log("Matched: string =", d);
        } else if (ts && ts._seconds) {
            console.log("ts is not a function:", ts);
            d = new Date(ts._seconds * 1000);
            console.log("Matched: _seconds =", d);
        }
        if (d) {
            const tokyoDate = new Date(d.toLocaleString("en-US", {timeZone: "Asia/Tokyo"}));
            console.log("Tokyo Date:", tokyoDate);
            createdDate = `${tokyoDate.getMonth() + 1}/${tokyoDate.getDate()}`;
        }
        console.log("FINAL createdDate:", createdDate);
    });
}
runTest2();
