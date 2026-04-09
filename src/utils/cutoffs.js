// src/utils/cutoffs.js

export const getCutoffHour = (planType, targetDate, globalSettings, isCarSelection = false, midnightTimeSlot = '8:30 PM') => {
    if (!targetDate) return 24; // If no date is selected, don't restrict

    const day = targetDate.getDay();
    const isFriSatSun = day === 0 || day === 5 || day === 6;
    const gs = globalSettings || {};

    if (planType === 'Standard Plan' || planType === 'Daikoku Tour') {
        if (isFriSatSun) {
            return isCarSelection
                ? (gs.car_cutoff_daikoku_fri_sun ?? 7)
                : (gs.cutoff_daikoku_fri_sun ?? 12);
        } else {
            return isCarSelection
                ? (gs.car_cutoff_daikoku_mon_thu ?? 7)
                : (gs.cutoff_daikoku_mon_thu ?? 12);
        }
    }

    if (planType === 'Midnight Plan') {
        if (midnightTimeSlot === '11:30 PM') {
            return isCarSelection
                ? (gs.car_cutoff_midnight_1130 ?? 20)
                : (gs.cutoff_midnight_1130 ?? 20);
        } else {
            return isCarSelection
                ? (gs.car_cutoff_midnight_830 ?? 17)
                : (gs.cutoff_midnight_830 ?? 17);
        }
    }

    if (planType === 'City Tour') {
        return isCarSelection
            ? (gs.car_cutoff_city ?? 7)
            : (gs.cutoff_city ?? 12);
    }

    if (planType === 'Sunday Morning Plan' || planType === 'Morning Plan') {
        return isCarSelection
            ? (gs.car_cutoff_morning ?? 0)
            : (gs.cutoff_morning ?? 0);
    }

    // Default fallback
    return isCarSelection ? 7 : 12;
};

// Function specifically for Calendar logic where time slots are not explicitly selected yet
// Returns the "most lenient" (latest) cutoff hour for booking so the day doesn't immediately lock if a later slot is available
export const getCalendarMaxCutoffHour = (planType, targetDate, globalSettings) => {
    const day = targetDate.getDay();
    const isFriSatSun = day === 0 || day === 5 || day === 6;
    const gs = globalSettings || {};

    if (planType === 'Midnight Plan') {
        // The calendar should remain open as long as at least ONE of the slots is still bookable
        const cutoff830 = gs.cutoff_midnight_830 ?? 17;
        const cutoff1130 = gs.cutoff_midnight_1130 ?? 20;
        return (gs.is1130Enabled !== false) ? Math.max(cutoff830, cutoff1130) : cutoff830;
    }

    // For other plans, there's only one slot type per day
    return getCutoffHour(planType, targetDate, globalSettings, false);
};

export const getCutoffTime = (planType, targetDate, globalSettings, isCarSelection = false, midnightTimeSlot = '8:30 PM') => {
    const hour = getCutoffHour(planType, targetDate, globalSettings, isCarSelection, midnightTimeSlot);
    const cutoffDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0);
    cutoffDate.setHours(hour); // Automatically handles negative values by wrapping to the previous day
    return cutoffDate;
};

export const isCutoffPassed = (planType, targetDate, globalSettings, isCarSelection = false, midnightTimeSlot = '8:30 PM') => {
    if (!targetDate) return false;
    const cutoffTime = getCutoffTime(planType, targetDate, globalSettings, isCarSelection, midnightTimeSlot);
    return new Date() >= cutoffTime;
};

export const isCalendarCutoffPassed = (planType, targetDate, globalSettings) => {
    if (!targetDate) return false;
    
    if (planType === 'Midnight Plan') {
        const gs = globalSettings || {};
        const cutoff830 = gs.cutoff_midnight_830 ?? 17;
        const cutoff1130 = gs.cutoff_midnight_1130 ?? 20;
        
        const maxHour = (gs.is1130Enabled !== false) ? Math.max(cutoff830, cutoff1130) : cutoff830;
        
        const cutoffDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0);
        cutoffDate.setHours(maxHour);
        return new Date() >= cutoffDate;
    }

    return isCutoffPassed(planType, targetDate, globalSettings, false);
};
