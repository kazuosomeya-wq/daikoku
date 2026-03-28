import React, { useState, useEffect, useMemo } from 'react';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import Calendar from '../components/Calendar';
import {
    doc, getDoc, setDoc, deleteDoc, collection, query, orderBy,
    onSnapshot, addDoc, updateDoc, arrayUnion, arrayRemove
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db, auth, storage, app } from '../firebase';

import vehicle1 from '../assets/vehicle1.jpg';
import vehicle2 from '../assets/vehicle2.jpg';
import vehicle3 from '../assets/vehicle3.jpg';
import vehicle4 from '../assets/vehicle4.jpg';

const firebaseFunctions = getFunctions(app, 'asia-northeast1');
const updateBookingInSheetFn = httpsCallable(firebaseFunctions, 'updateBookingInSheet');

// ── Helpers ──────────────────────────────────────────────────────────────────

const PLAN_META = {
    // 現行4プラン
    'Standard Plan':       { color: '#E60012', label: '🌉 Standard' },
    'Morning Plan':        { color: '#e65100', label: '☀️ Morning' },
    'Midnight 8:30PM':     { color: '#0066cc', label: '🌙 8:30PM' },
    'Midnight 11:30PM':    { color: '#5b2d8e', label: '🌙 11:30PM' },
    // 旧プラン（既存データ表示用）
    'Daikoku Tour':        { color: '#E60012', label: '🌉 Standard' },
    'Sunday Morning Plan': { color: '#e65100', label: '☀️ Morning' },
    'Midnight Plan':       { color: '#0066cc', label: '🌙 Midnight' },
    'Umihotaru Tour':      { color: '#0066cc', label: '🌃 海ほ' },
};

const getPlanMeta = (tourType) =>
    PLAN_META[tourType] || { color: '#888', label: tourType || '?' };

const STATUS_STYLE = {
    Confirmed: { bg: '#1b4332', color: '#6fcf97' },
    Completed: { bg: '#2d1f4e', color: '#bb86fc' },
    Canceled:  { bg: '#2a2a2a', color: '#888' },
    Pending:   { bg: '#3d2b00', color: '#f6c90e' },
};
const getStatusStyle = (s) => STATUS_STYLE[s] || STATUS_STYLE.Pending;

const formatDate = (booking) => {
    if (!booking?.date) return '—';
    let d = typeof booking.date === 'object' && booking.date?.toDate
        ? booking.date.toDate()
        : new Date(booking.date);
    if (isNaN(d)) return String(booking.date);

    const days = ['日','月','火','水','木','金','土'];
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    const dow = d.getDay(); // 0=日,1=月,...,6=土
    let time = (h !== '00' || m !== '00') ? `${h}:${m}` : '19:30';
    if (h === '00' && m === '00') {
        const isStandard = booking.tourType === 'Standard Plan' || booking.tourType === 'Daikoku Tour';
        if (isStandard) {
            // 金(5)・土(6)・日(0) → 16:30、月〜木 → 19:30
            time = (dow === 0 || dow === 5 || dow === 6) ? '16:30' : '19:30';
        } else if (booking.tourType === 'Morning Plan' || booking.tourType?.includes('Sunday Morning')) {
            time = '08:00';
        } else if (booking.tourType === 'Midnight 11:30PM') {
            time = '23:30';
        } else if (booking.tourType === 'Midnight 8:30PM') {
            time = '20:30';
        } else if (booking.tourType?.includes('Midnight')) {
            time = booking.options?.midnightTimeSlot === '11:30 PM' ? '23:30' : '20:30';
        }
    }
    return `${d.getMonth()+1}/${d.getDate()} (${days[d.getDay()]}) ${time}`;
};

const toDateInputValue = (dateStr) => {
    if (!dateStr) return '';
    let d;
    if (typeof dateStr === 'object' && typeof dateStr.toDate === 'function') {
        d = dateStr.toDate(); // Firestore Timestamp
    } else if (dateStr instanceof Date) {
        d = dateStr;
    } else {
        d = new Date(dateStr);
    }
    if (isNaN(d)) return '';
    // ローカル時刻で返す（UTC変換でずれないように）
    const y  = d.getFullYear();
    const m  = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
};

// ── Style constants ───────────────────────────────────────────────────────────

const inputDark = {
    width: '100%', boxSizing: 'border-box', padding: '0.65rem 0.8rem',
    borderRadius: '8px', border: '1px solid #444', background: '#2a2a2a',
    color: 'white', fontSize: '0.9rem',
};
const inputLight = {
    width: '100%', boxSizing: 'border-box', padding: '0.6rem 0.8rem',
    borderRadius: '6px', border: '1px solid #ccc', background: 'white',
    color: '#111', fontSize: '0.9rem',
};
const selectLight = { ...inputLight, cursor: 'pointer' };

const pill = (bg, color) => ({
    display: 'inline-block', padding: '2px 8px', borderRadius: '12px',
    fontSize: '0.7rem', fontWeight: 'bold', background: bg, color,
});

const iconBtn = (color = '#333') => ({
    padding: '0.45rem 0.8rem', background: color, color: 'white',
    border: 'none', borderRadius: '8px', cursor: 'pointer',
    fontWeight: 'bold', fontSize: '0.82rem', whiteSpace: 'nowrap',
});

