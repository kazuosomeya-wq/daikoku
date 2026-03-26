const admin = require("firebase-admin");
const serviceAccount = require("./functions/service-account.json");
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function run() {
    const snap = await db.collection("bookings").get();
    const rows = [];
    snap.forEach(doc => {
        const data = doc.data();
        let createdDate = "";
        let d = null;
        const ts = data.timestamp || data.createdAt;
        if (ts && typeof ts.toDate === 'function') d = ts.toDate();
        else if (ts && typeof ts === 'string') d = new Date(ts);
        else if (ts && ts._seconds) d = new Date(ts._seconds * 1000);
        if (d) {
            const td = new Date(d.toLocaleString("en-US", {timeZone: "Asia/Tokyo"}));
            createdDate = `${td.getMonth() + 1}/${td.getDate()}`;
        }
        rows.push([data.name, createdDate]);
    });
    
    rows.forEach(r => {
        if (r[0] === "Tobias Lippert" || r[0] === "Ziegler, Kai" || r[0] === "Tom Meyer") {
            console.log(r[0], " => ", r[1]);
        }
    });

}
run();
