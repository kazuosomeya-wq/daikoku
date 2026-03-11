import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const ImportBookings = () => {
    const [csvData, setCsvData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            parseCSV(text);
        };
        reader.readAsText(file);
    };

    const parseCSV = (text) => {
        // Simple CSV parser
        const lines = text.split('\n');
        const headers = lines[0].split(',');
        const parsed = [];

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            // Handle quotes in CSV values naively
            let values = [];
            let inQuotes = false;
            let val = '';
            for (let char of lines[i]) {
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    values.push(val);
                    val = '';
                } else {
                    val += char;
                }
            }
            values.push(val);

            // headers: chat_partner,possible_date,possible_pax,conversation_snippet
            if (values.length >= 4) {
                parsed.push({
                    chat_partner: values[0].replace(/^"|"$/g, '').trim(),
                    possible_date: values[1].replace(/^"|"$/g, '').trim(),
                    possible_pax: values[2].replace(/^"|"$/g, '').trim(),
                    conversation_snippet: values[3].replace(/^"|"$/g, '').trim()
                });
            }
        }
        setCsvData(parsed);
        setStatus(`Loaded ${parsed.length} rows. Please review before importing.`);
    };

    const handleImport = async () => {
        if (csvData.length === 0) return;
        
        if (!window.confirm(`Are you sure you want to import ${csvData.length} bookings into the database?`)) {
            return;
        }

        setLoading(true);
        setStatus('Importing...');
        let importedCount = 0;
        let errorCount = 0;

        for (const row of csvData) {
            try {
                // Determine pax (default to 2)
                let guests = 2;
                const paxMatch = row.possible_pax.match(/\d+/);
                if (paxMatch && !isNaN(parseInt(paxMatch[0]))) {
                    guests = parseInt(paxMatch[0]);
                }

                // Determine Date (default to today if we can't parse easily)
                let bookingDate = new Date(); // To be manually updated later in admin
                // Note: accurate date parsing from string like "April 10th" is hard without year.
                // We will leave date as a string representing today, but leave admin note.

                const bookingDoc = {
                    date: bookingDate.toDateString(),
                    tourType: 'Daikoku Tour',
                    name: row.chat_partner || 'Instagram User',
                    guests: guests,
                    email: `offline_${Date.now()}@instagram.local`,
                    instagram: row.chat_partner,
                    adminNote: `INSTA DM IMPORT. Target Date: ${row.possible_date}. Snippet: ${row.conversation_snippet.substring(0, 100)}...`,
                    options: {
                        selectedVehicle: 'none', // generic random R34
                        tokyoTower: false,
                        shibuya: false
                    },
                    totalToken: 0,
                    deposit: 0,
                    status: 'succeeded',
                    timestamp: serverTimestamp(),
                    isOffline: true
                };

                await addDoc(collection(db, "bookings"), bookingDoc);
                importedCount++;
            } catch (err) {
                console.error("Error importing row: ", row, err);
                errorCount++;
            }
        }

        setLoading(false);
        setStatus(`Import complete. Successfully imported: ${importedCount}. Errors: ${errorCount}. You can see them on the Master Schedule.`);
        setCsvData([]); // Clear data
    };

    return (
        <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <h2>Import Instagram Bookings</h2>
            <div style={{ marginBottom: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
                <p>1. 抽出されたCSVファイル（<strong>bookings_extracted.csv</strong>）を開き、本物の予約だけを残して保存してください。<br/>
                2. 修正済みのCSVファイルをここでアップロードし、「Firebaseへインポート」をクリックします。</p>
                
                <input 
                    type="file" 
                    accept=".csv" 
                    onChange={handleFileUpload} 
                    style={{ marginTop: '10px' }}
                />
            </div>

            {status && (
                <div style={{ marginBottom: '20px', padding: '10px', background: '#e0f2fe', color: '#0369a1', borderRadius: '4px' }}>
                    {status}
                </div>
            )}

            {csvData.length > 0 && (
                <div>
                    <button 
                        onClick={handleImport}
                        disabled={loading}
                        style={{ padding: '10px 20px', background: '#059669', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '20px' }}
                    >
                        {loading ? 'インポート中...' : `Firebaseへインポート開始 (${csvData.length}件)`}
                    </button>

                    <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px', overflowX: 'auto' }}>
                        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #ddd' }}>
                                    <th style={{ padding: '8px' }}>Name (IG)</th>
                                    <th style={{ padding: '8px' }}>Date Info</th>
                                    <th style={{ padding: '8px' }}>Pax Info</th>
                                    <th style={{ padding: '8px' }}>Snippet Limit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {csvData.slice(0, 10).map((row, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #ddd' }}>
                                        <td style={{ padding: '8px' }}>{row.chat_partner}</td>
                                        <td style={{ padding: '8px' }}>{row.possible_date}</td>
                                        <td style={{ padding: '8px' }}>{row.possible_pax}</td>
                                        <td style={{ padding: '8px', fontSize: '0.8rem', color: '#666' }}>
                                            {row.conversation_snippet.substring(0, 50)}...
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {csvData.length > 10 && <p style={{ textAlign: 'center', marginTop: '10px', color: '#666' }}>... and {csvData.length - 10} more rows</p>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImportBookings;
