import React from 'react';
import { format } from 'date-fns';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebase';

const BookingDetailModal = ({
    selectedEvent,
    setSelectedEvent,
    isEditing,
    setIsEditing,
    editData,
    setEditData,
    availableNicknames,
    closeModal
}) => {
    if (!selectedEvent) return null;

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
                { key: 'date', label: 'ツアー日程' },
                { key: 'customTitle', label: 'サブタイトル' },
                { key: 'name', label: '顧客名' },
                { key: 'tourType', label: 'プラン' },
                { key: 'guests', label: '人数', type: 'number' },
                { key: 'basePrice', label: 'ベース価格', type: 'number' },
                { key: 'optionsText', label: 'オプション内容' },
                { key: 'optionsPrice', label: 'オプション金額', type: 'number' },
                { key: 'nominationFee', label: '指名料', type: 'number' },
                { key: 'discount', label: '割引額', type: 'number' },
                { key: 'vehicleName1', label: '車両1 / ドライバー名' },
                { key: 'vehicleName2', label: '車両2 / ドライバー名' },
                { key: 'vehicleName3', label: '車両3 / ドライバー名' },
                { key: 'vehicleName4', label: '車両4 / ドライバー名' },
                { key: 'hotel', label: 'ホテル' },
                { key: 'totalToken', label: '総売上金額', type: 'number' },
                { key: 'deposit', label: 'デポジット支払額', type: 'number' },
                { key: 'driverFee', label: 'ドライバー依頼額', type: 'number' },
                { key: 'instagram', label: 'Instagram' },
                { key: 'whatsapp', label: 'WhatsApp' },
                { key: 'email', label: 'Email' },
                { key: 'remarks', label: '備考・メモ' }
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
                customTitle: editData.customTitle || '',
                name: editData.name,
                tourType: editData.tourType,
                guests: Number(editData.guests || 1),
                basePrice: Number(editData.basePrice || 0),
                optionsText: editData.optionsText || '',
                optionsPrice: Number(editData.optionsPrice || 0),
                nominationFee: Number(editData.nominationFee || 0),
                discount: Number(editData.discount || 0),
                vehicleName1: editData.vehicleName1,
                vehicleName2: editData.vehicleName2,
                vehicleName3: editData.vehicleName3,
                vehicleName4: editData.vehicleName4,
                hotel: editData.hotel,
                totalToken: Number(editData.totalToken),
                deposit: Number(editData.deposit),
                driverFee: Number(editData.driverFee || 0),
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
            alert("保存が完了しました！");
        } catch (error) {
            console.error("Error updating booking:", error);
            alert("保存に失敗しました: " + error.message);
        }
    };

    return (
        <div className="calendar-modal-overlay" onClick={closeModal}>
            <div className="calendar-modal-content" onClick={e => e.stopPropagation()}>
                <button className="calendar-modal-close" onClick={closeModal}>×</button>
                <h3>ブッキング詳細</h3>
                
                {isEditing ? (
                    <div className="modal-body edit-mode">
                        <div className="form-group">
                            <label style={{ color: '#E60012', fontWeight: 'bold' }}>Memo</label>
                            <textarea value={editData.remarks} onChange={e => handleInputChange('remarks', e.target.value)} rows={3} placeholder="例: 12時プラン希望、マージン渡し済みなど" />
                        </div>
                        <hr />
                        <div className="form-group">
                            <label>ツアー日程</label>
                            <input type="date" value={editData.date} onChange={e => handleInputChange('date', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>サブタイトル (タイトルの後ろに追加されます)</label>
                            <input type="text" placeholder="例: VIP対応、英語OK" value={editData.customTitle} onChange={e => handleInputChange('customTitle', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>顧客名</label>
                            <input type="text" value={editData.name} onChange={e => handleInputChange('name', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>プラン</label>
                            <div className="driver-input-hybrid-wrap">
                                <select 
                                    className="driver-nickname-select" 
                                    value="" 
                                    onChange={e => {
                                        if (e.target.value) handleInputChange('tourType', e.target.value);
                                        e.target.value = "";
                                    }}
                                    style={{ marginBottom: '8px' }}
                                >
                                    <option value="">-- 既存のプランから選択（入力補助） --</option>
                                    <option value="Standard Plan">Standard Plan</option>
                                    <option value="Midnight Plan">Midnight Plan</option>
                                    <option value="City Tour">City Tour</option>
                                </select>
                                <input 
                                    type="text" 
                                    placeholder="自由にプラン名を入力することもできます"
                                    value={editData.tourType || ''} 
                                    onChange={e => handleInputChange('tourType', e.target.value)} 
                                />
                            </div>
                        </div>
                        <div className="form-group" style={{ marginBottom: '15px' }}>
                            <label>人数</label>
                            <input type="number" value={editData.guests} onChange={e => handleInputChange('guests', e.target.value)} />
                        </div>

                        
                        <hr />
                        <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>💰 料金・支払い設定</h4>
                        <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e0e0e0' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <label style={{ margin: 0, whiteSpace: 'nowrap', minWidth: '85px', fontSize: '0.9rem' }}>ベース価格</label>
                                    <input type="number" style={{ margin: 0, flex: 1, padding: '6px' }} value={editData.basePrice} onChange={e => handleInputChange('basePrice', e.target.value)} />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <label style={{ margin: 0, whiteSpace: 'nowrap', minWidth: '85px', fontSize: '0.9rem' }}>オプション</label>
                                    <select 
                                        value={editData.optionsText || ""} 
                                        onChange={e => handleInputChange('optionsText', e.target.value)}
                                        style={{ margin: 0, width: '80px', padding: '6px', fontSize: '0.85rem' }}
                                    >
                                        <option value="">-</option>
                                        <option value="タワー">タワー</option>
                                        <option value="渋谷">渋谷</option>
                                        <option value="両方">両方</option>
                                        <option value="その他">その他</option>
                                    </select>
                                    <input type="number" placeholder="金額(¥)" style={{ margin: 0, width: '80px', padding: '6px' }} value={editData.optionsPrice} onChange={e => handleInputChange('optionsPrice', e.target.value)} />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <label style={{ margin: 0, whiteSpace: 'nowrap', minWidth: '85px', fontSize: '0.9rem' }}>指名料</label>
                                    <input type="number" style={{ margin: 0, flex: 1, padding: '6px' }} value={editData.nominationFee} onChange={e => handleInputChange('nominationFee', e.target.value)} />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <label style={{ margin: 0, whiteSpace: 'nowrap', minWidth: '85px', fontSize: '0.9rem' }}>割引額</label>
                                    <input type="number" style={{ margin: 0, flex: 1, padding: '6px' }} value={editData.discount} onChange={e => handleInputChange('discount', e.target.value)} />
                                </div>
                                <hr style={{ margin: '5px 0', borderTop: '1px dashed #ccc' }} />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                     <label style={{ margin: 0, whiteSpace: 'nowrap', minWidth: '85px', fontSize: '0.9rem', fontWeight: 'bold' }}>総売上金額</label>
                                     <input type="number" style={{ margin: 0, flex: 1, padding: '6px' }} value={editData.totalToken} onChange={e => handleInputChange('totalToken', e.target.value)} />
                                 </div>
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                     <label style={{ margin: 0, whiteSpace: 'nowrap', minWidth: '85px', fontSize: '0.9rem' }}>デポジット</label>
                                     <input type="number" style={{ margin: 0, flex: 1, padding: '6px' }} value={editData.deposit} onChange={e => handleInputChange('deposit', e.target.value)} />
                                 </div>
                            </div>
                             
                             {/* 計算パネルとドライバー依頼額入力欄 */}
                             <div className="calculation-panel" style={{ marginTop: '15px' }}>
                                 <div className="calculation-row">
                                     <strong style={{ fontSize: '0.9rem' }}>現金受け取り額 (残金):</strong>
                                     <span style={{ fontWeight: 'bold', color: '#c62828' }}>¥{(Number(editData.totalToken || 0) - Number(editData.deposit || 0)).toLocaleString()}</span>
                                 </div>
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', marginBottom: '10px' }}>
                                     <label style={{ margin: 0, fontSize: '0.9rem', color: '#666', whiteSpace: 'nowrap' }}>ドライバー依頼額</label>
                                     <input type="number" style={{ margin: 0, flex: 1, padding: '6px' }} value={editData.driverFee || 0} onChange={e => handleInputChange('driverFee', e.target.value)} />
                                 </div>
                                 <div className="calculation-row profit">
                                     <strong style={{ fontSize: '0.9rem' }}>マージン:</strong>
                                     <span style={{ fontSize: '1.1rem' }}>¥{((Number(editData.totalToken || 0) - Number(editData.deposit || 0)) - Number(editData.driverFee || 0)).toLocaleString()}</span>
                                 </div>
                             </div>
                        </div>
                        {(() => {
                            const fields = [
                                { key: 'vehicleName1', label: '車両1 / ドライバー名' }
                            ];
                            if (editData.vehicleName2 || editData.vehicleName3 || editData._showSlot2) {
                                fields.push({ key: 'vehicleName2', label: '車両2 / ドライバー名' });
                            }
                            if (editData.vehicleName3 || editData._showSlot3 || editData.vehicleName4 || editData._showSlot4) {
                                fields.push({ key: 'vehicleName3', label: '車両3 / ドライバー名' });
                            }
                            if (editData.vehicleName4 || editData._showSlot4) {
                                fields.push({ key: 'vehicleName4', label: '車両4 / ドライバー名' });
                            }
                            return (
                                <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #eee' }}>
                                    {fields.map((field, idx) => (
                                        <div className="form-group" key={field.key} style={{ marginBottom: '15px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                                <label style={{ margin: 0 }}>{field.label}</label>
                                                {idx > 0 && (
                                                    <button type="button" 
                                                        onClick={() => {
                                                            handleInputChange(field.key, '');
                                                            handleInputChange(field.key === 'vehicleName2' ? '_showSlot2' : field.key === 'vehicleName3' ? '_showSlot3' : '_showSlot4', false);
                                                        }}
                                                        style={{ padding: '2px 6px', fontSize: '0.7rem', color: '#c62828', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                                                        ✕ クリア
                                                    </button>
                                                )}
                                            </div>
                                            <div className="driver-input-hybrid-wrap">
                                                <select 
                                                    className="driver-nickname-select" 
                                                    value="" 
                                                    onChange={e => {
                                                        handleInputChange(field.key, e.target.value);
                                                        e.target.value = ""; // 選択後に表示をリセット
                                                    }}
                                                    style={{ marginBottom: '8px' }}
                                                >
                                                    <option value="">-- ドライバー一覧から選択（入力補助） --</option>
                                                    {availableNicknames.map(nick => (
                                                        <option key={nick} value={nick}>{nick}</option>
                                                    ))}
                                                </select>
                                                <input 
                                                    type="text" 
                                                    placeholder="ドライバー名や指名車両を入力してください"
                                                    value={editData[field.key] || ''} 
                                                    onChange={e => handleInputChange(field.key, e.target.value)} 
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    {fields.length < 4 && (
                                        <button type="button" 
                                            onClick={() => handleInputChange(fields.length === 1 ? '_showSlot2' : fields.length === 2 ? '_showSlot3' : '_showSlot4', true)}
                                            style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '4px', border: '1px dashed #aaa', background: 'transparent', cursor: 'pointer', display: 'block', width: '100%' }}>
                                            ＋ さらに車両を追加
                                        </button>
                                    )}
                                </div>
                            );
                        })()}
                        <div className="form-group">
                            <label>ホテル</label>
                            <input type="text" value={editData.hotel} onChange={e => handleInputChange('hotel', e.target.value)} />
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
                            <label>メールアドレス</label>
                            <input type="email" value={editData.email} onChange={e => handleInputChange('email', e.target.value)} />
                        </div>
                        
                        <div className="modal-actions">
                            <button className="save-btn" onClick={handleSave}>変更を保存</button>
                            <button className="cancel-btn" onClick={() => setIsEditing(false)}>キャンセル</button>
                        </div>
                    </div>
                ) : (
                    <div className="modal-body">
                        {selectedEvent.remarks && (
                            <div style={{ background: '#fff9c4', padding: '10px', borderRadius: '4px', marginBottom: '15px', borderLeft: '4px solid #fbc02d' }}>
                                <strong>備考・メモ:</strong> <span style={{ whiteSpace: 'pre-wrap' }}>{selectedEvent.remarks}</span>
                            </div>
                        )}
                        <p><strong>ツアー日程:</strong> {selectedEvent.date}</p>
                        <p><strong>カレンダー表示名:</strong> {selectedEvent.generatedTitle} {selectedEvent.customTitle ? `- ${selectedEvent.customTitle}` : ''}</p>
                        <p><strong>顧客名:</strong> {selectedEvent.name}</p>
                        <p><strong>プラン:</strong> {selectedEvent.tourType}</p>
                        <p><strong>人数:</strong> {selectedEvent.guests || 1}名</p>

                        {selectedEvent.vehicleName2 || selectedEvent.vehicleName3 || selectedEvent.vehicleName4 ? (
                            <div style={{ background: '#f5f5f5', padding: '8px', borderRadius: '4px', marginBottom: '10px', marginTop: '10px' }}>
                                <p style={{ margin: '0 0 4px 0' }}><strong>車両1 / ドライバー:</strong> {selectedEvent.vehicleName1 || selectedEvent.vehicleName || '未設定'}</p>
                                {selectedEvent.vehicleName2 && <p style={{ margin: '0 0 4px 0' }}><strong>車両2 / ドライバー:</strong> {selectedEvent.vehicleName2}</p>}
                                {selectedEvent.vehicleName3 && <p style={{ margin: '0 0 4px 0' }}><strong>車両3 / ドライバー:</strong> {selectedEvent.vehicleName3}</p>}
                                {selectedEvent.vehicleName4 && <p style={{ margin: 0 }}><strong>車両4 / ドライバー:</strong> {selectedEvent.vehicleName4}</p>}
                            </div>
                        ) : (
                            <p style={{ marginTop: '10px' }}>
                                <strong>車両 / ドライバー:</strong> {selectedEvent.resolvedDriverName || selectedEvent.vehicleName1 || selectedEvent.vehicleName}
                                {selectedEvent.vehicleName1 && selectedEvent.vehicleName1 !== (selectedEvent.resolvedDriverName || selectedEvent.vehicleName1) && (
                                    <span style={{ fontSize: '0.85rem', color: '#666', marginLeft: '8px' }}>
                                        ({selectedEvent.vehicleName1})
                                    </span>
                                )}
                            </p>
                        )}
                        <p><strong>ホテル:</strong> {selectedEvent.hotel}</p>
                        <hr />
                        <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>💰 支払い・料金内訳</h4>
                        <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '6px', border: '1px solid #e0e0e0', marginBottom: '15px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                                <p style={{ margin: 0 }}><strong>ベース価格:</strong> ¥{(selectedEvent.basePrice || 0).toLocaleString()}</p>
                                <p style={{ margin: 0 }}><strong>オプション:</strong> ¥{(selectedEvent.optionsPrice || 0).toLocaleString()} <span style={{ color: '#555', fontSize: '0.9em' }}>{selectedEvent.optionsText ? `(${selectedEvent.optionsText})` : ''}</span></p>
                                <p style={{ margin: 0 }}><strong>指名料:</strong> ¥{(selectedEvent.nominationFee || 0).toLocaleString()}</p>
                                <p style={{ margin: 0, color: '#c62828' }}><strong>割引額:</strong> -¥{(selectedEvent.discount || 0).toLocaleString()}</p>
                            </div>
                            <hr style={{ margin: '0 0 12px 0', borderTop: '1px dashed #ccc' }} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <p style={{ margin: 0 }}><strong>総売上金額:</strong> ¥{(selectedEvent.totalToken || selectedEvent.totalAmount || 0).toLocaleString()}</p>
                                <p style={{ margin: 0 }}><strong>デポジット:</strong> ¥{(selectedEvent.deposit || 0).toLocaleString()}</p>
                            </div>
                            <p style={{ color: 'red', fontWeight: 'bold', margin: '12px 0' }}><strong>現地回収残金 (現金受け取り):</strong> ¥{((selectedEvent.totalToken || selectedEvent.totalAmount || 0) - (selectedEvent.deposit || 0)).toLocaleString()}</p>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: '#e8f5e9', padding: '8px', borderRadius: '4px' }}>
                                <p style={{ margin: 0 }}><strong>依頼額:</strong> ¥{(selectedEvent.driverFee || 0).toLocaleString()}</p>
                                <p style={{ color: '#2e7d32', fontWeight: 'bold', margin: 0 }}><strong>マージン:</strong> ¥{((selectedEvent.totalToken || selectedEvent.totalAmount || 0) - (selectedEvent.deposit || 0) - (selectedEvent.driverFee || 0)).toLocaleString()}</p>
                            </div>
                        </div>
                        <hr />
                        <p><strong>Instagram:</strong> {selectedEvent.instagram || '未設定'}</p>
                        <p><strong>WhatsApp:</strong> {selectedEvent.whatsapp || '未設定'}</p>
                        <p><strong>メールアドレス:</strong> {selectedEvent.email || '未設定'}</p>
                        
                        {selectedEvent.changeHistory && selectedEvent.changeHistory.length > 0 && (
                            <>
                                <hr />
                                <h4 style={{ margin: '15px 0 10px 0', fontSize: '1rem', color: '#333' }}>変更履歴</h4>
                                <div className="change-history-timeline">
                                    {selectedEvent.changeHistory.slice().reverse().map((h, idx) => (
                                        <div key={idx} className="timeline-item">
                                            <div className="timeline-time">
                                                {format(new Date(h.timestamp), 'yyyy/MM/dd HH:mm')}
                                            </div>
                                            <ul className="timeline-changes">
                                                {h.changes.map((c, cIdx) => (
                                                    <li key={cIdx}>
                                                        <strong>{c.label}:</strong> {c.old || '(空欄)'} → {c.new || '(空欄)'}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        <div className="modal-actions">
                            <button className="edit-btn" onClick={() => setIsEditing(true)}>詳細を編集</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingDetailModal;
