import React from 'react';

const CustomEvent = ({ event }) => {
    const isCanceled = event.resource.status === 'Canceled';
    const driverName = event.resource.resolvedDriverName || event.resource.vehicleName1 || event.resource.vehicleName;
    
    return (
        <div style={{ textDecoration: isCanceled ? 'line-through' : 'none' }}>
            <div style={{ fontWeight: 'bold', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {event.title}
            </div>
            {driverName && driverName !== '未設定' && (
                <div style={{ fontSize: '0.75rem', opacity: 0.9, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {driverName}
                </div>
            )}
        </div>
    );
};

export default CustomEvent;
