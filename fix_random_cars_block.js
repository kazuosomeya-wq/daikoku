import fs from 'fs';

let content = fs.readFileSync('src/components/OptionsSelector.jsx', 'utf8');

// We want to target the block starting from {/* Random Car Nomination */} down to the end of its div.
// Inside this block, we replace disabledVehicles.includes('random-r34') with disabledVehicles.includes('random-cars')
// Note: Some comments might be `Random Car Nomination`, `Random Car for Car 2 Nomination` etc.

// We can do this by splitting the file on `{/* Random Car`
const parts = content.split(/\{\/\* Random Car/);

for (let i = 1; i < parts.length; i++) {
    // Find the end of the div for this Random Car section.
    // Since it's nested, we'll just replace the string 'random-r34' with 'random-cars' 
    // up to the next `{/*` which signifies the next section (like Loading State or Specific Vehicles).
    let nextSectionIndex = parts[i].indexOf('{/*');
    if (nextSectionIndex === -1) {
        nextSectionIndex = parts[i].length;
    }
    
    let targetBlock = parts[i].substring(0, nextSectionIndex);
    let restOfPart = parts[i].substring(nextSectionIndex);
    
    targetBlock = targetBlock.replace(/disabledVehicles\.includes\('random-r34'\)/g, "disabledVehicles.includes('random-cars')");
    
    parts[i] = targetBlock + restOfPart;
}

content = parts.join('{/* Random Car');

fs.writeFileSync('src/components/OptionsSelector.jsx', content);
console.log("Replaced random-r34 with random-cars in Random Car blocks!");
