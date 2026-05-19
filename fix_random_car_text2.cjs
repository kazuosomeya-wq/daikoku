const fs = require('fs');
let content = fs.readFileSync('src/components/OptionsSelector.jsx', 'utf8');

content = content.replace(/RX-7, Supraなどから選ぶ/g, 'R34,Supra,R35,Silvia,RX7,R33,R32などの中から選びます');

fs.writeFileSync('src/components/OptionsSelector.jsx', content);
