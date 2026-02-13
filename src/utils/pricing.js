export const getPriceForDate = (date, personCount, tourType = 'Daikoku Tour') => {
    const day = date.getDay();
    const isWeekend = day === 5 || day === 6; // Fri (5) or Sat (6)

    // Umihotaru Tour Pricing (Fri/Sat Only)
    // 1 person: 50,000
    // 2 people: 60,000
    // 3 people: 65,000
    // 4-6 people: 120,000 (2 cars x 60k base - assumption based on pattern)
    if (tourType === 'Umihotaru Tour') {
        if (personCount === 1) return 50000;
        if (personCount === 2) return 60000;
        if (personCount === 3) return 65000;
        if (personCount >= 4 && personCount <= 6) return 120000;
        return 0; // 7+
    }

    // Default: Daikoku Tour Pricing
    if (personCount === 1) {
        return 50000;
    } else if (personCount === 2) {
        return isWeekend ? 65000 : 60000;
    } else if (personCount === 3) {
        return isWeekend ? 70000 : 65000;
    } else if (personCount >= 4 && personCount <= 6) {
        return isWeekend ? 130000 : 120000;
    } else {
        // 7+ people - "Ask" in the image, but we need a number for calculation
        // fallback or specialized handling. For now, let's treat it as "Call us" 
        // but return 0 to indicate special handling.
        return 0;
    }
};

export const getCarCount = (personCount) => {
    if (personCount <= 3) return 1;
    if (personCount <= 6) return 2;
    return Math.ceil(personCount / 3);
};

export const calculateDeposit = (personCount) => {
    const cars = getCarCount(personCount);
    return cars * 5000;
};
