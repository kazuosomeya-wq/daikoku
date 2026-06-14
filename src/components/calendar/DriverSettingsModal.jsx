import React, { useState, useEffect } from 'react';
import { collection, query, doc, updateDoc, arrayUnion, setDoc, deleteDoc, getDocs, where } from 'firebase/firestore';
import { db } from '../../firebase';

const DriverSettingsModal = ({
    showSettingsModal,
    setShowSettingsModal,
    vehiclesList
}) => {
    const [tempNicknames, setTempNicknames] = useState({});
    const [newVehicleId, setNewVehicleId] = useState('');
    const [newVehicleName, setNewVehicleName] = useState('');
    const [newVehicleSlug, setNewVehicleSlug] = useState('');
    const [newVehicleNick, setNewVehicleNick] = useState('');

    useEffect(() => {
        if (showSettingsModal) {
            const temp = {};
            vehiclesList.forEach(v => {
                temp[v.id] = v.driverNickname || '';
            });
            setTempNicknames(temp);
        }
    }, [showSettingsModal, vehiclesList]);

    if (!showSettingsModal) return null;

    // Save nicknames to Firestore
    const handleSaveSettings = async () => {
        try {
            const savePromises = Object.entries(tempNicknames).map(async ([vehicleId, nickname]) => {
                const vehicleDocRef = doc(db, "vehicles", vehicleId);
                const vInfo = vehiclesList.find(v => v.id === vehicleId);
                const name = vInfo ? vInfo.name : 'Unknown Vehicle';
                const slug = vInfo ? vInfo.slug : '';
                
                const oldNickname = vInfo ? (vInfo.driverNickname || '').trim() : '';
                const newNickname = nickname.trim();
                
                await setDoc(vehicleDocRef, {
                    name: name,
                    slug: slug,
                    driverNickname: newNickname
                }, { merge: true });

                // あだ名が変更された場合、過去の予約データの vehicleName1 も一括更新する
                if (oldNickname && oldNickname !== newNickname && newNickname !== '') {
                    const bookingsRef = collection(db, "bookings");
                    const q = query(bookingsRef, where("vehicleName1", "==", oldNickname));
                    const snap = await getDocs(q);
                    
                    if (!snap.empty) {
                        const updatePromises = snap.docs.map(bDoc => {
                            const historyEntry = {
                                timestamp: new Date().toISOString(),
                                changes: [{
                                    field: 'vehicleName1',
                                    label: '車両 / ドライバー名',
                                    old: oldNickname,
                                    new: newNickname,
                                    note: 'ドライバーあだ名設定の一括変更による自動更新'
                                }]
                            };
                            return updateDoc(bDoc.ref, { 
                                vehicleName1: newNickname,
                                changeHistory: arrayUnion(historyEntry)
                            });
                        });
                        await Promise.all(updatePromises);
                    }
                }
            });

            await Promise.all(savePromises);
            setShowSettingsModal(false);
            alert("ドライバーのあだ名設定を保存し、関連する予約もすべて更新しました！");
        } catch (error) {
            console.error("Error saving nicknames:", error);
            alert("保存に失敗しました: " + error.message);
        }
    };

    // 新規カスタムドライバー/車両をFirestoreへ追加
    const handleAddVehicle = async (e) => {
        e.preventDefault();
        
        const id = newVehicleId.trim();
        const name = newVehicleName.trim();
        const slug = newVehicleSlug.trim();
        const nick = newVehicleNick.trim();
        
        if (!id || !name || !nick) {
            alert("車両ID、車両名、ドライバーあだ名は必須です。");
            return;
        }
        
        // IDの半角英数字チェック (小文字、大文字、数字、ハイフン、アンダースコア)
        if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
            alert("車両IDは半角英数字、ハイフン、アンダースコアのみ使用できます。");
            return;
        }
        
        // 重複チェック
        if (vehiclesList.some(v => v.id.toLowerCase() === id.toLowerCase())) {
            alert("この車両IDは既に存在します。別のIDを指定してください。");
            return;
        }
        
        try {
            const vehicleDocRef = doc(db, "vehicles", id);
            await setDoc(vehicleDocRef, {
                name: name,
                slug: slug,
                driverNickname: nick
            });
            
            // ローカルの編集一時データにも追記
            setTempNicknames(prev => ({
                ...prev,
                [id]: nick
            }));
            
            // フォームクリア
            setNewVehicleId('');
            setNewVehicleName('');
            setNewVehicleSlug('');
            setNewVehicleNick('');
            
            alert("新規ドライバー/車両を追加しました！");
        } catch (error) {
            console.error("Error adding vehicle:", error);
            alert("追加に失敗しました: " + error.message);
        }
    };

    // カスタムドライバー/車両をFirestoreから削除
    const handleDeleteVehicle = async (vehicleId) => {
        const systemIds = ['random-cars', 'random-r34', 'vehicle1', 'vehicle2', 'vehicle3', 'vehicle4'];
        if (systemIds.includes(vehicleId)) {
            alert("既定の標準車両は削除できません。");
            return;
        }
        
        if (!window.confirm("本当にこのドライバー/車両を削除しますか？")) {
            return;
        }
        
        try {
            await deleteDoc(doc(db, "vehicles", vehicleId));
            
            // 一時データからも削除
            setTempNicknames(prev => {
                const updated = { ...prev };
                delete updated[vehicleId];
                return updated;
            });
            
            alert("削除しました。");
        } catch (error) {
            console.error("Error deleting vehicle:", error);
            alert("削除に失敗しました: " + error.message);
        }
    };

    return (
        <div className="calendar-modal-overlay" onClick={() => setShowSettingsModal(false)}>
            <div className="calendar-modal-content nickname-settings-modal" onClick={e => e.stopPropagation()}>
                <button className="calendar-modal-close" onClick={() => setShowSettingsModal(false)}>×</button>
                <h3>⚙️ ドライバーあだ名設定</h3>
                <p className="settings-description">
                    ドライバーのあだ名を登録・管理します。<br />
                    ここで登録したあだ名は、詳細編集画面の「車両 / ドライバー名」にある入力補助ドロップダウンから簡単に選択して入力できます。（自動判別は行われません）
                </p>
                
                <div className="modal-body settings-body">
                    <table className="settings-table">
                        <thead>
                            <tr>
                                <th>車両・ドライバー情報</th>
                                <th>ドライバーのあだ名</th>
                                <th>アクション</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vehiclesList.filter(v => v.slug && v.slug.trim() !== '').map(v => {
                                const isSystem = ['random-cars', 'random-r34', 'vehicle1', 'vehicle2', 'vehicle3', 'vehicle4'].includes(v.id);
                                return (
                                    <tr key={v.id} className={isSystem ? 'system-vehicle-row' : 'custom-vehicle-row'}>
                                        <td className="vehicle-name-cell">
                                            <div className="vehicle-title-wrap">
                                                <strong>{v.name}</strong>
                                                <span className={`vehicle-type-tag ${isSystem ? 'type-system' : 'type-custom'}`}>
                                                    {isSystem ? '既定' : 'カスタム'}
                                                </span>
                                            </div>
                                            <div className="vehicle-badges">
                                                <span className="vehicle-id-badge">ID: {v.id}</span>
                                                {v.slug && (
                                                    <span className="vehicle-slug-badge">
                                                        Driver Portal: <code>{v.slug}</code>
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <input 
                                                type="text" 
                                                className="nickname-input"
                                                placeholder="例: かえ"
                                                value={tempNicknames[v.id] || ''} 
                                                onChange={e => setTempNicknames(prev => ({
                                                    ...prev,
                                                    [v.id]: e.target.value
                                                }))} 
                                            />
                                        </td>
                                        <td>
                                            {!isSystem ? (
                                                <button 
                                                    type="button" 
                                                    className="delete-vehicle-btn" 
                                                    onClick={() => handleDeleteVehicle(v.id)}
                                                    title="この車両を削除します"
                                                >
                                                    🗑️ 削除
                                                </button>
                                            ) : (
                                                <span className="system-protected-label">保護</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {/* 新規追加フォーム */}
                    <div className="add-vehicle-section">
                        <h4>➕ 新規ドライバー・車両の追加</h4>
                        <form onSubmit={handleAddVehicle} className="add-vehicle-form">
                            <div className="form-row-group">
                                <div className="form-group">
                                    <label>車両ID <span className="req">*</span></label>
                                    <input 
                                        type="text" 
                                        placeholder="例: vehicle5" 
                                        value={newVehicleId} 
                                        onChange={e => setNewVehicleId(e.target.value)} 
                                        required 
                                    />
                                    <small className="help-text">半角英数字・ハイフンのみ</small>
                                </div>
                                <div className="form-group">
                                    <label>車両名/表示名 <span className="req">*</span></label>
                                    <input 
                                        type="text" 
                                        placeholder="例: 550hp - RX-7 FD3S (White)" 
                                        value={newVehicleName} 
                                        onChange={e => setNewVehicleName(e.target.value)} 
                                        required 
                                    />
                                </div>
                            </div>
                            <div className="form-row-group">
                                <div className="form-group">
                                    <label>Driver Portal (slug)</label>
                                    <input 
                                        type="text" 
                                        placeholder="例: rx7-white" 
                                        value={newVehicleSlug} 
                                        onChange={e => setNewVehicleSlug(e.target.value)} 
                                    />
                                    <small className="help-text">URLの末尾になります（任意）</small>
                                </div>
                                <div className="form-group">
                                    <label>ドライバーあだ名 <span className="req">*</span></label>
                                    <input 
                                        type="text" 
                                        placeholder="例: なおと" 
                                        value={newVehicleNick} 
                                        onChange={e => setNewVehicleNick(e.target.value)} 
                                        required 
                                    />
                                </div>
                            </div>
                            <button type="submit" className="add-submit-btn">新規追加する</button>
                        </form>
                    </div>
                    
                    <div className="modal-actions">
                        <button className="save-btn" onClick={handleSaveSettings}>設定を保存</button>
                        <button className="cancel-btn" onClick={() => setShowSettingsModal(false)}>キャンセル</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DriverSettingsModal;
