import React from 'react';
import { format, isSameDay } from 'date-fns';
import { ja } from 'date-fns/locale/ja';
import { PLAN_META } from '../../utils/planMeta';

const DayListSheet = ({
    showDayList,
    setShowDayList,
    selectedDate,
    events,
    vehiclesList,
    handleSelectEvent
}) => {
    if (!showDayList || !selectedDate) return null;

    const dayEvents = events.filter(e => isSameDay(new Date(e.start), selectedDate));

    return (
        <div className="day-list-overlay" onClick={() => setShowDayList(false)}>
            <div className="day-list-sheet" onClick={e => e.stopPropagation()}>
                {/* ボトムシートのドラッグ用バー */}
                <div className="sheet-drag-bar" onClick={() => setShowDayList(false)}></div>
                
                <header className="sheet-header">
                    <h3>{format(selectedDate, 'M月d日 EEEE', { locale: ja })}</h3>
                    <button className="sheet-close-btn" onClick={() => setShowDayList(false)}>×</button>
                </header>

                <div className="sheet-content">
                    {dayEvents.length === 0 ? (
                        <div className="no-events-placeholder">予定はありません</div>
                    ) : (() => {
                        const getSortWeight = (event) => {
                            const t = event.title || '';
                            if (t.startsWith('①')) return 1;
                            if (t.startsWith('②')) return 2;
                            return 3; // その他
                        };
                        const getTimestamp = (event) => {
                            const ts = event.resource?.timestamp;
                            if (!ts) return 0;
                            if (ts.toDate) return ts.toDate().getTime();
                            return new Date(ts).getTime();
                        };
                        const sortedDayEvents = [...dayEvents].sort((a, b) => {
                            const wA = getSortWeight(a);
                            const wB = getSortWeight(b);
                            if (wA !== wB) return wA - wB;
                            return getTimestamp(a) - getTimestamp(b);
                        });

                        return (
                            <div className="sheet-events-list">
                                {sortedDayEvents.map((event, index) => {
                                    const currentWeight = getSortWeight(event);
                                    const prevWeight = index > 0 ? getSortWeight(sortedDayEvents[index - 1]) : null;
                                    const isNewGroup = currentWeight !== prevWeight;

                                    let groupHeaderStr = '';
                                    if (currentWeight === 1) groupHeaderStr = '① 第1部';
                                    else if (currentWeight === 2) groupHeaderStr = '② 第2部';
                                    else groupHeaderStr = 'その他';

                                    const tourType = event.resource?.tourType || '';
                                    const meta = PLAN_META[tourType] || PLAN_META[event.resource?.tourType?.replace(' Plan', ' Tour')] || { color: '#888', label: tourType || '?' };
                                    
                                    const vDataList = event.resource?.vehiclesData || [{
                                        resolvedDriverName: event.resource?.resolvedDriverName,
                                        resolvedVid: event.resource?.resolvedVid || event.resource?.options?.selectedVehicle || event.resource?.vehicleId || '',
                                        originalRequestStr: event.resource?.originalRequestStr || event.resource?.vehicleName || event.resource?.options?.selectedVehicle || ''
                                    }];

                                    const renderedAvatars = vDataList.map((vData, vIndex) => {
                                        let matchedVehicle = null;
                                        const resolvedName = String(vData.resolvedDriverName || '').toLowerCase().replace(/\s+/g, '');
                                        
                                        if (resolvedName) {
                                            matchedVehicle = vehiclesList.find(v => {
                                                const vNameNorm = String(v.driverNickname || '').toLowerCase().replace(/\s+/g, '');
                                                return vNameNorm && (resolvedName === vNameNorm || resolvedName.includes(vNameNorm) || vNameNorm.includes(resolvedName));
                                            });
                                        }

                                        let vid = String(vData.resolvedVid || '');
                                        
                                        const originalRequestStr = String(vData.originalRequestStr || '');
                                        const normOrig = originalRequestStr.toLowerCase().replace(/[\s-]/g, '');
                                        const isOriginallyRandomCar = normOrig.includes('randomcar') || normOrig.includes('randomany');
                                        const isOriginallyRandomR34 = normOrig.includes('randomr34');

                                        if (!matchedVehicle && vid) {
                                            if (vid.includes('_')) vid = vid.split('_')[0];
                                            matchedVehicle = vehiclesList.find(v => v.id === vid);
                                        }

                                        let avatarImg = null;
                                        const checkStr = String(resolvedName || vid || '').toLowerCase();
                                        let resolvedVidForAvatar = matchedVehicle ? matchedVehicle.id : vid;

                                        if (matchedVehicle && matchedVehicle.imageUrl && !matchedVehicle.imageUrl.includes('placehold.co')) {
                                            avatarImg = matchedVehicle.imageUrl;
                                        } else {
                                            if (checkStr.includes('randomcar') || checkStr.includes('random-car')) {
                                                resolvedVidForAvatar = 'random-cars';
                                            }
                                            else if (checkStr.includes('randomr34') || checkStr.includes('random-r34')) {
                                                resolvedVidForAvatar = 'random-r34';
                                            }
                                            else if (checkStr.includes('vehicle1') || checkStr.includes('standard1')) resolvedVidForAvatar = 'vehicle1';
                                            else if (checkStr.includes('vehicle2') || checkStr.includes('standard2')) resolvedVidForAvatar = 'vehicle2';
                                            else if (checkStr.includes('vehicle3') || checkStr.includes('standard3')) resolvedVidForAvatar = 'vehicle3';
                                            else if (checkStr.includes('vehicle4') || checkStr.includes('standard4')) resolvedVidForAvatar = 'vehicle4';
                                        }

                                        return (
                                            <div key={vIndex} className="event-avatar-container" style={{ borderColor: meta.color, position: 'relative', marginLeft: vIndex > 0 ? '6px' : '0' }}>
                                                {avatarImg ? (
                                                    <>
                                                        <img src={avatarImg} alt="driver" className="event-avatar-img" loading="lazy" decoding="async" />
                                                        {isOriginallyRandomCar && <div className="avatar-badge-overlay">🎲car</div>}
                                                        {isOriginallyRandomR34 && <div className="avatar-badge-overlay">🎲34</div>}
                                                    </>
                                                ) : (() => {
                                                    let fallbackContent = '?';
                                                    let bgColor = meta.color;
                                                    let isGray = false;

                                                    if (resolvedVidForAvatar === 'random-cars') {
                                                        fallbackContent = '🎲car';
                                                        isGray = true;
                                                    } else if (resolvedVidForAvatar === 'random-r34') {
                                                        fallbackContent = '🎲34';
                                                        isGray = true;
                                                    } else if (['vehicle1', 'vehicle2', 'vehicle3', 'vehicle4'].includes(resolvedVidForAvatar)) {
                                                        fallbackContent = resolvedVidForAvatar.replace('vehicle', 'V');
                                                        isGray = true;
                                                    } else {
                                                        const rawNick = vData.resolvedDriverName || '';
                                                        const cleanNick = rawNick.replace(/^(①|②|③|☀️|🏙️|🌙|\(Moved\)\s*)+/g, '').trim();
                                                        if (cleanNick && cleanNick.length > 0) {
                                                            fallbackContent = cleanNick.charAt(0);
                                                        }
                                                    }

                                                    if (isGray) bgColor = '#9ca3af';

                                                    return (
                                                        <div className="event-avatar-fallback" style={{ backgroundColor: bgColor, fontSize: fallbackContent.length > 1 ? '0.65rem' : '1.1rem' }}>
                                                            {fallbackContent}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        );
                                    });

                                    // サブテキストの作成
                                    const guestName = event.resource?.name || 'No Name';
                                    const customTitle = event.resource?.customTitle || '';
                                    const guestCount = event.resource?.guests || 1;
                                    const hotel = event.resource?.hotel || '';
                                    const remarks = event.resource?.remarks || '';
                                    
                                    const subParts = [];
                                    subParts.push(guestName);
                                    if (customTitle.trim()) subParts.push(customTitle);
                                    if (guestCount) subParts.push(`${guestCount}名`);
                                    if (hotel) subParts.push(hotel);
                                    if (remarks) subParts.push(remarks);
                                    const subText = subParts.join(' | ');

                                return (
                                    <React.Fragment key={`frag-${event.id}`}>
                                        {isNewGroup && (
                                            <div style={{ 
                                                padding: '4px 8px', 
                                                fontSize: '13px', 
                                                fontWeight: 'bold', 
                                                color: '#6b7280', 
                                                backgroundColor: '#f3f4f6', 
                                                borderRadius: '4px',
                                                marginTop: index === 0 ? '0' : '16px', 
                                                marginBottom: '8px',
                                                display: 'inline-block'
                                            }}>
                                                {groupHeaderStr}
                                            </div>
                                        )}
                                        <div 
                                            key={event.id} 
                                            className="sheet-event-item"
                                            onClick={() => {
                                                handleSelectEvent(event);
                                            }}
                                        >
                                        {/* プランカラーの左ボーダー */}
                                        <div className="event-color-bar" style={{ backgroundColor: meta.color }}></div>
                                        
                                        {/* イベント詳細 */}
                                        <div className="event-info">
                                            <div className="event-title">{(event.title || '').replace(/^(①|②|③|☀️|🏙️|🌙|\(Moved\)\s*)+/g, '').trim()}</div>
                                            {subText && <div className="event-subtext">{subText}</div>}
                                        </div>

                                        {/* 右側のアバター */}
                                        <div style={{ display: 'flex', flexDirection: 'row' }}>
                                            {renderedAvatars}
                                        </div>
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                            </div>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
};

export default DayListSheet;
