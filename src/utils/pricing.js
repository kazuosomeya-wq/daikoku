export const getPriceForDate = (date, personCount, carCount = null, planType = 'Standard Plan') => {
    const day = date.getDay();
    const isWeekend = day === 5 || day === 6; // Fri (5) or Sat (6)

    const effectiveCars = carCount || getCarCount(personCount);

    if (planType === 'Midnight Plan') {
        if (personCount === 1) return 45000 + (effectiveCars - 1) * 50000;
        if (personCount === 2) {
            if (effectiveCars <= 1) return 60000;
            if (effectiveCars === 2) return 110000;
            return 110000 + (effectiveCars - 2) * 50000;
        }
        if (personCount === 3) {
            if (effectiveCars <= 1) return 65000;
            if (effectiveCars === 2) return 115000;
            return 115000 + (effectiveCars - 2) * 50000;
        }
        if (personCount >= 4 && personCount <= 6) {
            if (effectiveCars <= 2) return 120000;
            if (effectiveCars === 3) return 170000;
            return 170000 + (effectiveCars - 3) * 50000;
        }
        if (personCount >= 7 && personCount <= 9) {
            if (effectiveCars <= 3) return 170000;
            return 170000 + (effectiveCars - 3) * 50000;
        }
        return 0; // 10+
    }

    // Default: Standard Plan & Sunday Morning Plan Pricing
    if (personCount === 1) {
        return 50000 + (effectiveCars - 1) * 50000;
    } else if (personCount === 2) {
        const base2 = isWeekend ? 65000 : 60000;
        if (effectiveCars <= 1) return base2;
        if (effectiveCars === 2) return 100000;
        return 100000 + (effectiveCars - 2) * 50000;
    } else if (personCount === 3) {
        const base3 = isWeekend ? 70000 : 65000;
        if (effectiveCars <= 1) return base3;
        if (effectiveCars === 2) return 110000;
        return 110000 + (effectiveCars - 2) * 50000;
    } else if (personCount >= 4 && personCount <= 6) {
        const base4to6 = isWeekend ? 130000 : 120000;
        if (effectiveCars <= 2) return base4to6;
        if (effectiveCars === 3) return base4to6 + 50000;
        return base4to6 + 50000 + (effectiveCars - 3) * 50000;
    } else if (personCount >= 7 && personCount <= 9) {
        if (effectiveCars <= 3) return 180000;
        return 180000 + (effectiveCars - 3) * 50000;
    } else {
        return 0;
    }
};

export const getCarCount = (personCount) => {
    if (personCount <= 3) return 1;
    if (personCount <= 6) return 2;
    return Math.ceil(personCount / 3);
};

export const calculateDeposit = (personCount, carCount = null) => {
    const cars = carCount || getCarCount(personCount);
    return cars * 5000;
};
