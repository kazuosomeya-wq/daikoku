const admin = require('./functions/node_modules/firebase-admin');
admin.initializeApp({
  projectId: "daikoku-tour-booking"
});
const db = admin.firestore();

async function check() {
  const snapshot = await db.collection('bookings').where('email', '==', 'klaudia.lalewicz@interia.pl').get();
  if (snapshot.empty) {
    console.log('No matching documents.');
    return;
  }
  snapshot.forEach(doc => {
    console.log(doc.id, '=>', doc.data());
  });
}
check().catch(console.error);
