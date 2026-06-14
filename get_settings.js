const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const https = require('https');

https.get('https://firestore.googleapis.com/v1/projects/daikoku-tour-booking/databases/(default)/documents/settings', (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    console.log(data);
  });
});
