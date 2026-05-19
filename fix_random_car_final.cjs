const fs = require('fs');
let content = fs.readFileSync('src/components/OptionsSelector.jsx', 'utf8');

// 1. Remove "(Any JDM)"
content = content.replace(/Random Car \(Any JDM\)/g, 'Random Car');

// 2. Add back the question mark overlay to Random Car
// The current img tag is: <img src={randomCarImg} alt="Random Car" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
// We replace it with the img tag + the overlay div.
const overlayDiv = `<img src={randomCarImg} alt="Random Car" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white', fontSize: '4rem', fontWeight: 'bold', textShadow: '0 4px 12px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.6)', pointerEvents: 'none', zIndex: 5 }}>?</div>`;

content = content.replace(/<img src=\{randomCarImg\} alt="Random Car" style=\{\{ width: '100%', height: '100%', objectFit: 'cover' \}\} \/>/g, overlayDiv);

fs.writeFileSync('src/components/OptionsSelector.jsx', content);

// 3. Fix Home.jsx as well
let homeContent = fs.readFileSync('src/pages/Home.jsx', 'utf8');
homeContent = homeContent.replace(/Random Car \(Any JDM\)/g, 'Random Car');
fs.writeFileSync('src/pages/Home.jsx', homeContent);

