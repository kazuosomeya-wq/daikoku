import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ja } from 'date-fns/locale/ja';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './CalendarView.css';

const locales = {
  'ja': ja
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const CalendarView = () => {
    const [events, setEvents] = useState([]);
    const [rawBookings, setRawBookings] = useState([]);
    const [vehicles, setVehicles] = useState({});

    // Fetch vehicles to resolve names
    useEffect(() => {
        const unsubVehicles = onSnapshot(collection(db, "vehicles"), (snapshot) => {
            const vMap = {};
            snapshot.forEach(doc => {
                vMap[doc.id] = doc.data().name;
            });
            vMap['random-r34'] = 'Random R34';
            vMap['random-cars'] = 'Random Car';
            setVehicles(vMap);
        });
        return () => unsubVehicles();
    }, []);

    // Fetch bookings
    useEffect(() => {
        const q = query(collection(db, "bookings"));
        const unsub = onSnapshot(q, (snapshot) => {
            const bList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setRawBookings(bList);
            
            const calEvents = [];
            bList.forEach(b => {
                const DRIVER_NICKNAMES = {
                    'random-cars': 'ランダム',
                    'random-r34': 'ゆうや',
                    'vehicle1': 'かえ',
                    'vehicle2': 'たつや',
                    'vehicle3': 'そら',
                    'vehicle4': 'あやみ',
                };

                const actualVehicleId = b.options?.selectedVehicle || b.vehicleId;
                let driverName = DRIVER_NICKNAMES[actualVehicleId];
                if (!driverName) {
                    driverName = b.vehicleName1 || b.vehicleName || '未設定';
                }

                let startHours = 1, startMinutes = 0;
                let endHours = 2, endMinutes = 0;
                let tourPrefix = '';

                if (b.tourType?.includes('Daikoku') || b.tourType?.includes('Standard')) {
                    startHours = 1; endHours = 2;
                    tourPrefix = '①';
                } else if (b.tourType?.includes('Midnight') || b.tourType?.includes('umihotaru')) {
                    if (b.tourType.includes('11:30') || b.options?.midnightTimeSlot === '11:30 PM') {
                        startHours = 3; endHours = 4;
                        tourPrefix = '③';
                    } else {
                        startHours = 2; endHours = 3;
                        tourPrefix = '②';
                    }
                } else if (b.tourType?.includes('Sunday')) {
                    startHours = 0; endHours = 1;
                    tourPrefix = '☀️';
                }

                const defaultTitle = `${tourPrefix}${driverName}`;
                const title = b.customTitle || defaultTitle;

                // 1. 元々の予定（変更前）がある場合、グレーアウト用の予定を追加
                if (b.isRescheduled && b.originalDate) {
                    const origDate = new Date(b.originalDate);
                    const origStart = new Date(origDate);
                    origStart.setHours(startHours, startMinutes, 0);
                    const origEnd = new Date(origDate);
                    origEnd.setHours(endHours, endMinutes, 0);

                    calEvents.push({
                        id: `${b.id}-orig`,
                        title: `(Moved) ${title}`,
                        start: origStart,
                        end: origEnd,
                        allDay: false,
                        resource: {
                            ...b,
                            isOriginalRescheduledEvent: true
                        }
                    });
                }

                // 2. 現在の予定（変更後、または通常予定）を追加
                const bDate = b.date ? new Date(b.date) : new Date();
                const start = new Date(bDate);
                start.setHours(startHours, startMinutes, 0);
                const end = new Date(bDate);
                end.setHours(endHours, endMinutes, 0);

                calEvents.push({
                    id: b.id,
                    title: title,
                    start,
                    end,
                    allDay: false,
                    resource: {
                        ...b,
                        isNewRescheduledEvent: b.isRescheduled
                    }
                });
            });
            
            setEvents(calEvents);
        });
        return () => unsub();
    }, []);

    const handleExportCSV = () => {
        // ヘッダーをスプレッドシートのA列〜Y列に完全に一致させる
        const headers = [
            "マージン確認", // A列 (最初の一行目/一列目)
            "キャンセル", // B列
            "顧客名", // C列
            "プラン", // D列
            "人数", // E列
            "オプション", // F列
            "車両指名", // G列
            "受取日", // H列 (デポジット)
            "PF", // I列 (デポジット)
            "金額", // J列 (デポジット)
            "受取日", // K列 (残金)
            "PF", // L列 (残金)
            "金額", // M列 (残金)
            "売上合計", // N列
            "名前", // O列 (ドライバー1)
            "報酬", // P列 (ドライバー1)
            "名前", // Q列 (ドライバー2)
            "報酬", // R列 (ドライバー2)
            "名前", // S列 (ドライバー3)
            "報酬", // T列 (ドライバー3)
            "ドライバー代計", // U列
            "粗利", // V列
            "連絡先", // W列
            "備考欄", // X列
            "ホテル" // Y列
        ];

        const sorted = [...rawBookings].sort((a, b) => new Date(a.date) - new Date(b.date));
        const csvRows = [headers.join(",")];

        sorted.forEach((b) => {
            const marginCheck = ""; // A列: 手動でチェックを入れるため空欄
            const cancel = b.status === "Cancelled" ? "異常なし（キャンセル）" : "異常なし"; // B列: キャンセル等
            const name = `"${b.name || ''}"`; // C列
            const plan = `"${b.tourType || ''}"`; // D列
            const pax = b.guests || 1; // E列
            
            const opts = [];
            if (b.options?.tokyoTower) opts.push("Tokyo Tower");
            if (b.options?.shibuya) opts.push("Shibuya");
            const optStr = `"${opts.join(", ")}"`; // F列

            const vName = `"${b.vehicleName1 || b.vehicleName || ''}"`; // G列

            const depDate = `"${b.createdAt ? new Date(b.createdAt.seconds * 1000).toLocaleDateString() : ''}"`; // H列
            const depPf = "Stripe"; // I列
            const depAmount = b.deposit || 0; // J列

            const remDate = ""; // K列: 現金手渡しのため空欄
            const remPf = "現金"; // L列
            const total = b.totalToken || b.totalAmount || 0; // N列
            const remAmount = total - depAmount; // M列

            // ドライバー関連 (O〜V列)
            const driver1Name = ""; // O列
            const driver1Pay = 0; // P列
            const driver2Name = ""; // Q列
            const driver2Pay = 0; // R列
            const driver3Name = ""; // S列
            const driver3Pay = 0; // T列
            const driverTotal = driver1Pay + driver2Pay + driver3Pay; // U列
            const grossProfit = total - driverTotal; // V列

            // W列: 連絡先
            const email = b.email ? `Email: ${b.email}` : '';
            const phone = b.whatsapp ? `Phone: ${b.whatsapp}` : 'Phone: 無';
            const ig = b.instagram ? `IG: ${b.instagram}` : 'IG: 無';
            const contact = `"${email} | ${phone} | ${ig}"`;

            const remarks = `"${b.remarks || ''}"`; // X列
            const hotel = `"${b.hotel || ''}"`; // Y列

            const row = [
                marginCheck, cancel, name, plan, pax, optStr, vName,
                depDate, depPf, depAmount,
                remDate, remPf, remAmount, total,
                driver1Name, driver1Pay, driver2Name, driver2Pay, driver3Name, driver3Pay,
                driverTotal, grossProfit,
                contact, remarks, hotel
            ];
            csvRows.push(row.join(","));
        });

        const csvContent = "\uFEFF" + csvRows.join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Daikoku_Bookings_${format(new Date(), 'yyyyMMdd')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({});

    const handleSelectEvent = (event) => {
        setSelectedEvent(event.resource);
        setEditData({
            date: event.resource.date || '',
            customTitle: event.resource.customTitle || '',
            name: event.resource.name || '',
            tourType: event.resource.tourType || '',
            guests: event.resource.guests || 1,
            vehicleName1: event.resource.vehicleName1 || event.resource.vehicleName || '',
            hotel: event.resource.hotel || '',
            totalToken: event.resource.totalToken || event.resource.totalAmount || 0,
            deposit: event.resource.deposit || 0,
            instagram: event.resource.instagram || '',
            whatsapp: event.resource.whatsapp || '',
            email: event.resource.email || '',
            remarks: event.resource.remarks || '',
        });
        setIsEditing(false);
    };

    const closeModal = () => {
        setSelectedEvent(null);
        setIsEditing(false);
    };

    const handleInputChange = (field, val) => {
        setEditData(prev => ({
            ...prev,
            [field]: val
        }));
    };

    const handleSave = async () => {
        try {
            const bookingDocRef = doc(db, "bookings", selectedEvent.id);

            // 日付変更の特別処理
            let rescheduledFields = {};
            if (editData.date !== selectedEvent.date) {
                // 初めての日付変更の場合は元のdateをoriginalDateとして保存
                if (!selectedEvent.originalDate) {
                    rescheduledFields = {
                        isRescheduled: true,
                        originalDate: selectedEvent.date
                    };
                } else {
                    rescheduledFields = {
                        isRescheduled: true
                    };
                }
            }

            // 変更履歴の比較ロジック
            const changes = [];
            const fieldsToCompare = [
                { key: 'date', label: 'Tour Date' },
                { key: 'customTitle', label: 'Title' },
                { key: 'name', label: 'Customer Name' },
                { key: 'tourType', label: 'Plan' },
                { key: 'guests', label: 'Guests', type: 'number' },
                { key: 'vehicleName1', label: 'Vehicle / Driver' },
                { key: 'hotel', label: 'Hotel' },
                { key: 'totalToken', label: 'Total Amount', type: 'number' },
                { key: 'deposit', label: 'Deposit Paid', type: 'number' },
                { key: 'instagram', label: 'Instagram' },
                { key: 'whatsapp', label: 'WhatsApp' },
                { key: 'email', label: 'Email' },
                { key: 'remarks', label: 'Memo' }
            ];

            fieldsToCompare.forEach(f => {
                let oldVal = selectedEvent[f.key];
                let newVal = editData[f.key];
                
                if (f.type === 'number') {
                    oldVal = Number(oldVal || 0);
                    newVal = Number(newVal || 0);
                } else {
                    oldVal = (oldVal || '').toString().trim();
                    newVal = (newVal || '').toString().trim();
                }

                if (oldVal !== newVal) {
                    changes.push({
                        field: f.key,
                        label: f.label,
                        old: oldVal,
                        new: newVal
                    });
                }
            });

            let historyUpdate = {};
            const timestamp = new Date().toISOString();
            if (changes.length > 0) {
                const historyEntry = {
                    timestamp: timestamp,
                    changes: changes
                };
                historyUpdate = {
                    changeHistory: arrayUnion(historyEntry)
                };
            }

            const updateFields = {
                date: editData.date,
                customTitle: editData.customTitle,
                name: editData.name,
                tourType: editData.tourType,
                guests: Number(editData.guests),
                vehicleName1: editData.vehicleName1,
                hotel: editData.hotel,
                totalToken: Number(editData.totalToken),
                deposit: Number(editData.deposit),
                instagram: editData.instagram,
                whatsapp: editData.whatsapp,
                email: editData.email,
                remarks: editData.remarks,
                ...rescheduledFields,
                ...historyUpdate
            };
            
            await updateDoc(bookingDocRef, updateFields);
            
            setSelectedEvent(prev => {
                const updatedHistory = [...(prev.changeHistory || [])];
                if (changes.length > 0) {
                    updatedHistory.push({
                        timestamp: timestamp,
                        changes: changes
                    });
                }
                return {
                    ...prev,
                    ...updateFields,
                    changeHistory: updatedHistory
                };
            });
            setIsEditing(false);
            alert("Successfully saved!");
        } catch (error) {
            console.error("Error updating booking:", error);
            alert("Failed to save: " + error.message);
        }
    };

    const eventStyleGetter = (event) => {
        let backgroundColor = '#E60012'; // 通常は赤
        let opacity = 1;
        let border = 'none';

        if (event.resource.isOriginalRescheduledEvent) {
            backgroundColor = '#757575'; // 変更前（元々）はグレー
            opacity = 0.5;
        } else if (event.resource.isNewRescheduledEvent) {
            backgroundColor = '#0066cc'; // 変更後は青（違う色）
        }

        return {
            style: {
                backgroundColor,
                opacity,
                color: 'white',
                borderRadius: '4px',
                border,
                display: 'block'
            }
        };
    };

    return (
        <div className="calendar-dashboard">
            <header className="calendar-header">
                <h2>Booking Calendar & Ledger</h2>
                <button className="export-btn" onClick={handleExportCSV}>
                    Download Spreadsheet (CSV)
                </button>
            </header>
            
            <div className="calendar-container">
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '80vh' }}
                    views={['month', 'week', 'day']}
                    defaultView='month'
                    popup={true}
                    onSelectEvent={handleSelectEvent}
                    tooltipAccessor={e => `${e.resource.name} - ${e.resource.tourType} - ${e.resource.hotel}`}
                    eventPropGetter={eventStyleGetter}
                />
            </div>

            {selectedEvent && (
                <div className="calendar-modal-overlay" onClick={closeModal}>
                    <div className="calendar-modal-content" onClick={e => e.stopPropagation()}>
                        <button className="calendar-modal-close" onClick={closeModal}>×</button>
                        <h3>Booking Details</h3>
                        
                        {isEditing ? (
                            <div className="modal-body edit-mode">
                                <div className="form-group">
                                    <label style={{ color: '#E60012', fontWeight: 'bold' }}>Memo (最優先の備考・メモ)</label>
                                    <textarea value={editData.remarks} onChange={e => handleInputChange('remarks', e.target.value)} rows={3} placeholder="例: 12時プラン希望、マージン渡し済みなど" />
                                </div>
                                <hr />
                                <div className="form-group">
                                    <label>Tour Date</label>
                                    <input type="date" value={editData.date} onChange={e => handleInputChange('date', e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>題名 / Title (空欄の場合は自動で「①かえ」等の表示になります)</label>
                                    <input type="text" placeholder="例: ①かえ" value={editData.customTitle} onChange={e => handleInputChange('customTitle', e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Customer Name</label>
                                    <input type="text" value={editData.name} onChange={e => handleInputChange('name', e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Plan</label>
                                    <input type="text" value={editData.tourType} onChange={e => handleInputChange('tourType', e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Guests</label>
                                    <input type="number" value={editData.guests} onChange={e => handleInputChange('guests', e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Vehicle / Driver Name</label>
                                    <input type="text" value={editData.vehicleName1} onChange={e => handleInputChange('vehicleName1', e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Hotel</label>
                                    <input type="text" value={editData.hotel} onChange={e => handleInputChange('hotel', e.target.value)} />
                                </div>
                                <hr />
                                <div className="form-group">
                                    <label>Total Amount (¥)</label>
                                    <input type="number" value={editData.totalToken} onChange={e => handleInputChange('totalToken', e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Deposit Paid (¥)</label>
                                    <input type="number" value={editData.deposit} onChange={e => handleInputChange('deposit', e.target.value)} />
                                </div>
                                <hr />
                                <div className="form-group">
                                    <label>Instagram</label>
                                    <input type="text" value={editData.instagram} onChange={e => handleInputChange('instagram', e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>WhatsApp</label>
                                    <input type="text" value={editData.whatsapp} onChange={e => handleInputChange('whatsapp', e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Email</label>
                                    <input type="email" value={editData.email} onChange={e => handleInputChange('email', e.target.value)} />
                                </div>
                                
                                <div className="modal-actions">
                                    <button className="save-btn" onClick={handleSave}>Save Changes</button>
                                    <button className="cancel-btn" onClick={() => setIsEditing(false)}>Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <div className="modal-body">
                                {selectedEvent.remarks && (
                                    <div style={{ background: '#fff9c4', padding: '10px', borderRadius: '4px', marginBottom: '15px', borderLeft: '4px solid #fbc02d' }}>
                                        <strong>Memo:</strong> <span style={{ whiteSpace: 'pre-wrap' }}>{selectedEvent.remarks}</span>
                                    </div>
                                )}
                                <p><strong>Tour Date:</strong> {selectedEvent.date}</p>
                                <p><strong>題名 (Title):</strong> {selectedEvent.customTitle || '自動生成（デフォルト）'}</p>
                                <p><strong>Customer:</strong> {selectedEvent.name}</p>
                                <p><strong>Plan:</strong> {selectedEvent.tourType}</p>
                                <p><strong>Guests:</strong> {selectedEvent.guests || 1}</p>
                                <p><strong>Vehicle:</strong> {selectedEvent.vehicleName1 || selectedEvent.vehicleName}</p>
                                <p><strong>Hotel:</strong> {selectedEvent.hotel}</p>
                                <hr />
                                <p><strong>Total Amount:</strong> ¥{(selectedEvent.totalToken || selectedEvent.totalAmount || 0).toLocaleString()}</p>
                                <p><strong>Deposit (Paid):</strong> ¥{(selectedEvent.deposit || 0).toLocaleString()}</p>
                                <p style={{ color: 'red', fontWeight: 'bold' }}><strong>Remaining (Cash):</strong> ¥{((selectedEvent.totalToken || selectedEvent.totalAmount || 0) - (selectedEvent.deposit || 0)).toLocaleString()}</p>
                                <hr />
                                <p><strong>Instagram:</strong> {selectedEvent.instagram || 'N/A'}</p>
                                <p><strong>WhatsApp:</strong> {selectedEvent.whatsapp || 'N/A'}</p>
                                <p><strong>Email:</strong> {selectedEvent.email}</p>
                                
                                {selectedEvent.changeHistory && selectedEvent.changeHistory.length > 0 && (
                                    <>
                                        <hr />
                                        <h4 style={{ margin: '15px 0 10px 0', fontSize: '1rem', color: '#333' }}>Change History</h4>
                                        <div className="change-history-timeline">
                                            {selectedEvent.changeHistory.slice().reverse().map((h, idx) => (
                                                <div key={idx} className="timeline-item">
                                                    <div className="timeline-time">
                                                        {format(new Date(h.timestamp), 'yyyy/MM/dd HH:mm')}
                                                    </div>
                                                    <ul className="timeline-changes">
                                                        {h.changes.map((c, cIdx) => (
                                                            <li key={cIdx}>
                                                                <strong>{c.label}:</strong> {c.old || '(empty)'} → {c.new || '(empty)'}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}

                                <div className="modal-actions">
                                    <button className="edit-btn" onClick={() => setIsEditing(true)}>Edit Details</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarView;
