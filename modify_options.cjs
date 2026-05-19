const fs = require('fs');

let content = fs.readFileSync('src/components/OptionsSelector.jsx', 'utf8');

// 1. Add import
content = content.replace("import randomR34 from '../assets/random_r34.webp';", "import randomR34 from '../assets/random_r34.webp';\nimport randomCarImg from '../assets/random_car.jpg';");

// 2. Replace the randomSlot constants
content = content.replace(
`    // Always use 'random-cars' for the random car selection, regardless of late booking
    const randomSlotId = 'random-cars';
    const randomSlotTitle = 'Random Car (Any JDM)';
    const randomSlotSubtitle = 'A random JDM car will be assigned on the day';`,
`    const randomR34Id = 'random-r34';
    const randomCarsId = 'random-cars';`
);

// 3. Helper to generate the two random slots for a given car slot
const createRandomSlots = (propName, borderColor, bgColor) => `
                    {/* Random R34 Nomination */}
                    <div
                        onClick={() => !disabledVehicles.includes('random-r34') && handleTextChange('${propName}', randomR34Id)}
                        style={{
                            border: options.${propName} === randomR34Id ? '2px solid ${borderColor}' : '1px solid #444',
                            background: options.${propName} === randomR34Id ? '${bgColor}' : '#222',
                            padding: '0.5rem',
                            borderRadius: '8px',
                            cursor: disabledVehicles.includes('random-r34') ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            transition: 'all 0.2s',
                            position: 'relative',
                            opacity: disabledVehicles.includes('random-r34') ? 0.6 : 1,
                            filter: disabledVehicles.includes('random-r34') ? 'brightness(0.5)' : 'none',
                        }}
                    >
                        <div style={{
                            width: '100%', aspectRatio: '16/9', background: '#333', borderRadius: '4px', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', position: 'relative'
                        }}>
                            <img src={randomR34} alt="Random R34" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white', fontSize: '4rem', fontWeight: 'bold', textShadow: '0 4px 12px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.6)', pointerEvents: 'none', zIndex: 5 }}>?</div>
                            {disabledVehicles.includes('random-r34') && (
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 'bold', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px', transform: 'rotate(-15deg)', textShadow: '0 2px 4px rgba(0,0,0,0.8)', zIndex: 10 }}>Unavailable</div>
                            )}
                        </div>
                        <span style={{ fontWeight: 'bold', color: 'white' }}>Random R34</span>
                        <span style={{ fontSize: '0.8rem', color: '#ccc', marginBottom: '0.2rem', textAlign: 'center' }}>A Skyline R34 will be assigned</span>
                        <span style={{ fontSize: '0.9rem', color: '#E60012', fontWeight: 'bold' }}>+¥2,000</span>
                    </div>

                    {/* Random Car (Any JDM) Nomination */}
                    <div
                        onClick={() => !disabledVehicles.includes('random-r34') && handleTextChange('${propName}', randomCarsId)}
                        style={{
                            border: options.${propName} === randomCarsId ? '2px solid ${borderColor}' : '1px solid #444',
                            background: options.${propName} === randomCarsId ? '${bgColor}' : '#222',
                            padding: '0.5rem',
                            borderRadius: '8px',
                            cursor: disabledVehicles.includes('random-r34') ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            transition: 'all 0.2s',
                            position: 'relative',
                            opacity: disabledVehicles.includes('random-r34') ? 0.6 : 1,
                            filter: disabledVehicles.includes('random-r34') ? 'brightness(0.5)' : 'none',
                        }}
                    >
                        <div style={{
                            width: '100%', aspectRatio: '16/9', background: '#333', borderRadius: '4px', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', position: 'relative'
                        }}>
                            <img src={randomCarImg} alt="Random Car" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white', fontSize: '4rem', fontWeight: 'bold', textShadow: '0 4px 12px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.6)', pointerEvents: 'none', zIndex: 5 }}>?</div>
                            {disabledVehicles.includes('random-r34') && (
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 'bold', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px', transform: 'rotate(-15deg)', textShadow: '0 2px 4px rgba(0,0,0,0.8)', zIndex: 10 }}>Unavailable</div>
                            )}
                        </div>
                        <span style={{ fontWeight: 'bold', color: 'white' }}>Random Car (Any JDM)</span>
                        <span style={{ fontSize: '0.8rem', color: '#ccc', marginBottom: '0.2rem', textAlign: 'center' }}>A random JDM car will be assigned</span>
                        <span style={{ fontSize: '0.8rem', color: '#4ade80', fontWeight: 'bold' }}>¥0</span>
                    </div>
`;

// Replace Car 1
content = content.replace(/\{\/\* No Nomination \*\/\}.*?(?=\{\/\* Loading State \*\/\})/s, createRandomSlots('selectedVehicle', '#E60012', 'rgba(230, 0, 18, 0.1)'));

// Replace Car 2
content = content.replace(/\{\/\* No Nomination for Car 2 \*\/\}.*?(?=\{\/\* Specific Vehicles for Car 2 \*\/\})/s, createRandomSlots('selectedVehicle2', '#0066cc', 'rgba(0, 102, 204, 0.1)'));

// Replace Car 3
content = content.replace(/\{\/\* No Nomination for Car 3 \*\/\}.*?(?=\{\/\* Specific Vehicles for Car 3 \*\/\})/s, createRandomSlots('selectedVehicle3', '#009933', 'rgba(0, 153, 51, 0.1)'));

// Replace Car 4 (No explicit comment for Car 4 No Nomination, so we match based on structure)
content = content.replace(/<div[^>]*onClick=\{\(\) => !disabledVehicles\.includes\('random-r34'\) && handleTextChange\('selectedVehicle4', randomSlotId\)\}.*?(?=\{sortedVehicles\.map\(vehicle => \{)/s, createRandomSlots('selectedVehicle4', '#009933', 'rgba(0, 153, 51, 0.1)'));

// Replace Car 5
content = content.replace(/<div[^>]*onClick=\{\(\) => !disabledVehicles\.includes\('random-r34'\) && handleTextChange\('selectedVehicle5', randomSlotId\)\}.*?(?=\{sortedVehicles\.map\(vehicle => \{)/s, createRandomSlots('selectedVehicle5', '#009933', 'rgba(0, 153, 51, 0.1)'));

fs.writeFileSync('src/components/OptionsSelector.jsx', content);
