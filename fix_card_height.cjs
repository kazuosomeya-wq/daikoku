const fs = require('fs');
let content = fs.readFileSync('src/components/OptionsSelector.jsx', 'utf8');

// The style object for all vehicle cards (both random and specific) needs `height: '100%'` and `justifyContent: 'space-between'`
// Wait, currently they have `display: 'flex', flexDirection: 'column', alignItems: 'center'`.
// If we add `height: '100%', justifyContent: 'space-between'`, the inner contents will be spaced out evenly,
// and the cards in the same grid row will stretch to the same height.

// We can replace `alignItems: 'center',` with `alignItems: 'center', height: '100%', justifyContent: 'space-between',`
content = content.replace(/alignItems: 'center',(\s*)transition: 'all 0.2s',/g, "alignItems: 'center', height: '100%', justifyContent: 'space-between',$1transition: 'all 0.2s',");

fs.writeFileSync('src/components/OptionsSelector.jsx', content);
