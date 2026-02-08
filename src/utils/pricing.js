export const getPriceForDate = (date, personCount) => {
    const day = date.getDay();
    const isWeekend = day === 5 || day === 6; // Fri (5) or Sat (6)

    // Pricing rules based on the image
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
