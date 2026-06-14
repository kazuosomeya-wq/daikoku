const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/OptionsSelector.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace for random-r34 and random-cars overlays
const regexOverlayRandom = /\{disabledVehicles\.includes\('([^']+)'\) && \([\s\S]*?<div style=\{\{[\s\S]*?\}\}>Unavailable<\/div>\s*\)\}/g;
content = content.replace(regexOverlayRandom, `{(disabledVehicles.includes('$1') || isLoading) && (
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 'bold', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px', transform: isLoading ? 'none' : 'rotate(-15deg)', textShadow: '0 2px 4px rgba(0,0,0,0.8)', zIndex: 10 }}>
                                    {isLoading ? <div className="loading-spinner"></div> : "Unavailable"}
                                </div>
                            )}`);

// Replace for mapped vehicles overlays (isUnavailable)
const regexOverlayMapped = /\{isUnavailable && \([\s\S]*?<div style=\{\{[\s\S]*?\}\}>\s*Unavailable\s*<\/div>\s*\)\}/g;
content = content.replace(regexOverlayMapped, `{(isUnavailable || isLoading) && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: 0, left: 0, right: 0, bottom: 0,
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    color: 'white',
                                                    fontWeight: 'bold',
                                                    fontSize: '1rem',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '1px',
                                                    transform: isLoading ? 'none' : 'rotate(-15deg)',
                                                    textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                                                    zIndex: 10
                                                }}>
                                                    {isLoading ? <div className="loading-spinner"></div> : "Unavailable"}
                                                </div>
                                            )}`);

// Replace styles for random-r34
content = content.replace(/cursor: disabledVehicles\.includes\('random-r34'\) \? 'not-allowed' : 'pointer'/g, "cursor: (disabledVehicles.includes('random-r34') || isLoading) ? 'not-allowed' : 'pointer'");
content = content.replace(/opacity: disabledVehicles\.includes\('random-r34'\) \? 0\.6 : 1/g, "opacity: (disabledVehicles.includes('random-r34') || isLoading) ? 0.6 : 1");
content = content.replace(/filter: disabledVehicles\.includes\('random-r34'\) \? 'brightness\(0\.5\)' : 'none'/g, "filter: (disabledVehicles.includes('random-r34') || isLoading) ? 'brightness(0.5)' : 'none'");
// Replace onClick for random-r34
content = content.replace(/onClick=\{\(\) => !disabledVehicles\.includes\('random-r34'\)/g, "onClick={() => !(disabledVehicles.includes('random-r34') || isLoading)");

// Replace styles for random-cars
content = content.replace(/cursor: disabledVehicles\.includes\('random-cars'\) \? 'not-allowed' : 'pointer'/g, "cursor: (disabledVehicles.includes('random-cars') || isLoading) ? 'not-allowed' : 'pointer'");
content = content.replace(/opacity: disabledVehicles\.includes\('random-cars'\) \? 0\.6 : 1/g, "opacity: (disabledVehicles.includes('random-cars') || isLoading) ? 0.6 : 1");
content = content.replace(/filter: disabledVehicles\.includes\('random-cars'\) \? 'brightness\(0\.5\)' : 'none'/g, "filter: (disabledVehicles.includes('random-cars') || isLoading) ? 'brightness(0.5)' : 'none'");
// Replace onClick for random-cars
content = content.replace(/onClick=\{\(\) => !disabledVehicles\.includes\('random-cars'\)/g, "onClick={() => !(disabledVehicles.includes('random-cars') || isLoading)");

// Replace styles for isUnavailable
content = content.replace(/cursor: isUnavailable \? 'not-allowed' : 'pointer'/g, "cursor: (isUnavailable || isLoading) ? 'not-allowed' : 'pointer'");
content = content.replace(/opacity: isUnavailable \? 0\.6 : 1/g, "opacity: (isUnavailable || isLoading) ? 0.6 : 1");
content = content.replace(/filter: isUnavailable \? 'brightness\(0\.5\)' : 'none'/g, "filter: (isUnavailable || isLoading) ? 'brightness(0.5)' : 'none'");
// Replace onClick for mapped vehicles
content = content.replace(/onClick=\{\(\) => !isUnavailable/g, "onClick={() => !(isUnavailable || isLoading)");

fs.writeFileSync(filePath, content, 'utf8');
console.log("Replaced");
