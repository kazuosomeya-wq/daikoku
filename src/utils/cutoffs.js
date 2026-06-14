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

export const getCalendarMaxCutoffHour = (planType, targetDate, globalSettings) => {
    const day = targetDate.getDay();
    const isFriSatSun = day === 0 || day === 5 || day === 6;
    const gs = globalSettings || {};

    if (planType === 'Standard Plan' || planType === 'Daikoku Tour') {
        if (isFriSatSun) {
            const cutoff = gs.cutoff_daikoku_fri_sun ?? 12;
            const randomCarCutoff = gs.random_car_cutoff_daikoku_fri_sun ?? 9;
            const carCutoff = gs.car_cutoff_daikoku_fri_sun ?? 7;
            return Math.max(cutoff, randomCarCutoff, carCutoff);
        } else {
            const cutoff = gs.cutoff_daikoku_mon_thu ?? 12;
            const randomCarCutoff = gs.random_car_cutoff_daikoku_mon_thu ?? 9;
            const carCutoff = gs.car_cutoff_daikoku_mon_thu ?? 7;
            return Math.max(cutoff, randomCarCutoff, carCutoff);
        }
    }

    if (planType === 'Midnight Plan') {
        const cutoff830 = gs.cutoff_midnight_830 ?? 17;
        const randomCarCutoff830 = gs.random_car_cutoff_midnight_830 ?? 19;
        const carCutoff830 = gs.car_cutoff_midnight_830 ?? 17;

        const cutoff1130 = gs.cutoff_midnight_1130 ?? 20;
        const randomCarCutoff1130 = gs.random_car_cutoff_midnight_1130 ?? 22;
        const carCutoff1130 = gs.car_cutoff_midnight_1130 ?? 20;
        
        return Math.max(cutoff830, randomCarCutoff830, carCutoff830, cutoff1130, randomCarCutoff1130, carCutoff1130);
    }

    if (planType === 'City Tour') {
        const cutoff = gs.cutoff_city ?? 12;
        const randomCarCutoff = gs.random_car_cutoff_city ?? 9;
        const carCutoff = gs.car_cutoff_city ?? 7;
        return Math.max(cutoff, randomCarCutoff, carCutoff);
    }

    if (planType === 'Sunday Morning Plan' || planType === 'Morning Plan') {
        const cutoff = gs.cutoff_morning ?? 0;
        const randomCarCutoff = gs.random_car_cutoff_morning ?? 2;
        const carCutoff = gs.car_cutoff_morning ?? 0;
        return Math.max(cutoff, randomCarCutoff, carCutoff);
    }

    // Default fallback
    return 12;
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
    
    const maxCutoff = getCalendarMaxCutoffHour(planType, targetDate, globalSettings);
    
    const cutoffDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0);
    cutoffDate.setHours(maxCutoff);
    return new Date() >= cutoffDate;
};