// ── Main Component ────────────────────────────────────────────────────────────

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [currentTab, setCurrentTab] = useState('all-bookings');

    // Data
    const [bookings, setBookings]   = useState([]);
    const [vehicles, setVehicles]   = useState([]);
    const [globalSettings, setGlobalSettings] = useState({ is1130Enabled: true });

    // Filter / search
    const [filter, setFilter]   = useState('upcoming');
    const [search, setSearch]   = useState('');
    const [sortBy, setSortBy]   = useState('date-asc'); // date-asc | date-desc | created-desc | created-asc

    // Booking edit modal
    const [selectedBooking, setSelectedBooking] = useState(null); // null=closed, 'new'=create, booking obj=edit
    const [editForm, setEditForm]               = useState({});
    const [isSaving, setIsSaving]               = useState(false);
    const [isDeleting, setIsDeleting]           = useState(false);
    const [showChangeLog, setShowChangeLog]     = useState(false);

    // Vehicle availability (read-only, for color display in selector)
    const [vehicleAvailability, setVehicleAvailability] = useState({});

    // Availability modal
    const [editingDate, setEditingDate]         = useState(null);
    const [editingTourType, setEditingTourType] = useState(null);

    // Vehicle form
    const blankVehicle = { name:'', subtitle:'', price:'5000', slug:'', displayOrder:0, isVisible:true, driverEmail:'', image:null, imageUrl:'' };
    const [newVehicle, setNewVehicle]           = useState(blankVehicle);
    const [isUploading, setIsUploading]         = useState(false);
    const [editingVehicleId, setEditingVehicleId] = useState(null);

    // ── Firestore listeners ────────────────────────────────────────────────────
    useEffect(() => {
        const unsubB = onSnapshot(
            query(collection(db, 'bookings'), orderBy('timestamp', 'desc')),
            (snap) => setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        );
        const unsubV = onSnapshot(collection(db, 'vehicles'), (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            data.sort((a, b) => {
                const o = v => (!v || v === 0) ? 999 : v;
                return o(a.displayOrder) - o(b.displayOrder);
            });
            setVehicles(data);
        });
        const unsubS = onSnapshot(doc(db, 'settings', 'global'), (snap) =>
            setGlobalSettings(snap.exists() ? snap.data() : { is1130Enabled: true })
        );
        const unsubA = onSnapshot(collection(db, 'vehicle_availability'), (snap) => {
            const avail = {};
            snap.forEach(d => {
                const data = d.data();
                avail[d.id] = { daikoku: data.daikokuDates || [], umihotaru: data.umihotaruDates || [] };
            });
            setVehicleAvailability(avail);
        });
        return () => { unsubB(); unsubV(); unsubS(); unsubA(); };
    }, []);

    // ── Filtered bookings ─────────────────────────────────────────────────────
    const applySort = (list, key) => {
        const getDate  = b => new Date(b.date || 0).getTime();
        const getCreated = b => {
            if (b.timestamp?.toDate) return b.timestamp.toDate().getTime();
            if (b.timestamp) return new Date(b.timestamp).getTime();
            return 0;
        };
        switch (key) {
            case 'date-asc':     return [...list].sort((a,b) => getDate(a) - getDate(b));
            case 'date-desc':    return [...list].sort((a,b) => getDate(b) - getDate(a));
            case 'created-desc': return [...list].sort((a,b) => getCreated(b) - getCreated(a));
            case 'created-asc':  return [...list].sort((a,b) => getCreated(a) - getCreated(b));
            default: return list;
        }
    };

    const filteredBookings = useMemo(() => {
        const today = new Date(); today.setHours(0,0,0,0);
        const tomorrow = new Date(today.getTime() + 86400000);

        let list = [...bookings];

        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(b =>
                (b.name||'').toLowerCase().includes(q) ||
                (b.instagram||'').toLowerCase().includes(q) ||
                (b.email||'').toLowerCase().includes(q) ||
                (b.hotel||'').toLowerCase().includes(q)
            );
        }

        switch (filter) {
            case 'today':
                list = list.filter(b => { const d = new Date(b.date||0); return d >= today && d < tomorrow; });
                break;
            case 'upcoming':
                list = list.filter(b => {
                    const d = new Date(b.date||0);
                    return d >= today && b.status !== 'Canceled' && b.status !== 'Completed';
                });
                break;
            case 'unassigned':
                list = list.filter(b => !b.driverName && b.status !== 'Canceled' && b.status !== 'Completed');
                break;
            case 'completed':
                list = list.filter(b => b.status === 'Completed');
                break;
            case 'canceled':
                list = list.filter(b => b.status === 'Canceled');
                break;
            default: break; // 'all'
        }
        return applySort(list, sortBy);
    }, [bookings, filter, search, sortBy]);

    // Count for upcoming badge
    const upcomingCount = useMemo(() => {
        const today = new Date(); today.setHours(0,0,0,0);
        return bookings.filter(b => new Date(b.date||0) >= today && b.status !== 'Canceled' && b.status !== 'Completed').length;
    }, [bookings]);

    // ── Booking edit / create ─────────────────────────────────────────────────
    const BLANK_FORM = {
        name:'', email:'', instagram:'', whatsapp:'', hotel:'',
        guests:2, tourType:'Standard Plan', date:'',
        assignedVehicles: [], midnightTimeSlot:'8:30 PM',
        cashCollected:false, status:'Pending', adminNote:'', remarks:'',
        deposit:5000, totalToken:50000, source:'manual',
    };

    const parseAssignedVehicles = (booking) => {
        const list = [];
        const ids = booking.options?.selectedVehicles || [];
        if (ids.length > 0) {
            ids.forEach((id, i) => {
                const custom = i === 0 ? (booking.vehicleCustom1||'') : i === 1 ? (booking.vehicleCustom2||'') : '';
                list.push({ vehicleId: id, custom });
            });
        } else {
            if (booking.options?.selectedVehicle || booking.vehicleCustom1)
                list.push({ vehicleId: booking.options?.selectedVehicle||'', custom: booking.vehicleCustom1||'' });
            if (booking.options?.selectedVehicle2 || booking.vehicleCustom2)
                list.push({ vehicleId: booking.options?.selectedVehicle2||'', custom: booking.vehicleCustom2||'' });
        }
        return list;
    };

    const openEdit = (booking) => {
        setShowChangeLog(false);
        setSelectedBooking(booking);
        setEditForm({
            name:             booking.name || '',
            email:            booking.email || '',
            instagram:        booking.instagram || '',
            whatsapp:         booking.whatsapp || '',
            hotel:            booking.hotel || '',
            guests:           booking.guests || 1,
            tourType:         booking.tourType || '',
            date:             toDateInputValue(booking.date),
            assignedVehicles: parseAssignedVehicles(booking),
            midnightTimeSlot: booking.options?.midnightTimeSlot || '8:30 PM',
            cashCollected:    booking.cashCollected || false,
            status:           booking.status || 'Pending',
            adminNote:        booking.adminNote || '',
            remarks:          booking.remarks || '',
            deposit:          booking.deposit || 0,
            totalToken:       booking.totalToken || 0,
            source:           booking.source || 'stripe',
        });
    };

    const openCreate = () => {
        setShowChangeLog(false);
        setSelectedBooking('new');
        setEditForm({ ...BLANK_FORM });
    };

    // フィールドラベル（変更履歴用）
    const FIELD_LABELS = {
        name:'名前', email:'Email', instagram:'Instagram', whatsapp:'WhatsApp',
        hotel:'ホテル', guests:'人数', tourType:'プラン', date:'ツアー日',
        assignedVehicles:'車両', midnightTimeSlot:'時間帯',
        cashCollected:'現金回収', status:'ステータス',
        adminNote:'管理メモ', deposit:'デポジット', totalToken:'合計金額',
        source:'流入元',
    };

    const buildChangelog = (original, updated) => {
        const entries = [];
        for (const [key, label] of Object.entries(FIELD_LABELS)) {
            const oldRaw = key === 'date' ? toDateInputValue(original.date) : original[key];
            const newRaw = updated[key];
            if (String(oldRaw ?? '') !== String(newRaw ?? '')) {
                entries.push({
                    field: label,
                    from:  String(oldRaw ?? '—'),
                    to:    String(newRaw ?? '—'),
                    at:    new Date().toISOString(),
                });
            }
        }
        return entries;
    };

    // ── Availability helpers ───────────────────────────────────────────────────
    // 車両が指定日・プランで空いているか (true=空き/青, false=埋まり/赤, null=不明)
    const checkVehicleAvail = (vehicleId, dateStr, tourType) => {
        if (!vehicleId || !dateStr) return null;
        const avail = vehicleAvailability[vehicleId];
        if (!avail) return null;
        const isMid = tourType?.includes('Midnight') || tourType?.includes('Umihotaru');
        const dates = isMid ? avail.umihotaru : avail.daikoku;
        return dates.includes(dateStr);
    };

    // 車両リストを空き順にソート（青→未設定→赤）
    const sortedVehicles = useMemo(() => {
        const dateStr = editForm.date || '';
        const tourType = editForm.tourType || '';
        return [...vehicles].filter(v => v.isVisible !== false).sort((a, b) => {
            const sa = checkVehicleAvail(a.id, dateStr, tourType);
            const sb = checkVehicleAvail(b.id, dateStr, tourType);
            const rank = x => x === true ? 0 : x === null ? 1 : 2;
            return rank(sa) - rank(sb);
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vehicles, vehicleAvailability, editForm.date, editForm.tourType]);

    const getAvailField = (tourType) => {
        const t = tourType || '';
        return (t.includes('Standard') || t.includes('Daikoku')) ? 'daikokuDates' : 'umihotaruDates';
    };
    const toYMD = (d) => {
        if (!d) return '';
        const dt = typeof d === 'object' && d?.toDate ? d.toDate() : new Date(d);
        if (isNaN(dt)) return '';
        return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
    };
    const syncAvailability = async ({ oldVehicleId, oldDate, oldField, newVehicleId, newDate, newField }) => {
        // 旧スロットをオープンに戻す
        if (oldVehicleId && oldDate) {
            const ref = doc(db, 'vehicle_availability', oldVehicleId);
            const snap = await getDoc(ref);
            if (snap.exists()) {
                await updateDoc(ref, { [oldField]: arrayUnion(oldDate) });
            }
        }
        // 新スロットをブロック
        if (newVehicleId && newDate) {
            const ref = doc(db, 'vehicle_availability', newVehicleId);
            const snap = await getDoc(ref);
            if (snap.exists()) {
                await updateDoc(ref, { [newField]: arrayRemove(newDate) });
            }
        }
    };

    const handleSave = async () => {
        if (!selectedBooking) return;
        const isNew = selectedBooking === 'new';
        setIsSaving(true);
        try {
            const av = editForm.assignedVehicles || [];
            // 各車両スロットを解決
            const resolvedSlots = av.map(slot => {
                const v = vehicles.find(x => x.id === slot.vehicleId);
                return { vehicleId: slot.vehicleId, custom: slot.custom, displayName: slot.custom || v?.slug || v?.name || '' };
            });

            // options 再構築（後方互換 + 新配列）
            const baseOptions = isNew ? {} : (selectedBooking.options || {});
            const isMidnight = editForm.tourType?.includes('Midnight') || editForm.tourType?.includes('Umihotaru');
            const newOptions = {
                ...baseOptions,
                selectedVehicle:  resolvedSlots[0]?.vehicleId || '',
                selectedVehicle2: resolvedSlots[1]?.vehicleId || '',
                selectedVehicles: resolvedSlots.map(s => s.vehicleId).filter(Boolean),
                ...(isMidnight ? { midnightTimeSlot: editForm.midnightTimeSlot || '8:30 PM' } : {}),
            };

            // Strip form-only keys
            const { assignedVehicles, midnightTimeSlot, ...rest } = editForm;
            const updates = {
                ...rest,
                date:          editForm.date ? new Date(editForm.date).toDateString() : '',
                guests:        Number(editForm.guests),
                deposit:       Number(editForm.deposit),
                totalToken:    Number(editForm.totalToken),
                options:       newOptions,
                vehicleName1:  resolvedSlots[0]?.displayName || '',
                vehicleName2:  resolvedSlots[1]?.displayName || '',
                vehicleCustom1:resolvedSlots[0]?.custom || '',
                vehicleCustom2:resolvedSlots[1]?.custom || '',
                driverName:    resolvedSlots[0]?.displayName || '',
            };

            if (isNew) {
                updates.timestamp     = new Date();
                updates.paymentStatus = 'Manual';
                updates.source        = editForm.source || 'manual';
                const ref = await addDoc(collection(db, 'bookings'), updates);
                console.log('Manual booking created:', ref.id);
            } else {
                // 変更履歴を生成
                const changes = buildChangelog(selectedBooking, updates);
                if (changes.length > 0) {
                    updates.changeLog = arrayUnion(...changes);
                }
                await updateDoc(doc(db, 'bookings', selectedBooking.id), updates);
                updateBookingInSheetFn({ docId: selectedBooking.id, bookingData: updates })
                    .catch(e => console.warn('Sheets sync skipped:', e.message));
            }

            // ── 割当車両の該当日を自動ブロック ─────────────────────────────
            if (editForm.date) {
                const avField = isMidnight ? 'umihotaruDates' : 'daikokuDates';
                resolvedSlots.forEach(slot => {
                    if (!slot.vehicleId) return;
                    const avRef = doc(db, 'vehicle_availability', slot.vehicleId);
                    updateDoc(avRef, { [avField]: arrayRemove(editForm.date) })
                        .catch(e => console.warn('Auto-block skipped:', slot.vehicleId, e.message));
                });
            }

            setSelectedBooking(null);
        } catch (err) {
            console.error(err);
            alert('保存に失敗しました: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedBooking) return;
        if (!window.confirm(`「${selectedBooking.name}」の予約を削除しますか？\nこの操作は元に戻せません。`)) return;
        setIsDeleting(true);
        try {
            await deleteDoc(doc(db, 'bookings', selectedBooking.id));
            setSelectedBooking(null);
        } catch (err) {
            alert('削除に失敗しました: ' + err.message);
        } finally {
            setIsDeleting(false);
        }
    };

    // ── Availability ──────────────────────────────────────────────────────────
    const handleSaveSlots = async (slots) => {
        if (!editingDate || !editingTourType) return;
        const dateStr = [
            editingDate.getFullYear(),
            String(editingDate.getMonth()+1).padStart(2,'0'),
            String(editingDate.getDate()).padStart(2,'0'),
        ].join('-');
        const field = editingTourType === 'Daikoku Tour' ? 'slots' : 'umihotaru_slots';
        try {
            if (slots === null) await deleteDoc(doc(db, 'availability', dateStr));
            else await setDoc(doc(db, 'availability', dateStr), { [field]: slots }, { merge: true });
        } catch (e) { alert(`Error: ${e.message}`); }
        setEditingDate(null);
        setEditingTourType(null);
    };

    // ── Global settings ───────────────────────────────────────────────────────
    const handleToggle1130 = async () => {
        const newVal = !globalSettings.is1130Enabled;
        setGlobalSettings(p => ({ ...p, is1130Enabled: newVal }));
        try {
            await setDoc(doc(db, 'settings', 'global'), { is1130Enabled: newVal }, { merge: true });
        } catch (e) { alert('Failed'); }
    };

    // ── Vehicle management ────────────────────────────────────────────────────
    const handleSaveVehicle = async (e) => {
        e.preventDefault();
        setIsUploading(true);
        if (newVehicle.slug) {
            const dup = vehicles.find(v => v.slug === newVehicle.slug && v.id !== (editingVehicleId||''));
            if (dup) { alert(`Slug "${newVehicle.slug}" is already used by ${dup.name}`); setIsUploading(false); return; }
        }
        try {
            let imageUrl = newVehicle.imageUrl;
            if (newVehicle.image) {
                const storageRef = ref(storage, `vehicle_images/${Date.now()}_${newVehicle.image.name}`);
                const snap = await uploadBytes(storageRef, newVehicle.image);
                imageUrl = await getDownloadURL(snap.ref);
            } else if (!imageUrl && !editingVehicleId) {
                imageUrl = 'https://placehold.co/600x400?text=No+Image';
            }
            const data = {
                name:         newVehicle.name,
                subtitle:     newVehicle.subtitle || '',
                price:        newVehicle.price,
                slug:         newVehicle.slug || '',
                driverEmail:  newVehicle.driverEmail || '',
                displayOrder: Number(newVehicle.displayOrder || 0),
                isVisible:    newVehicle.isVisible !== false,
                imageUrl:     imageUrl || '',
                updatedAt:    new Date(),
            };
            if (editingVehicleId) {
                await updateDoc(doc(db, 'vehicles', editingVehicleId), data);
                setEditingVehicleId(null);
            } else {
                data.createdAt = new Date();
                await addDoc(collection(db, 'vehicles'), data);
            }
            setNewVehicle(blankVehicle);
        } catch (err) { alert('Failed: ' + err.message); }
        setIsUploading(false);
    };

    const startEditVehicle = (v) => {
        setEditingVehicleId(v.id);
        setNewVehicle({ name:v.name, subtitle:v.subtitle||'', price:v.price, slug:v.slug||'', displayOrder:v.displayOrder||0, isVisible:v.isVisible!==false, driverEmail:v.driverEmail||'', image:null, imageUrl:v.imageUrl||'' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteVehicle = async (id) => {
        if (window.confirm('この車両を削除しますか？')) {
            try { await deleteDoc(doc(db, 'vehicles', id)); }
            catch (e) { alert('Failed: ' + e.message); }
        }
    };

    const handleRestoreDefaults = async () => {
        if (!window.confirm('デフォルト車両を復元しますか？重複する場合があります。')) return;
        setIsUploading(true);
        try {
            const defaults = [
                { name:'R34 - Bayside Blue', price:'5000', subtitle:'English ⚪︎', img:vehicle1 },
                { name:'R34 - 600hp Bayside Blue', price:'15000', subtitle:'', img:vehicle2 },
                { name:'R32 - GTR', price:'5000', subtitle:'', img:vehicle3 },
                { name:'Supra - Purple', price:'5000', subtitle:'', img:vehicle4 },
            ];
            for (const v of defaults) {
                const blob = await (await fetch(v.img)).blob();
                const storageRef = ref(storage, `vehicle_images/${Date.now()}_${v.name.replace(/\s/g,'_')}.jpg`);
                const snap = await uploadBytes(storageRef, blob);
                const url = await getDownloadURL(snap.ref);
                await addDoc(collection(db, 'vehicles'), { name:v.name, subtitle:v.subtitle, price:v.price, imageUrl:url, createdAt:new Date() });
            }
            alert('復元完了！');
        } catch (e) { alert('Failed: ' + e.message); }
        setIsUploading(false);
    };

    const getDriverLink = (v) => `${window.location.origin}/driver/${v.slug || v.id}`;

    const getVehicleLabel = (booking) => {
        if (!booking.options) return '—';
        const resolve = (id) => {
            if (!id || id === 'none') return 'Random R34';
            if (id === 'random-cars') return 'Random';
            const v = vehicles.find(x => x.id === id);
            return v ? v.name : id;
        };
        let label = resolve(booking.options.selectedVehicle);
        if (booking.carCount >= 2 && booking.options.selectedVehicle2)
            label += ` + ${resolve(booking.options.selectedVehicle2)}`;
        return label;
    };

    // ── RENDER ────────────────────────────────────────────────────────────────

    const FILTERS = [
        { key:'upcoming',   label:`今後 (${upcomingCount})` },
        { key:'today',      label:'今日' },
        { key:'all',        label:'全部' },
        { key:'unassigned', label:'未割当' },
        { key:'completed',  label:'完了' },
        { key:'canceled',   label:'キャンセル' },
    ];

    const TABS = [
        { key:'all-bookings', icon:'📋', label:'全予約',  color:'#9c27b0' },
        { key:'availability', icon:'📅', label:'空き管理', color:'#E60012' },
        { key:'vehicles',     icon:'🏎️', label:'車両',    color:'#FFD700' },
        { key:'settings',     icon:'⚙️', label:'設定',    color:'#4CAF50' },
    ];

    return (
        <div style={{ background:'#111', minHeight:'100vh', color:'white', paddingBottom:'80px' }}>

            {/* ── Header ── */}
            <div style={{ padding:'1rem 1.2rem 0.8rem', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #2a2a2a', position:'sticky', top:0, background:'#111', zIndex:50 }}>
                <span style={{ fontWeight:'bold', fontSize:'1.1rem', letterSpacing:'2px' }}>ADMIN</span>
                <div style={{ display:'flex', gap:'0.5rem' }}>
                    <button onClick={() => navigate('/master-schedule')} style={iconBtn('#0066cc')}>📅 Cal</button>
                    <button onClick={() => signOut(auth).then(() => navigate('/admin')).catch(() => navigate('/admin'))} style={iconBtn('#333')}>Logout</button>
                </div>
            </div>

            <div style={{ padding:'0.8rem' }}>

                {/* ════════ ALL BOOKINGS ════════ */}
                {currentTab === 'all-bookings' && (
                    <div>
                        {/* Search */}
                        <input
                            type="search" placeholder="🔍 名前 / IG / メール / ホテル..."
                            value={search} onChange={e => setSearch(e.target.value)}
                            style={{ ...inputDark, marginBottom:'0.6rem' }}
                        />

                        {/* Filter pills */}
                        <div style={{ display:'flex', gap:'0.4rem', overflowX:'auto', paddingBottom:'0.4rem', marginBottom:'0.6rem', scrollbarWidth:'none' }}>
                            {FILTERS.map(f => (
                                <button key={f.key} onClick={() => setFilter(f.key)} style={{
                                    padding:'0.4rem 0.85rem', borderRadius:'20px', border:'none',
                                    cursor:'pointer', whiteSpace:'nowrap', fontWeight:'bold', fontSize:'0.78rem',
                                    background: filter === f.key ? '#E60012' : '#222',
                                    color:      filter === f.key ? 'white'   : '#888',
                                    flexShrink: 0,
                                }}>{f.label}</button>
                            ))}
                        </div>

                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', margin:'0 0 0.6rem', gap:'0.5rem', flexWrap:'wrap' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
                                <p style={{ color:'#555', fontSize:'0.75rem', margin:0 }}>{filteredBookings.length}件</p>
                                <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                                    style={{ fontSize:'0.75rem', padding:'3px 6px', borderRadius:'6px', border:'1px solid #ccc', background:'#f9f9f9', color:'#333', cursor:'pointer' }}>
                                    <option value="date-asc">📅 日付順（近い順）</option>
                                    <option value="date-desc">📅 日付順（遠い順）</option>
                                    <option value="created-desc">🕐 登録順（新しい順）</option>
                                    <option value="created-asc">🕐 登録順（古い順）</option>
                                </select>
                            </div>
                            <button onClick={openCreate} style={{ ...iconBtn('#1b5e20'), fontSize:'0.82rem', background:'#2e7d32' }}>
                                ＋ 手動予約を追加
                            </button>
                        </div>

                        {/* Booking cards */}
                        <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                            {filteredBookings.map(b => {
                                const { color: planColor } = getPlanMeta(b.tourType);
                                const { bg: sBg, color: sColor } = getStatusStyle(b.status);
                                const allVehicleIds = b.options?.selectedVehicles?.length
                                    ? b.options.selectedVehicles
                                    : [b.options?.selectedVehicle, b.options?.selectedVehicle2].filter(Boolean);
                                const driverSlugs = allVehicleIds.map((id, i) => {
                                    const v = vehicles.find(x => x.id === id);
                                    return (i === 0 ? b.vehicleCustom1 : b.vehicleCustom2) || v?.slug || null;
                                }).filter(Boolean);
                                const driverLabel = driverSlugs.length > 0 ? driverSlugs.join(' + ') : null;
                                return (
                                    <div key={b.id} onClick={() => openEdit(b)} style={{
                                        background:'#1c1c1c', borderRadius:'10px', padding:'0.7rem 1rem',
                                        borderLeft:`4px solid ${planColor}`, cursor:'pointer',
                                        display:'flex', flexDirection:'column', gap:'0.3rem',
                                    }}>
                                        {/* Row 1: date + status */}
                                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                                            <span style={{ fontWeight:'bold', fontSize:'0.95rem' }}>{formatDate(b)}</span>
                                            <span style={pill(sBg, sColor)}>{b.status || 'Pending'}</span>
                                        </div>
                                        {/* Row 2: name + drivers */}
                                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:'0.4rem' }}>
                                            <span style={{ fontWeight:'bold', color:'#eee', fontSize:'0.95rem' }}>{b.name}</span>
                                            <span style={{ fontSize:'0.78rem', color: driverLabel ? '#4fc3f7' : '#aaa', flexShrink:0, textAlign:'right' }}>
                                                {driverLabel || '🎲 Random R34'}
                                            </span>
                                        </div>
                                        {/* Row 3: total + cash */}
                                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'0.82rem' }}>
                                            <span style={{ color:'#E60012', fontWeight:'bold' }}>¥{(b.totalToken||0).toLocaleString()}</span>
                                            {!b.cashCollected && (
                                                <span style={{ padding:'2px 7px', borderRadius:'8px', fontWeight:'bold', fontSize:'0.72rem', background:'#3d2b00', color:'#f6c90e' }}>
                                                    ⏳ 未回収
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {filteredBookings.length === 0 && (
                                <div style={{ textAlign:'center', color:'#444', padding:'3rem', fontSize:'0.9rem' }}>予約なし</div>
                            )}
                        </div>
                    </div>
                )}

                {/* ════════ AVAILABILITY ════════ */}
                {currentTab === 'availability' && (
                    <div>
                        <h2 style={{ fontSize:'1rem', margin:'0 0 1rem', color:'#ccc' }}>空き管理</h2>

                        {/* Daikoku */}
                        <div style={{ background:'#1c1c1c', borderRadius:'12px', padding:'1rem', marginBottom:'1rem', borderLeft:'4px solid #E60012' }}>
                            <h3 style={{ margin:'0 0 0.3rem', color:'#E60012', fontSize:'0.9rem' }}>🌉 大黒ツアー（Standard / Sunday Morning）</h3>
                            <p style={{ color:'#666', fontSize:'0.78rem', margin:'0 0 0.8rem' }}>日付をタップ → 空き枠を設定</p>
                            <Calendar
                                personCount={2} selectedDate={new Date()}
                                onDateSelect={(d) => { setEditingDate(d); setEditingTourType('Daikoku Tour'); }}
                                isAdmin={true} tourType="Daikoku Tour"
                            />
                        </div>

                        {/* Midnight */}
                        <div style={{ background:'#1c1c1c', borderRadius:'12px', padding:'1rem', borderLeft:'4px solid #0066cc' }}>
                            <h3 style={{ margin:'0 0 0.3rem', color:'#4fc3f7', fontSize:'0.9rem' }}>🌙 Midnight Plan（金・土）</h3>
                            <p style={{ color:'#666', fontSize:'0.78rem', margin:'0 0 0.8rem' }}>日付をタップ → 空き枠を設定</p>
                            <Calendar
                                personCount={2} selectedDate={new Date()}
                                onDateSelect={(d) => { setEditingDate(d); setEditingTourType('Umihotaru Tour'); }}
                                isAdmin={true} tourType="Umihotaru Tour"
                            />
                        </div>
                    </div>
                )}

                {/* ════════ VEHICLES ════════ */}
                {currentTab === 'vehicles' && (
                    <div>
                        <h2 style={{ fontSize:'1rem', margin:'0 0 1rem', color:'#FFD700' }}>🏎️ 車両管理</h2>

                        {/* Form */}
                        <div style={{ background:'#1c1c1c', borderRadius:'12px', padding:'1.1rem', marginBottom:'1.2rem' }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.9rem' }}>
                                <h3 style={{ margin:0, fontSize:'0.9rem', color: editingVehicleId ? '#4fc3f7' : '#FFD700' }}>
                                    {editingVehicleId ? '✏️ 編集中' : '＋ 車両追加'}
                                </h3>
                                <button onClick={handleRestoreDefaults} disabled={isUploading} style={{ ...iconBtn('#444'), fontSize:'0.75rem' }}>
                                    デフォルト復元
                                </button>
                            </div>
                            <form onSubmit={handleSaveVehicle}>
                                {[
                                    { label:'車両名 *',         key:'name',        ph:'R34 - Bayside Blue', req:true },
                                    { label:'サブタイトル',      key:'subtitle',    ph:'English OK' },
                                    { label:'追加料金 (¥)',     key:'price',       ph:'5000' },
                                    { label:'スラッグ (URL ID)', key:'slug',        ph:'kazuo-r34' },
                                    { label:'ドライバーEmail',   key:'driverEmail', ph:'driver@example.com' },
                                    { label:'表示順',           key:'displayOrder', ph:'1' },
                                ].map(({ label, key, ph, req }) => (
                                    <div key={key} style={{ marginBottom:'0.6rem' }}>
                                        <label style={{ display:'block', fontSize:'0.75rem', color:'#888', marginBottom:'3px' }}>{label}</label>
                                        <input
                                            type="text" value={newVehicle[key]} placeholder={ph} required={req}
                                            onChange={e => setNewVehicle(v => ({ ...v, [key]: e.target.value }))}
                                            style={inputDark}
                                        />
                                    </div>
                                ))}
                                <div style={{ display:'flex', alignItems:'center', gap:'8px', margin:'0.6rem 0' }}>
                                    <input type="checkbox" id="vis" checked={newVehicle.isVisible}
                                        onChange={e => setNewVehicle(v => ({ ...v, isVisible: e.target.checked }))}
                                        style={{ width:18, height:18, cursor:'pointer' }} />
                                    <label htmlFor="vis" style={{ fontSize:'0.85rem', cursor:'pointer' }}>予約ページに表示</label>
                                </div>
                                <div style={{ marginBottom:'0.8rem' }}>
                                    <label style={{ display:'block', fontSize:'0.75rem', color:'#888', marginBottom:'3px' }}>画像</label>
                                    <input type="file" accept="image/*"
                                        onChange={e => e.target.files[0] && setNewVehicle(v => ({ ...v, image: e.target.files[0] }))}
                                        style={{ color:'#aaa', fontSize:'0.82rem' }} />
                                </div>
                                <div style={{ display:'flex', gap:'0.5rem' }}>
                                    <button type="submit" disabled={isUploading} style={iconBtn(editingVehicleId ? '#0066cc' : '#E60012')}>
                                        {isUploading ? '保存中...' : editingVehicleId ? '更新' : '追加'}
                                    </button>
                                    {editingVehicleId && (
                                        <button type="button" onClick={() => { setEditingVehicleId(null); setNewVehicle(blankVehicle); }} style={iconBtn('#444')}>
                                            キャンセル
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>

                        {/* Vehicle list */}
                        <div style={{ display:'flex', flexDirection:'column', gap:'0.7rem' }}>
                            {vehicles.map(v => (
                                <div key={v.id} style={{
                                    background:'#1c1c1c', borderRadius:'12px', padding:'0.9rem',
                                    display:'flex', gap:'0.8rem',
                                    opacity: v.isVisible === false ? 0.5 : 1,
                                    border: v.isVisible === false ? '1px dashed #444' : '1px solid #2a2a2a',
                                }}>
                                    <img src={v.imageUrl} alt={v.name} style={{ width:72, height:72, objectFit:'cover', borderRadius:'8px', flexShrink:0 }} />
                                    <div style={{ flex:1, minWidth:0 }}>
                                        <div style={{ fontWeight:'bold', fontSize:'0.9rem', display:'flex', alignItems:'center', gap:'6px' }}>
                                            {v.name}
                                            {v.isVisible === false && <span style={{ color:'#ff4444', fontSize:'0.65rem', background:'#3a0000', padding:'1px 5px', borderRadius:'4px' }}>HIDDEN</span>}
                                        </div>
                                        <div style={{ color:'#888', fontSize:'0.78rem' }}>{v.subtitle}</div>
                                        <div style={{ color:'#E60012', fontSize:'0.8rem', fontWeight:'bold' }}>+¥{Number(v.price).toLocaleString()}</div>
                                        <div style={{ fontSize:'0.72rem', color:'#555', marginTop:'4px', wordBreak:'break-all' }}>{getDriverLink(v)}</div>
                                    </div>
                                    <div style={{ display:'flex', flexDirection:'column', gap:'0.35rem', flexShrink:0 }}>
                                        <button onClick={() => startEditVehicle(v)} style={iconBtn('#0066cc')}>編集</button>
                                        <button onClick={() => navigator.clipboard.writeText(getDriverLink(v))} style={iconBtn('#333')}>Copy</button>
                                        <button onClick={() => handleDeleteVehicle(v.id)} style={{ ...iconBtn('transparent'), color:'#cc4444', border:'1px solid #cc4444' }}>削除</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ════════ SETTINGS ════════ */}
                {currentTab === 'settings' && (
                    <div>
                        <h2 style={{ fontSize:'1rem', margin:'0 0 1rem', color:'#4CAF50' }}>⚙️ 設定</h2>
                        <div style={{ background:'#1c1c1c', borderRadius:'12px', padding:'1.1rem' }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                                <div>
                                    <div style={{ fontWeight:'bold', fontSize:'0.9rem' }}>11:30 PM Slot</div>
                                    <div style={{ fontSize:'0.78rem', color:'#666', marginTop:'4px' }}>OFFで予約フォームから非表示</div>
                                </div>
                                <button onClick={handleToggle1130} style={{
                                    padding:'8px 20px', borderRadius:'20px', border:'none', fontWeight:'bold', cursor:'pointer',
                                    background: globalSettings.is1130Enabled ? '#4CAF50' : '#444',
                                    color:'white', minWidth:'70px', fontSize:'0.85rem',
                                }}>
                                    {globalSettings.is1130Enabled ? 'OPEN' : 'OFF'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* ── Bottom Tab Nav ── */}
            <div style={{
                position:'fixed', bottom:0, left:0, right:0,
                background:'#111', borderTop:'1px solid #2a2a2a',
                display:'flex', zIndex:900,
                paddingBottom:'env(safe-area-inset-bottom)',
                boxShadow:'0 -4px 12px rgba(0,0,0,0.5)',
            }}>
                {TABS.map(t => (
                    <button key={t.key} onClick={() => setCurrentTab(t.key)} style={{
                        flex:1, padding:'0.8rem 0', background:'transparent', border:'none', cursor:'pointer',
                        color:      currentTab === t.key ? t.color : '#555',
                        borderTop:  currentTab === t.key ? `3px solid ${t.color}` : '3px solid transparent',
                        display:'flex', flexDirection:'column', alignItems:'center', gap:'2px',
                        fontSize:'0.72rem', fontWeight:'bold',
                    }}>
                        <span style={{ fontSize:'1.1rem' }}>{t.icon}</span>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ── Availability Slot Modal ── */}
            {editingDate && (
                <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}
                    onClick={() => setEditingDate(null)}>
                    <div style={{ background:'white', padding:'1.5rem', borderRadius:'16px', width:'88%', maxWidth:'380px', color:'#333' }}
                        onClick={e => e.stopPropagation()}>
                        <h3 style={{ margin:'0 0 0.3rem', fontSize:'1rem' }}>{editingTourType}</h3>
                        <p style={{ color:'#888', fontSize:'0.85rem', margin:'0 0 1rem' }}>{editingDate.toLocaleDateString('ja-JP')} の空き枠</p>
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px', marginBottom:'1rem' }}>
                            <button onClick={() => handleSaveSlots(0)} style={{ padding:'0.8rem', background:'#ffebee', color:'#E60012', border:'2px solid #E60012', borderRadius:'8px', fontWeight:'bold', cursor:'pointer' }}>FULL</button>
                            {[1,2,3,4,5].map(n => (
                                <button key={n} onClick={() => handleSaveSlots(n)} style={{ padding:'0.8rem', background:'#f5f5f5', color:'#333', border:'1px solid #ddd', borderRadius:'8px', fontWeight:'bold', cursor:'pointer' }}>{n}</button>
                            ))}
                        </div>
                        <div style={{ display:'flex', gap:'0.5rem' }}>
                            <button onClick={() => handleSaveSlots(null)} style={{ flex:1, padding:'0.7rem', background:'transparent', border:'1px dashed #aaa', color:'#888', borderRadius:'8px', cursor:'pointer', fontSize:'0.85rem' }}>リセット</button>
                            <button onClick={() => setEditingDate(null)} style={{ flex:1, padding:'0.7rem', background:'#333', border:'none', color:'white', borderRadius:'8px', cursor:'pointer', fontSize:'0.85rem' }}>閉じる</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Booking Edit Modal ── */}
            {selectedBooking && (
                <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}
                    onClick={() => setSelectedBooking(null)}>
                    <div style={{ background:'white', borderRadius:'16px', width:'94%', maxWidth:'520px', maxHeight:'92vh', overflowY:'auto', color:'#222' }}
                        onClick={e => e.stopPropagation()}>

                        {/* Modal Header */}
                        <div style={{ padding:'1rem 1.2rem 0.8rem', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, background:'white', zIndex:1 }}>
                            <div>
                                <div style={{ fontWeight:'bold', fontSize:'1rem' }}>
                                    {selectedBooking === 'new' ? '＋ 手動予約を作成' : '予約を編集'}
                                </div>
                                <div style={{ fontSize:'0.78rem', color:'#888', marginTop:'2px' }}>
                                    {selectedBooking === 'new' ? 'DM / 電話 / メールなどからの予約' : formatDate(selectedBooking)}
                                </div>
                            </div>
                            <button onClick={() => setSelectedBooking(null)} style={{ background:'none', border:'none', fontSize:'1.4rem', cursor:'pointer', color:'#aaa', padding:'0 4px' }}>×</button>
                        </div>

                        <div style={{ padding:'1rem 1.2rem', display:'flex', flexDirection:'column', gap:'0.9rem' }}>

                            {/* ── Change Log ── */}
                            {selectedBooking !== 'new' && selectedBooking.changeLog?.length > 0 && (
                                <div style={{ background:'#f5f5f5', borderRadius:'8px', padding:'0.6rem 0.8rem', display:'flex', flexDirection:'column', gap:'0.4rem' }}>
                                    <div style={{ fontSize:'0.75rem', fontWeight:'bold', color:'#888', marginBottom:'0.2rem' }}>🕒 変更履歴</div>
                                    {[...selectedBooking.changeLog].reverse().map((entry, i) => (
                                        <div key={i} style={{ fontSize:'0.74rem', borderBottom:'1px solid #e8e8e8', paddingBottom:'0.3rem' }}>
                                            <span style={{ color:'#aaa' }}>
                                                {entry.at ? new Date(entry.at).toLocaleString('ja-JP', { month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit' }) : ''}
                                            </span>
                                            <span style={{ marginLeft:'6px', fontWeight:'bold', color:'#555' }}>{entry.field}</span>
                                            <span style={{ color:'#cc4444', marginLeft:'4px' }}>{entry.from}</span>
                                            <span style={{ color:'#aaa', margin:'0 4px' }}>→</span>
                                            <span style={{ color:'#2e7d32' }}>{entry.to}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* ── Admin section ── */}
                            <SectionLabel>管理情報</SectionLabel>
                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.6rem' }}>
                                <Field label="ステータス">
                                    <select value={editForm.status} onChange={e => setEditForm(f => ({...f, status:e.target.value}))} style={selectLight}>
                                        {['Pending','Confirmed','Completed','Canceled'].map(s => <option key={s}>{s}</option>)}
                                    </select>
                                </Field>
                                <Field label="現金回収">
                                    <button onClick={() => setEditForm(f => ({...f, cashCollected:!f.cashCollected}))} style={{
                                        width:'100%', padding:'8px', borderRadius:'6px', border:'none', fontWeight:'bold', cursor:'pointer',
                                        background: editForm.cashCollected ? '#d4edda' : '#f8d7da',
                                        color:      editForm.cashCollected ? '#155724' : '#721c24',
                                    }}>
                                        {editForm.cashCollected ? '✅ 回収済' : '❌ 未回収'}
                                    </button>
                                </Field>
                            </div>
                            {/* ── 車両 動的リスト ── */}
                            <Field label="車両 / ドライバー">
                                <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                                    {(editForm.assignedVehicles || []).map((slot, idx) => (
                                        <div key={idx} style={{ display:'flex', gap:'0.4rem', alignItems:'center' }}>
                                            <div style={{ flex:1, display:'flex', flexDirection:'column', gap:'3px' }}>
                                                <select value={slot.vehicleId}
                                                    onChange={e => {
                                                        const v = vehicles.find(x => x.id === e.target.value);
                                                        setEditForm(f => {
                                                            const av = [...f.assignedVehicles];
                                                            av[idx] = { vehicleId: e.target.value, custom: v ? (v.slug||v.id) : av[idx].custom };
                                                            return { ...f, assignedVehicles: av };
                                                        });
                                                    }} style={selectLight}>
                                                    <option value="">— 選択 —</option>
                                                    {sortedVehicles.map(v => {
                                                        const avail = checkVehicleAvail(v.id, editForm.date, editForm.tourType);
                                                        const prefix = avail === true ? '⭕ ' : '';
                                                        return (
                                                            <option key={v.id} value={v.id}>
                                                                {prefix}{v.slug || v.id}{v.name ? ` — ${v.name}` : ''}
                                                            </option>
                                                        );
                                                    })}
                                                </select>
                                                <input type="text" value={slot.custom}
                                                    placeholder="リストにない場合は直接入力..."
                                                    onChange={e => setEditForm(f => {
                                                        const av = [...f.assignedVehicles];
                                                        av[idx] = { vehicleId: '', custom: e.target.value };
                                                        return { ...f, assignedVehicles: av };
                                                    })}
                                                    style={{ ...inputLight, fontSize:'0.82rem' }} />
                                            </div>
                                            <button type="button"
                                                onClick={() => setEditForm(f => ({ ...f, assignedVehicles: f.assignedVehicles.filter((_,i) => i !== idx) }))}
                                                style={{ padding:'6px 10px', borderRadius:'6px', border:'none', background:'#fdecea', color:'#c62828', cursor:'pointer', fontWeight:'bold', flexShrink:0 }}>✕</button>
                                        </div>
                                    ))}
                                    <button type="button"
                                        onClick={() => setEditForm(f => ({ ...f, assignedVehicles: [...(f.assignedVehicles||[]), { vehicleId:'', custom:'' }] }))}
                                        style={{ padding:'7px', borderRadius:'6px', border:'1px dashed #aaa', background:'#f9f9f9', color:'#555', cursor:'pointer', fontSize:'0.82rem', fontWeight:'bold' }}>
                                        ＋ 車両を追加
                                    </button>
                                </div>
                            </Field>
                            <Field label="管理メモ（内部）">
                                <textarea value={editForm.adminNote} rows="2" onChange={e => setEditForm(f => ({...f, adminNote:e.target.value}))} style={{ ...inputLight, resize:'vertical' }} />
                            </Field>

                            {/* ── Tour section ── */}
                            <SectionLabel>ツアー情報</SectionLabel>
                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.6rem' }}>
                                <Field label="ツアー日">
                                    <input type="date" value={editForm.date} onChange={e => setEditForm(f => ({...f, date:e.target.value}))} style={inputLight} />
                                </Field>
                                <Field label="人数">
                                    <input type="number" value={editForm.guests} min="1" max="20" onChange={e => setEditForm(f => ({...f, guests:e.target.value}))} style={inputLight} />
                                </Field>
                            </div>
                            <Field label="プラン">
                                <select value={editForm.tourType} onChange={e => setEditForm(f => ({...f, tourType:e.target.value}))} style={selectLight}>
                                    {['Standard Plan','Morning Plan','Midnight 8:30PM','Midnight 11:30PM'].map(t => <option key={t}>{t}</option>)}
                                </select>
                            </Field>

                            {/* ── Customer section ── */}
                            <SectionLabel>お客様情報</SectionLabel>
                            <Field label="流入元（どこから予約？）">
                                <select value={editForm.source || 'stripe'} onChange={e => setEditForm(f => ({...f, source:e.target.value}))} style={selectLight}>
                                    <option value="stripe">💳 Stripe（ウェブ）</option>
                                    <option value="instagram">📸 Instagram DM</option>
                                    <option value="whatsapp">💬 WhatsApp</option>
                                    <option value="email">📧 Email</option>
                                    <option value="phone">📞 Phone</option>
                                    <option value="walkin">🚶 Walk-in</option>
                                    <option value="manual">📝 その他手動</option>
                                </select>
                            </Field>
                            {[
                                { label:'名前',                     key:'name',      type:'text' },
                                { label:'Email',                    key:'email',     type:'email' },
                                { label:'Instagram',               key:'instagram', type:'text' },
                                { label:'WhatsApp',                key:'whatsapp',  type:'text' },
                                { label:'ホテル / ピックアップ場所', key:'hotel',     type:'text' },
                            ].map(({ label, key, type }) => (
                                <Field key={key} label={label}>
                                    <input type={type} value={editForm[key]} onChange={e => setEditForm(f => ({...f, [key]:e.target.value}))} style={inputLight} />
                                </Field>
                            ))}
                            {editForm.remarks && (
                                <Field label="お客様の備考">
                                    <div style={{ background:'#fff3cd', padding:'0.6rem', borderRadius:'6px', fontSize:'0.85rem', lineHeight:'1.5' }}>{editForm.remarks}</div>
                                </Field>
                            )}

                            {/* ── Financials ── */}
                            <SectionLabel>金額</SectionLabel>
                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.6rem' }}>
                                <Field label="合計金額 (¥)">
                                    <input type="number" value={editForm.totalToken} onChange={e => setEditForm(f => ({...f, totalToken:e.target.value}))} style={inputLight} />
                                </Field>
                                <Field label="デポジット (¥)">
                                    <input type="number" value={editForm.deposit} onChange={e => setEditForm(f => ({...f, deposit:e.target.value}))} style={inputLight} />
                                </Field>
                            </div>


                            {/* ── Meta ── */}
                            {selectedBooking !== 'new' && (
                                <div style={{ background:'#f9f9f9', borderRadius:'8px', padding:'0.7rem', fontSize:'0.73rem', color:'#aaa', lineHeight:'1.7' }}>
                                    <div>予約ID: {selectedBooking.id}</div>
                                    <div>作成: {selectedBooking.timestamp?.toDate ? selectedBooking.timestamp.toDate().toLocaleString('ja-JP') : '—'}</div>
                                    <div>PaymentIntent: {selectedBooking.paymentIntentId || '—'}</div>
                                </div>
                            )}

                        </div>

                        {/* Modal Footer */}
                        <div style={{ padding:'0.8rem 1.2rem 1.2rem', display:'flex', gap:'0.5rem', borderTop:'1px solid #eee', position:'sticky', bottom:0, background:'white' }}>
                            <button onClick={handleSave} disabled={isSaving} style={{
                                flex:3, padding:'0.9rem', background: selectedBooking === 'new' ? '#2e7d32' : '#0066cc',
                                color:'white', border:'none', borderRadius:'8px', fontWeight:'bold',
                                cursor: isSaving ? 'not-allowed' : 'pointer',
                                opacity: isSaving ? 0.7 : 1, fontSize:'0.95rem',
                            }}>
                                {isSaving ? '保存中...' : selectedBooking === 'new' ? '✅ 予約を作成' : '💾 保存'}
                            </button>
                            {selectedBooking !== 'new' && (
                                <button onClick={handleDelete} disabled={isDeleting} style={{
                                    flex:1, padding:'0.9rem', background:'transparent', color:'#cc0000',
                                    border:'1px solid #cc0000', borderRadius:'8px', fontWeight:'bold',
                                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                                }}>
                                    {isDeleting ? '...' : '🗑️'}
                                </button>
                            )}
                            <button onClick={() => setSelectedBooking(null)} style={{
                                flex:1, padding:'0.9rem', background:'#f0f0f0', color:'#333',
                                border:'none', borderRadius:'8px', fontWeight:'bold', cursor:'pointer',
                            }}>
                                閉じる
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

// ── Small helpers ─────────────────────────────────────────────────────────────

const SectionLabel = ({ children }) => (
    <div style={{ fontSize:'0.68rem', fontWeight:'bold', color:'#aaa', textTransform:'uppercase', letterSpacing:'1.5px', marginTop:'0.2rem' }}>{children}</div>
);

const Field = ({ label, children }) => (
    <div>
        <label style={{ display:'block', fontSize:'0.75rem', color:'#888', marginBottom:'3px' }}>{label}</label>
        {children}
    </div>
);

export default AdminDashboard;
