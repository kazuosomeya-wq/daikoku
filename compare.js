const fs = require('fs');
let content = fs.readFileSync('src/components/OptionsSelector.jsx', 'utf8');

const randomR34Match = content.match(/\{\/\* Random R34 Nomination \*\/\}.*?<div([^>]+)>/s);
const specificMatch = content.match(/\{\/\* Specific Vehicles \*\/\}.*?return \(\s*<div([^>]+)>/s);

console.log("Random R34 div props:", randomR34Match[1]);
console.log("Specific Vehicle div props:", specificMatch[1]);
