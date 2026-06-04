export const TIME_RANGES = ['1d', '5d', '1mo', '3mo', '1y'] as const;
export type TimeRange = typeof TIME_RANGES[number];

// Helper to safely convert an integer number of days to our frontend-friendly TimeRange strings
export const mapDaysToRange = (days: number): TimeRange => {
    if (days <= 5) return '5d';
    if (days <= 30) return '1mo';
    if (days <= 90) return '3mo';
    return '1y';
};

// Gets the required Yahoo Finance parameters for a given time range.
// IMPORTANT: This is a function (not a static const) so that `period1` is calculated dynamically.
// If it were a static const, the dates would be frozen to whenever the server was booted!
export const getRangeParams = (range: string): { period1: string; interval: '1d' | '1wk' | '1mo' } => {
    const d = new Date();
    switch (range) {
        case '1d': 
            d.setDate(d.getDate() - 2); 
            return { period1: d.toISOString().split('T')[0], interval: '1d' };
        case '5d': 
            d.setDate(d.getDate() - 5); 
            return { period1: d.toISOString().split('T')[0], interval: '1d' };
        case '1mo': 
            d.setDate(d.getDate() - 31); 
            return { period1: d.toISOString().split('T')[0], interval: '1d' };
        case '3mo': 
            d.setDate(d.getDate() - 92); 
            return { period1: d.toISOString().split('T')[0], interval: '1d' };
        case '1y': 
            d.setDate(d.getDate() - 366); 
            return { period1: d.toISOString().split('T')[0], interval: '1wk' };
        default: 
            // Fallback to 1mo
            d.setDate(d.getDate() - 31); 
            return { period1: d.toISOString().split('T')[0], interval: '1d' };
    }
};
