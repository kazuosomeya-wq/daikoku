import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const DebugVehicles = () => {
    const [vehicles, setVehicles] = useState([]);
    const [availability, setAvailability] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            // Vehicles
            const vSnap = await getDocs(collection(db, "vehicles"));
            const vData = vSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            setVehicles(vData);

            // Availability for each
            const avData = {};
            for (const v of vData) {
                const avSnap = await getDoc(doc(db, "vehicle_availability", v.id));
                if (avSnap.exists()) {
                    avData[v.id] = avSnap.data();
                }
            }
            setAvailability(avData);
        };
        fetchData();
    }, []);

    return (
        <div style={{ padding: '20px', background: '#333', color: '#fff', minHeight: '100vh' }}>
            <h1>Debug Vehicles</h1>

            {/* JSON Dump for Extraction */}
            <pre id="vehicle-json" style={{ background: '#000', padding: '10px', fontSize: '12px', overflow: 'auto' }}>
                {JSON.stringify(vehicles.map(v => ({
                    name: v.name,
                    subtitle: v.subtitle,
                    image: v.imageUrl,
                    price: v.price
                })), null, 2)}
            </pre>

            <table border="1" style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>isVisible (Raw)</th>
                        <th>DisplayOrder</th>
                        <th>Availability (Daikoku)</th>
                        <th>Availability (Umihotaru)</th>
                    </tr>
                </thead>
                <tbody>
                    {vehicles.map(v => (
                        <tr key={v.id}>
                            <td>{v.id}</td>
                            <td>{v.name}</td>
                            <td style={{ color: v.isVisible === false ? 'red' : 'lightgreen' }}>
                                {v.isVisible === undefined ? 'undefined' : String(v.isVisible)}
                            </td>
                            <td>{v.displayOrder}</td>
                            <td>
                                {availability[v.id]?.daikokuDates?.length || 0} blocked
                            </td>
                            <td>
                                {availability[v.id]?.umihotaruDates?.length || 0} blocked
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default DebugVehicles;
