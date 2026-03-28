const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function run() {
  const snapshot = await db.collection('bookings').orderBy('timestamp', 'desc').limit(2).get();
  const bookings = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.timestamp) data.timestamp = data.timestamp.toDate();
    bookings.push({id: doc.id, ...data});
  });
  console.log(JSON.stringify(bookings, null, 2));
}
run();
