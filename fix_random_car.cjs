const fs = require('fs');
let content = fs.readFileSync('src/components/OptionsSelector.jsx', 'utf8');

// 1. Remove the '?' overlay ONLY from the Random Car (Any JDM) divs.
// The Random Car div can be identified by: alt="Random Car" followed by the ? div.
const overlayRegex = /<img src=\{randomCarImg\} alt="Random Car"[^>]*>\s*<div style=\{\{ position: 'absolute', top: '50%', left: '50%', transform: 'translate\(-50%, -50%\)', color: 'white', fontSize: '4rem', fontWeight: 'bold', textShadow: '[^']+', pointerEvents: 'none', zIndex: 5 \}\}>\?<\/div>/g;

content = content.replace(overlayRegex, '<img src={randomCarImg} alt="Random Car" style={{ width: \'100%\', height: \'100%\', objectFit: \'cover\' }} />');

// 2. Change the subtitle from "A random JDM car will be assigned" to "Assigned from RX-7, Supra, etc."
// We also remove the "on the day" if it's there. My previous script output: "A random JDM car will be assigned"
content = content.replace(/A random JDM car will be assigned/g, 'Assigned from RX-7, Supra, etc.');

fs.writeFileSync('src/components/OptionsSelector.jsx', content);
