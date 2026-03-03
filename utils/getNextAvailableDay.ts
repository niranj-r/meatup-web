/**
 * Returns true if the product should be shown as available right now.
 *
 * Rules (in order):
 * 1. If `available_days` is set and today is NOT in it → always out of stock (day-based restriction)
 * 2. If today IS an available day → use the admin-controlled `availability` flag
 * 3. If `available_days` is not set → fall back to `availability` alone
 */
export function isProductAvailableToday(product: {
    availability: boolean;
    available_days?: number[];
}): boolean {
    const todayDay = new Date().getDay(); // 0=Sun … 6=Sat

    if (product.available_days && product.available_days.length > 0) {
        const isTodayAnAvailableDay = product.available_days.includes(todayDay);
        if (!isTodayAnAvailableDay) return false; // blocked by day schedule
        return product.availability; // admin can still mark it sold-out on an available day
    }

    return product.availability; // no day restriction → use admin flag only
}

/**
 * Given an array of available days (0=Sun, 1=Mon, …, 6=Sat),
 * returns a human-friendly string describing the NEXT available date.
 *
 * Today is always skipped (product is sold out / not available today),
 * so a product available every day will show "Tomorrow" when sold out.
 *
 * Examples: "Tomorrow", "This Wednesday", "Sat, Mar 8"
 */
export function getNextAvailableDay(availableDays: number[]): string {
    if (!availableDays || availableDays.length === 0) return 'Check back soon';

    const now = new Date();
    const todayDay = now.getDay(); // 0-6

    const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const FULL_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const sorted = [...availableDays].sort((a, b) => a - b);

    let minDaysAhead = Infinity;
    let targetDay = -1;

    for (const day of sorted) {
        let daysAhead = (day - todayDay + 7) % 7;
        // Always skip today — product is sold out / not available today
        if (daysAhead === 0) daysAhead = 7;
        if (daysAhead < minDaysAhead) {
            minDaysAhead = daysAhead;
            targetDay = day;
        }
    }

    if (targetDay === -1) return 'Check back soon';

    const nextDate = new Date(now);
    nextDate.setDate(now.getDate() + minDaysAhead);

    const month = nextDate.toLocaleString('en-IN', { month: 'short' });
    const date = nextDate.getDate();

    if (minDaysAhead === 1) return 'Tomorrow';
    if (minDaysAhead < 7) return `This ${FULL_DAY_NAMES[targetDay]}`;
    return `${DAY_NAMES[targetDay]}, ${month} ${date}`;
}
