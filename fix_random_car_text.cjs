const fs = require('fs');
let content = fs.readFileSync('src/components/OptionsSelector.jsx', 'utf8');

content = content.replace(/Assigned from RX-7, Supra, etc./g, 'RX-7, Supraなどから選ぶ');

fs.writeFileSync('src/components/OptionsSelector.jsx', content);
