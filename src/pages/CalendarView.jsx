import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, doc, updateDoc, arrayUnion, setDoc, deleteDoc, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay, isSameDay } from 'date-fns';
import { ja } from 'date-fns/locale/ja';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import './CalendarView.css';
import { PLAN_META } from '../utils/planMeta';
import CustomEvent from '../components/calendar/CustomEvent';
import DayListSheet from '../components/calendar/DayListSheet';
import DriverSettingsModal from '../components/calendar/DriverSettingsModal';
import BookingDetailModal from '../components/calendar/BookingDetailModal';

const DnDCalendar = withDragAndDrop(Calendar);


import vehicle1 from '../assets/vehicle1.webp';
import vehicle2 from '../assets/vehicle2.webp';
import vehicle3 from '../assets/vehicle3.webp';
import vehicle4 from '../assets/vehicle4.webp';
import randomCar from '../assets/random_car.jpg';
import randomR34 from '../assets/random_r34.webp';

const locales = {
  'ja': ja
};


const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales,
});

const CalendarView = () => {
    const [rawBookings, setRawBookings] = useState([]);
    const [vehicles, setVehicles] = useState({});
    const [vehiclesList, setVehiclesList] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({});
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [filterDriver, setFilterDriver] = useState('');
    const [filterPlan, setFilterPlan] = useState('');
    const [calendarView, setCalendarView] = useState('month');

    useEffect(() => {
        const checkMobile = () => {
            if (window.innerWidth <= 768) {
                setCalendarView('agenda');
            } else {
                setCalendarView('month');
            }
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Fetch vehicles and nicknames
    useEffect(() => {
        const unsubVehicles = onSnapshot(collection(db, "vehicles"), (snapshot) => {
            const list = [];
            const vMap = {};
            snapshot.forEach(doc => {
                const data = doc.data();
                list.push({
                    id: doc.id,
                    name: data.name || '',
                    slug: data.slug || '',
                    driverNickname: data.driverNickname || '',
                    imageUrl: data.imageUrl || ''
                });
                vMap[doc.id] = data.name || '';
            });
            // 表示用に名前順でソート
            list.sort((a, b) => a.name.localeCompare(b.name));

            setVehiclesList(list);
            setVehicles(vMap);
        });
        return () => unsubVehicles();
    }, []);

    // Fetch bookings (only set rawBookings, events calculated via useMemo)
    useEffect(() => {
        const q = query(collection(db, "bookings"));
        const unsub = onSnapshot(q, (snapshot) => {
            const bList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setRawBookings(bList);
        });
        return () => unsub();
    }, []);

    const calculatedEvents = useMemo(() => {
        const calEvents = [];
        
        // データベースから取得した本物の車両IDとあだ名（driverNickname）のマッピング辞書を作成
        const nickMap = {};
        vehiclesList.forEach(v => {
            if (v.driverNickname && v.driverNickname.trim() !== '') {
                nickMap[v.id] = v.driverNickname.trim();
            }
        });
        
        rawBookings.forEach(b => {
            let startHours = 1, startMinutes = 0;
            let endHours = 2, endMinutes = 0;
            if (b.tourType?.includes('Daikoku') || b.tourType?.includes('Standard')) {
                startHours = 1; endHours = 2;
            } else if (b.tourType?.toLowerCase().includes('midnight') || b.tourType?.toLowerCase().includes('umihotaru')) {
                if (b.tourType.includes('11:30') || b.options?.midnightTimeSlot === '11:30 PM') {
                    startHours = 3; endHours = 4;
                } else {
                    startHours = 2; endHours = 3;
                }
            } else if (b.tourType?.includes('Sunday') || b.tourType?.includes('Morning')) {
                startHours = 5; endHours = 6;
            } else if (b.tourType?.includes('City')) {
                startHours = 3; endHours = 4;
            }

            const vehicles = [];
            const checkSlot = (name, id) => {
                const n = String(name || '').trim();
                const i = String(id || '').trim();
                
                const isInvalid = (str) => {
                    if (!str || str === '') return true;
                    if (str === '未設定' || str === 'undefined' || str === 'null' || str === '[]' || str === 'false' || str === 'none') return true;
                    return false;
                };

                // 名前もIDも無効な場合は追加しない
                if (isInvalid(n) && isInvalid(i)) return false;
                return true;
            };

            const slot1Name = b.vehicleName1 || b.vehicleName;
            const slot1Id = b.options?.selectedVehicle || b.vehicleId;
            if (checkSlot(slot1Name, slot1Id)) {
                 vehicles.push({
                     nameStr: b.vehicleName1,
                     idStr: slot1Id,
                     origName: b.vehicleName,
                     idx: 1
                 });
            }
            if (checkSlot(b.vehicleName2, b.options?.selectedVehicle2)) {
                 vehicles.push({
                     nameStr: b.vehicleName2,
                     idStr: b.options?.selectedVehicle2,
                     origName: null,
                     idx: 2
                 });
            }
            if (checkSlot(b.vehicleName3, b.options?.selectedVehicle3)) {
                 vehicles.push({
                     nameStr: b.vehicleName3,
                     idStr: b.options?.selectedVehicle3,
                     origName: null,
                     idx: 3
                 });
            }
            
            if (vehicles.length === 0) vehicles.push({ nameStr: '未設定', idx: 1 });

            const vehiclesData = [];
            const driverNames = [];

            vehicles.forEach(veh => {
                const actualVehicleId = veh.idStr;
                const dbNick = nickMap[actualVehicleId];
                
                let driverName = '';
                
                if (veh.nameStr && veh.nameStr.trim() !== '') {
                    const vNameStr = veh.nameStr.trim();
                    const vNameStrLower = vNameStr.toLowerCase();
                    
                    const isKnownNickname = vehiclesList.some(v => v.driverNickname && v.driverNickname.trim() !== '' && v.driverNickname.trim().toLowerCase() === vNameStrLower);
                    
                    const isDefaultShopifyName = !isKnownNickname && (
                        vNameStr.includes('(') || 
                        vNameStrLower.includes('random') || 
                        vehiclesList.some(v => v.name && v.name.trim().toLowerCase() === vNameStrLower)
                    );
                    
                    if (isDefaultShopifyName && dbNick) {
                        driverName = dbNick;
                    } else {
                        driverName = vNameStr;
                    }
                } else if (dbNick) {
                    driverName = dbNick;
                }
                
                if (!driverName) {
                    const rawVehicleName = veh.origName || '';
                    const normalized = rawVehicleName.toLowerCase().trim();
                    
                    if (normalized !== '') {
                        const matchedVehicle = vehiclesList.find(v => {
                            const vNameNorm = v.name.toLowerCase().trim();
                            return vNameNorm.length > 2 && (normalized.includes(vNameNorm) || vNameNorm.includes(normalized));
                        });
                        
                        if (matchedVehicle && matchedVehicle.driverNickname) {
                            driverName = matchedVehicle.driverNickname;
                        }
                    }
                }
                
                if (!driverName) {
                    driverName = veh.origName || '未設定';
                }

                driverNames.push(driverName);
                vehiclesData.push({
                    resolvedDriverName: driverName,
                    resolvedVid: actualVehicleId,
                    originalRequestStr: veh.origName || veh.nameStr,
                    vehicleSlotIdx: veh.idx
                });
            });

            // タイトルは全てのドライバー名を結合したものにする
            const combinedDriverNames = driverNames.join(' & ');
            let title = `${combinedDriverNames}`;
            if (b.customTitle && b.customTitle.trim() !== '') {
                title += ` - ${b.customTitle.trim()}`;
            }

            // 1. 元々の予定（変更前）がある場合、グレーアウト用の予定を追加
            if (b.isRescheduled && b.originalDate) {
                const origDate = new Date(b.originalDate);
                if (!isNaN(origDate.getTime())) {
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
                            isOriginalRescheduledEvent: true,
                            resolvedDriverName: combinedDriverNames,
                            generatedTitle: title,
                            vehiclesData: vehiclesData
                        }
                    });
                }
            }

            // 2. 現在の予定（変更後、または通常予定）を追加
            if (!b.date) return;
            const bDate = new Date(b.date);
            if (!isNaN(bDate.getTime())) {
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
                        isNewRescheduledEvent: b.isRescheduled,
                        resolvedDriverName: combinedDriverNames,
                        generatedTitle: title,
                        vehiclesData: vehiclesData
                    }
                });
            }
        });

        return calEvents;
    }, [rawBookings, vehiclesList]);

    // フィルタリング処理
    const filteredEvents = useMemo(() => {
        return calculatedEvents.filter(e => {
            if (filterDriver && !e.title.includes(filterDriver) && e.resource.resolvedDriverName !== filterDriver) return false;
            if (filterPlan && !e.resource.tourType?.includes(filterPlan)) return false;
            return true;
        });
    }, [calculatedEvents, filterDriver, filterPlan]);

    // Open settings modal
    const openSettingsModal = () => {
        setShowSettingsModal(true);
    };

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
            const cancel = b.status === "Canceled" ? "異常なし（キャンセル）" : "異常なし"; // B列: キャンセル等
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
            const driver1Name = b.vehicleName1 || b.vehicleName || ""; // O列
            const driver1Pay = b.driverFee || 0; // P列
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
        URL.revokeObjectURL(url);
    };


    // 登録されているドライバーあだ名の一覧を重複排除して取得（ドライバーポータルがある車両のみ）
    const availableNicknames = useMemo(() => {
        const nicks = new Set();
        vehiclesList.forEach(v => {
            if (v.slug && v.slug.trim() !== '' && v.driverNickname && v.driverNickname.trim() !== '') {
                nicks.add(v.driverNickname.trim());
            }
        });
        return Array.from(nicks).sort((a, b) => a.localeCompare(b, 'ja'));
    }, [vehiclesList]);

    const [selectedDate, setSelectedDate] = useState(null);
    const [showDayList, setShowDayList] = useState(false);

    const customComponents = useMemo(() => {
        return {
            event: CustomEvent,
            dateCellWrapper: ({ children, value }) => {
                if (!children || !React.isValidElement(children)) return children || null;
                return React.cloneElement(children, {
                    onClick: (e) => {
                        setSelectedDate(value);
                        setShowDayList(true);
                    }
                });
            }
        };
    }, []);

    const handleSelectEvent = (event) => {
        setSelectedEvent(event.resource);
        setIsEditing(true); // Phase 2: 詳細モーダルを開いた瞬間から編集モードにする
        
        // Convert legacy options object to string if optionsText is empty
        let initialOptionsText = event.resource.optionsText || '';
        if (!initialOptionsText && event.resource.options) {
            const legacyOpts = [];
            if (event.resource.options.tokyoTower) legacyOpts.push("Tokyo Tower");
            if (event.resource.options.shibuya) legacyOpts.push("Shibuya");
            if (legacyOpts.length > 0) initialOptionsText = legacyOpts.join(', ');
        }

        setEditData({
            date: event.resource.date || '',
            customTitle: event.resource.customTitle || '',
            name: event.resource.name || '',
            tourType: event.resource.tourType || '',
            guests: event.resource.guests || 1,
            basePrice: event.resource.basePrice || 0,
            optionsText: initialOptionsText,
            optionsPrice: event.resource.optionsPrice || 0,
            nominationFee: event.resource.nominationFee || 0,
            discount: event.resource.discount || 0,
            vehicleName1: event.resource.vehicleName1 || event.resource.vehicleName || '',
            vehicleName2: event.resource.vehicleName2 || '',
            vehicleName3: event.resource.vehicleName3 || '',
            vehicleName4: event.resource.vehicleName4 || '',
            hotel: event.resource.hotel || '',
            totalToken: event.resource.totalToken || event.resource.totalAmount || 0,
            deposit: event.resource.deposit || 0,
            driverFee: event.resource.driverFee || 0,
            instagram: event.resource.instagram || '',
            whatsapp: event.resource.whatsapp || '',
            email: event.resource.email || '',
            remarks: event.resource.remarks || '',
        });
        setIsEditing(false);
    };

    const closeModal = () => {
        setIsEditing(false);
        setSelectedEvent(null);
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (selectedEvent) closeModal();
                else if (showDayList) setShowDayList(false);
                else if (showSettingsModal) setShowSettingsModal(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedEvent, showDayList, showSettingsModal]);


    const eventStyleGetter = (event) => {
        const tourType = event.resource.tourType;
        let backgroundColor = PLAN_META[tourType]?.color || '#E60012'; // 通常はPLAN_METAの色、無ければ赤
        let opacity = 1;
        let border = 'none';

        if (event.resource.isOriginalRescheduledEvent) {
            backgroundColor = '#757575'; // 変更前（元々）はグレー
            opacity = 0.5;
        } else if (event.resource.status === 'Canceled') {
            backgroundColor = '#9e9e9e'; // キャンセル済はグレー
        }

        // ドライバー未アサイン警告 (statusがCanceledではない場合のみ)
        const vData = event.resource.vehiclesData || [];
        const isUnassigned = vData.length === 0 || vData[0]?.resolvedDriverName === '未設定' || !vData[0]?.resolvedDriverName;
        
        if (isUnassigned && event.resource.status !== 'Canceled' && !event.resource.isOriginalRescheduledEvent) {
            border = '2px dashed #ffffff';
            opacity = 0.6;
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

    const onEventDrop = async ({ event, start, end }) => {
        if (event.resource.isOriginalRescheduledEvent) {
            alert("元の（変更前）の予定は移動できません。");
            return;
        }

        const newDateStr = format(start, 'yyyy-MM-dd');
        const oldDateStr = event.resource.date;

        if (newDateStr === oldDateStr) return; // 日付が変わっていない場合

        if (!window.confirm(`「${event.resource.name}」の予定を ${newDateStr} に移動しますか？`)) {
            return;
        }

        try {
            const bookingDocRef = doc(db, 'bookings', event.resource.id);
            const timestamp = new Date().toISOString();
            
            const changes = [{
                field: 'date',
                label: 'ツアー日程',
                old: oldDateStr,
                new: newDateStr
            }];

            const historyEntry = { timestamp, changes };
            
            const updateFields = {
                date: newDateStr,
                changeHistory: arrayUnion(historyEntry)
            };

            if (!event.resource.isRescheduled) {
                updateFields.isRescheduled = true;
                updateFields.originalDate = oldDateStr;
            }

            await updateDoc(bookingDocRef, updateFields);
            
            // To properly update local state (though onSnapshot handles most of it, selectedEvent needs update if open)
            if (selectedEvent && selectedEvent.id === event.resource.id) {
                setSelectedEvent(prev => ({ ...prev, ...updateFields }));
                setEditData(prev => ({ ...prev, date: newDateStr }));
            }
        } catch (error) {
            console.error("Error moving booking:", error);
            alert("移動に失敗しました: " + error.message);
        }
    };

    return (
        <div className="calendar-dashboard">
            <header className="calendar-header">
                <h2>Booking Calendar & Ledger</h2>
                <div className="header-actions">
                    <button className="settings-btn" onClick={openSettingsModal}>
                        ⚙️ ドライバーあだ名設定
                    </button>
                    <button className="export-btn" onClick={handleExportCSV}>
                        Download Spreadsheet (CSV)
                    </button>
                </div>
            </header>
            
            <div className="calendar-filters" style={{ display: 'flex', gap: '10px', padding: '10px 20px', background: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
                <select value={filterDriver} onChange={e => setFilterDriver(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
                    <option value="">すべてのドライバー</option>
                    {vehiclesList.map(v => (
                        <option key={v.id} value={v.driverNickname || v.name}>{v.driverNickname || v.name}</option>
                    ))}
                </select>
                <select value={filterPlan} onChange={e => setFilterPlan(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
                    <option value="">すべてのプラン</option>
                    <option value="Standard">Standard Plan</option>
                    <option value="Midnight">Midnight Plan</option>
                    <option value="Morning">Morning Plan</option>
                    <option value="City Tour">City Tour</option>
                </select>
            </div>
            
            <div className="calendar-container">
                <DnDCalendar
                    localizer={localizer}
                    events={filteredEvents}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '80vh' }}
                    views={['month', 'week', 'day', 'agenda']}
                    view={calendarView}
                    onView={setCalendarView}
                    popup={true}
                    components={customComponents}
                    onEventDrop={onEventDrop}
                    resizable={false}
                    onDrillDown={(date) => {
                        setSelectedDate(date);
                        setShowDayList(true);
                    }}
                    onSelectEvent={(event) => {
                        handleSelectEvent(event);
                    }}
                    tooltipAccessor={e => `${e.resource.name} - ${e.resource.tourType} - ${e.resource.hotel}`}
                    eventPropGetter={eventStyleGetter}
                />
            </div>

            <BookingDetailModal 
                selectedEvent={selectedEvent}
                setSelectedEvent={setSelectedEvent}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                editData={editData}
                setEditData={setEditData}
                availableNicknames={availableNicknames}
                closeModal={closeModal}
            />

            {/* Googleカレンダー風・スマホ最適化 日別予定一覧ボトムシート */}
            <DayListSheet 
                showDayList={showDayList}
                setShowDayList={setShowDayList}
                selectedDate={selectedDate}
                events={filteredEvents}
                vehiclesList={vehiclesList}
                handleSelectEvent={handleSelectEvent}
            />

            <DriverSettingsModal 
                showSettingsModal={showSettingsModal}
                setShowSettingsModal={setShowSettingsModal}
                vehiclesList={vehiclesList}
            />
        </div>
    );
};

export default CalendarView;
