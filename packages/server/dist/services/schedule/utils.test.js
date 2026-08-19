"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
// ─── validateCronExpression ───────────────────────────────────────────────────
describe('validateCronExpression', () => {
    describe('valid expressions', () => {
        it('accepts wildcard every-minute expression', () => {
            expect((0, utils_1.validateCronExpression)('* * * * *')).toEqual({ valid: true });
        });
        it('accepts specific weekday range', () => {
            expect((0, utils_1.validateCronExpression)('0 9 * * 1-5')).toEqual({ valid: true });
        });
        it('accepts step values', () => {
            expect((0, utils_1.validateCronExpression)('*/5 * * * *')).toEqual({ valid: true });
        });
        it('accepts comma-separated lists', () => {
            expect((0, utils_1.validateCronExpression)('0,30 * * * *')).toEqual({ valid: true });
        });
        it('accepts 6-field cron with seconds', () => {
            const result = (0, utils_1.validateCronExpression)('0 * * * * *');
            expect(result.valid).toBe(true);
        });
        it('accepts step on a range base', () => {
            expect((0, utils_1.validateCronExpression)('0/15 * * * *')).toEqual({ valid: true });
        });
        it('accepts day-of-week value 7 (also Sunday)', () => {
            expect((0, utils_1.validateCronExpression)('0 0 * * 7')).toEqual({ valid: true });
        });
        it('accepts valid timezone', () => {
            expect((0, utils_1.validateCronExpression)('0 9 * * 1-5', 'America/New_York')).toEqual({ valid: true });
        });
    });
    describe('invalid inputs', () => {
        it('rejects a non-string value', () => {
            const result = (0, utils_1.validateCronExpression)(null);
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
        });
        it('rejects an empty string', () => {
            const result = (0, utils_1.validateCronExpression)('');
            expect(result.valid).toBe(false);
        });
        it('rejects too few fields (4 fields)', () => {
            const result = (0, utils_1.validateCronExpression)('* * * *');
            expect(result.valid).toBe(false);
            expect(result.error).toMatch(/5 fields/);
        });
        it('rejects too many fields (7 fields)', () => {
            const result = (0, utils_1.validateCronExpression)('0 0 0 * * * *');
            expect(result.valid).toBe(false);
        });
        it('rejects minute value > 59', () => {
            const result = (0, utils_1.validateCronExpression)('60 * * * *');
            expect(result.valid).toBe(false);
            expect(result.error).toMatch(/position 1/);
        });
        it('rejects hour value > 23', () => {
            const result = (0, utils_1.validateCronExpression)('0 24 * * *');
            expect(result.valid).toBe(false);
        });
        it('rejects day-of-month value 0', () => {
            const result = (0, utils_1.validateCronExpression)('0 0 0 * *');
            expect(result.valid).toBe(false);
        });
        it('rejects month value 0', () => {
            const result = (0, utils_1.validateCronExpression)('0 0 * 0 *');
            expect(result.valid).toBe(false);
        });
        it('rejects inverted range (start > end)', () => {
            const result = (0, utils_1.validateCronExpression)('0 0 * * 5-1');
            expect(result.valid).toBe(false);
        });
        it('rejects step value of 0', () => {
            const result = (0, utils_1.validateCronExpression)('*/0 * * * *');
            expect(result.valid).toBe(false);
        });
        it('rejects non-numeric step', () => {
            const result = (0, utils_1.validateCronExpression)('*/x * * * *');
            expect(result.valid).toBe(false);
        });
        it('rejects trailing comma in field', () => {
            const result = (0, utils_1.validateCronExpression)('1, * * * *');
            expect(result.valid).toBe(false);
        });
        it('rejects an invalid timezone', () => {
            const result = (0, utils_1.validateCronExpression)('* * * * *', 'Invalid/Timezone');
            expect(result.valid).toBe(false);
            expect(result.error).toMatch(/Invalid timezone/);
        });
    });
    describe('minIntervalSeconds (60) — 6-field cron seconds validation', () => {
        it('rejects 6-field cron firing every second (*/1) with default minInterval', () => {
            const result = (0, utils_1.validateCronExpression)('* * * * * *');
            expect(result.valid).toBe(false);
            expect(result.error).toMatch(/below the minimum interval/);
        });
        it('accepts 6-field cron with seconds step >= default minInterval 10', () => {
            const result = (0, utils_1.validateCronExpression)('*/15 * * * * *', 'UTC', 10);
            expect(result.valid).toBe(true);
        });
        it('rejects 6-field cron with seconds step < minIntervalSeconds', () => {
            // */10 fires every 10s, minInterval = 30
            const result = (0, utils_1.validateCronExpression)('*/10 * * * * *', 'UTC', 30);
            expect(result.valid).toBe(false);
            expect(result.error).toMatch(/fires every 10s/);
        });
        it('accepts 6-field cron with seconds step >= minIntervalSeconds', () => {
            // */30 fires every 30s, minInterval = 30
            const result = (0, utils_1.validateCronExpression)('*/30 * * * * *', 'UTC', 30);
            expect(result.valid).toBe(true);
        });
        it('rejects comma-list seconds with small gap', () => {
            // 0,5 → gap = 5s, wrap-around gap = 55s → min = 5s
            const result = (0, utils_1.validateCronExpression)('0,5 * * * * *', 'UTC', 10);
            expect(result.valid).toBe(false);
            expect(result.error).toMatch(/fires every 5s/);
        });
        it('accepts single-second 6-field cron (fires once per minute)', () => {
            const result = (0, utils_1.validateCronExpression)('0 * * * * *', 'UTC', 60);
            expect(result.valid).toBe(true);
        });
        it('accounts for wrap-around gap in seconds', () => {
            // 0,50 → gaps: 50s and wrap-around 10s → min = 10s
            const result = (0, utils_1.validateCronExpression)('0,50 * * * * *', 'UTC', 15);
            expect(result.valid).toBe(false);
            expect(result.error).toMatch(/fires every 10s/);
        });
        it('accepts when minIntervalSeconds is 1 (no restriction)', () => {
            const result = (0, utils_1.validateCronExpression)('* * * * * *', 'UTC', 1);
            expect(result.valid).toBe(true);
        });
    });
    describe('`L` token (last day of month)', () => {
        it('accepts standalone L in 5-field day-of-month field', () => {
            expect((0, utils_1.validateCronExpression)('0 9 L * *')).toEqual({ valid: true });
        });
        it('accepts L mixed with numeric days in 5-field DOM', () => {
            expect((0, utils_1.validateCronExpression)('0 9 1,15,L * *')).toEqual({ valid: true });
        });
        it('accepts L in 6-field DOM (position 4)', () => {
            expect((0, utils_1.validateCronExpression)('0 0 9 L * *')).toEqual({ valid: true });
        });
        it('rejects L in any field other than day-of-month (5-field)', () => {
            // L in minute, hour, month, dow positions
            expect((0, utils_1.validateCronExpression)('L * * * *').valid).toBe(false);
            expect((0, utils_1.validateCronExpression)('* L * * *').valid).toBe(false);
            expect((0, utils_1.validateCronExpression)('* * * L *').valid).toBe(false);
            expect((0, utils_1.validateCronExpression)('* * * * L').valid).toBe(false);
        });
        it('rejects L in any field other than day-of-month (6-field)', () => {
            // L in seconds and minutes positions of a 6-field cron
            expect((0, utils_1.validateCronExpression)('L * * * * *').valid).toBe(false);
            expect((0, utils_1.validateCronExpression)('* L * * * *').valid).toBe(false);
        });
        it('rejects malformed L tokens like LL or L5', () => {
            expect((0, utils_1.validateCronExpression)('0 9 LL * *').valid).toBe(false);
            expect((0, utils_1.validateCronExpression)('0 9 L5 * *').valid).toBe(false);
        });
    });
});
// ─── computeNextRunAt ─────────────────────────────────────────────────────────
describe('computeNextRunAt', () => {
    it('returns a Date in the future for every-minute cron', () => {
        const now = new Date();
        const next = (0, utils_1.computeNextRunAt)('* * * * *', 'UTC', now);
        expect(next).not.toBeNull();
        expect(next.getTime()).toBeGreaterThan(now.getTime());
    });
    it('returns a date at least 1 minute after the provided reference', () => {
        const ref = new Date('2025-01-01T12:00:00Z');
        const next = (0, utils_1.computeNextRunAt)('* * * * *', 'UTC', ref);
        expect(next.getTime()).toBeGreaterThanOrEqual(ref.getTime() + 60_000);
    });
    it('finds the next occurrence of a specific daily cron', () => {
        // Run at 09:00 UTC every day — provide reference at 08:00 same day
        const ref = new Date('2025-06-15T08:00:00Z');
        const next = (0, utils_1.computeNextRunAt)('0 9 * * *', 'UTC', ref);
        expect(next).not.toBeNull();
        expect(next.getUTCHours()).toBe(9);
        expect(next.getUTCMinutes()).toBe(0);
        expect(next.getUTCDate()).toBe(15);
    });
    it('advances to the next day when target time has passed today', () => {
        // Run at 06:00 UTC — reference is already past 06:00
        const ref = new Date('2025-06-15T10:00:00Z');
        const next = (0, utils_1.computeNextRunAt)('0 6 * * *', 'UTC', ref);
        expect(next).not.toBeNull();
        expect(next.getUTCDate()).toBe(16);
        expect(next.getUTCHours()).toBe(6);
    });
    it('uses the provided timezone to compute the next run', () => {
        // 0 9 * * * in America/New_York — find next occurrence after a UTC reference
        const ref = new Date('2025-06-15T12:00:00Z'); // 08:00 NY time
        const next = (0, utils_1.computeNextRunAt)('0 9 * * *', 'America/New_York', ref);
        expect(next).not.toBeNull();
        // Should fire at 09:00 NY = 13:00 UTC on June 15
        expect(next.getUTCHours()).toBe(13);
        expect(next.getUTCDate()).toBe(15);
    });
    it('returns null for an expression that never matches (e.g., Feb 31)', () => {
        // Feb 31 never exists — this should exhaust the search window
        const next = (0, utils_1.computeNextRunAt)('0 0 31 2 *', 'UTC');
        expect(next).toBeNull();
    });
    it('returns seconds-aligned output (seconds and ms zeroed)', () => {
        const ref = new Date('2025-01-01T00:00:30Z');
        const next = (0, utils_1.computeNextRunAt)('* * * * *', 'UTC', ref);
        expect(next.getUTCSeconds()).toBe(0);
        expect(next.getUTCMilliseconds()).toBe(0);
    });
    it('aligns to next stepped minute for numeric-base step syntax (0/15)', () => {
        // 0/15 * * * * fires at :00, :15, :30, :45 — reference at :07 should yield :15
        const ref = new Date('2025-01-01T12:07:00Z');
        const next = (0, utils_1.computeNextRunAt)('0/15 * * * *', 'UTC', ref);
        expect(next).not.toBeNull();
        expect(next.getUTCHours()).toBe(12);
        expect(next.getUTCMinutes()).toBe(15);
        expect(next.getUTCSeconds()).toBe(0);
    });
    // ── 6-field cron (seconds) ─────────────────────────────────────────
    it('supports 6-field cron: */15 fires at next 15-second boundary', () => {
        const ref = new Date('2025-01-01T12:00:10Z');
        const next = (0, utils_1.computeNextRunAt)('*/15 * * * * *', 'UTC', ref);
        expect(next).not.toBeNull();
        expect(next.toISOString()).toBe('2025-01-01T12:00:15.000Z');
    });
    it('supports 6-field cron: */30 fires at next 30-second boundary', () => {
        const ref = new Date('2025-01-01T12:00:05Z');
        const next = (0, utils_1.computeNextRunAt)('*/30 * * * * *', 'UTC', ref);
        expect(next).not.toBeNull();
        expect(next.toISOString()).toBe('2025-01-01T12:00:30.000Z');
    });
    it('supports 6-field cron: rolls to next minute when no matching second remains', () => {
        // */30 matches 0 and 30 — ref at :45 should roll into next minute at :00
        const ref = new Date('2025-01-01T12:00:45Z');
        const next = (0, utils_1.computeNextRunAt)('*/30 * * * * *', 'UTC', ref);
        expect(next).not.toBeNull();
        expect(next.toISOString()).toBe('2025-01-01T12:01:00.000Z');
    });
    it('supports 6-field cron: specific second value', () => {
        // Fire at second 20 of every minute
        const ref = new Date('2025-01-01T12:00:10Z');
        const next = (0, utils_1.computeNextRunAt)('20 * * * * *', 'UTC', ref);
        expect(next).not.toBeNull();
        expect(next.getUTCSeconds()).toBe(20);
        expect(next.getUTCMinutes()).toBe(0);
    });
    it('supports 6-field cron: specific second + specific minute', () => {
        // Fire at second 30, minute 15 of every hour
        const ref = new Date('2025-01-01T12:00:00Z');
        const next = (0, utils_1.computeNextRunAt)('30 15 * * * *', 'UTC', ref);
        expect(next).not.toBeNull();
        expect(next.getUTCHours()).toBe(12);
        expect(next.getUTCMinutes()).toBe(15);
        expect(next.getUTCSeconds()).toBe(30);
    });
    it('supports 6-field cron: comma-separated seconds', () => {
        // Fire at seconds 0 and 30
        const ref = new Date('2025-01-01T12:00:10Z');
        const next = (0, utils_1.computeNextRunAt)('0,30 * * * * *', 'UTC', ref);
        expect(next).not.toBeNull();
        expect(next.getUTCSeconds()).toBe(30);
    });
    it('supports 6-field cron: seconds with timezone', () => {
        // Fire at second 0, minute 0, hour 9 in New York time
        const ref = new Date('2025-06-15T12:59:50Z'); // 08:59:50 NY
        const next = (0, utils_1.computeNextRunAt)('0 0 9 * * *', 'America/New_York', ref);
        expect(next).not.toBeNull();
        // 09:00:00 NY = 13:00:00 UTC (EDT = UTC-4)
        expect(next.toISOString()).toBe('2025-06-15T13:00:00.000Z');
    });
    it('returns milliseconds-zeroed output for 6-field cron', () => {
        const ref = new Date('2025-01-01T00:00:00.500Z');
        const next = (0, utils_1.computeNextRunAt)('*/15 * * * * *', 'UTC', ref);
        expect(next).not.toBeNull();
        expect(next.getUTCMilliseconds()).toBe(0);
    });
    // ── `L` token (last day of month) ──────────────────────────────────
    it('resolves L to Jan 31 (31-day month)', () => {
        const ref = new Date('2025-01-15T00:00:00Z');
        const next = (0, utils_1.computeNextRunAt)('0 9 L * *', 'UTC', ref);
        expect(next).not.toBeNull();
        expect(next.getUTCDate()).toBe(31);
        expect(next.getUTCMonth()).toBe(0); // January
        expect(next.getUTCHours()).toBe(9);
    });
    it('resolves L to Apr 30 (30-day month)', () => {
        const ref = new Date('2025-04-15T00:00:00Z');
        const next = (0, utils_1.computeNextRunAt)('0 9 L * *', 'UTC', ref);
        expect(next).not.toBeNull();
        expect(next.getUTCDate()).toBe(30);
        expect(next.getUTCMonth()).toBe(3); // April
    });
    it('resolves L to Feb 28 in a non-leap year', () => {
        const ref = new Date('2025-02-10T00:00:00Z');
        const next = (0, utils_1.computeNextRunAt)('0 9 L * *', 'UTC', ref);
        expect(next).not.toBeNull();
        expect(next.getUTCDate()).toBe(28);
        expect(next.getUTCMonth()).toBe(1); // February
    });
    it('resolves L to Feb 29 in a leap year', () => {
        const ref = new Date('2024-02-10T00:00:00Z');
        const next = (0, utils_1.computeNextRunAt)('0 9 L * *', 'UTC', ref);
        expect(next).not.toBeNull();
        expect(next.getUTCDate()).toBe(29);
        expect(next.getUTCMonth()).toBe(1);
    });
    it('rolls over to next month when current month`s last day has passed', () => {
        // Jan 31 09:00 has just passed → next L should be Feb 28 (2025 non-leap)
        const ref = new Date('2025-01-31T10:00:00Z');
        const next = (0, utils_1.computeNextRunAt)('0 9 L * *', 'UTC', ref);
        expect(next).not.toBeNull();
        expect(next.getUTCMonth()).toBe(1); // February
        expect(next.getUTCDate()).toBe(28);
    });
    it('honours mixed list `15,L`: picks the earlier occurrence', () => {
        // From Jan 1, 15,L resolves first to Jan 15 (not Jan 31)
        const ref = new Date('2025-01-01T00:00:00Z');
        const next = (0, utils_1.computeNextRunAt)('0 9 15,L * *', 'UTC', ref);
        expect(next).not.toBeNull();
        expect(next.getUTCDate()).toBe(15);
    });
    it('honours mixed list `15,L`: jumps to month-end after the 15th', () => {
        // From Jan 16, 15,L resolves to Jan 31 (last day)
        const ref = new Date('2025-01-16T00:00:00Z');
        const next = (0, utils_1.computeNextRunAt)('0 9 15,L * *', 'UTC', ref);
        expect(next).not.toBeNull();
        expect(next.getUTCDate()).toBe(31);
    });
    it('honours mixed list `31,L`: jumps to month-end after the 31st', () => {
        // From Jan 16, 31,L resolves to Jan 31 (last day)
        const ref = new Date('2025-01-16T00:00:00Z');
        const next = (0, utils_1.computeNextRunAt)('0 9 31,L * *', 'UTC', ref);
        expect(next).not.toBeNull();
        expect(next.getUTCDate()).toBe(31);
    });
});
// ─── validateVisualPickerFields ───────────────────────────────────────────────
describe('validateVisualPickerFields', () => {
    describe('common validations', () => {
        it('rejects missing frequency', () => {
            const result = (0, utils_1.validateVisualPickerFields)({ scheduleFrequency: '' });
            expect(result.valid).toBe(false);
            expect(result.error).toMatch(/Frequency is required/);
        });
        it('rejects an unsupported frequency', () => {
            const result = (0, utils_1.validateVisualPickerFields)({ scheduleFrequency: 'yearly' });
            expect(result.valid).toBe(false);
            expect(result.error).toMatch(/Invalid frequency/);
        });
    });
    describe('hourly', () => {
        it('rejects missing scheduleOnMinute', () => {
            const result = (0, utils_1.validateVisualPickerFields)({ scheduleFrequency: 'hourly' });
            expect(result.valid).toBe(false);
            expect(result.error).toMatch(/On Minute is required/);
        });
        it('rejects empty string scheduleOnMinute', () => {
            const result = (0, utils_1.validateVisualPickerFields)({ scheduleFrequency: 'hourly', scheduleOnMinute: '' });
            expect(result.valid).toBe(false);
        });
        it('rejects minute > 59', () => {
            const result = (0, utils_1.validateVisualPickerFields)({ scheduleFrequency: 'hourly', scheduleOnMinute: 60 });
            expect(result.valid).toBe(false);
            expect(result.error).toMatch(/0 and 59/);
        });
        it('rejects minute < 0', () => {
            const result = (0, utils_1.validateVisualPickerFields)({ scheduleFrequency: 'hourly', scheduleOnMinute: -1 });
            expect(result.valid).toBe(false);
        });
        it('accepts valid minute 0', () => {
            expect((0, utils_1.validateVisualPickerFields)({ scheduleFrequency: 'hourly', scheduleOnMinute: 0 })).toEqual({ valid: true });
        });
        it('accepts valid minute 30', () => {
            expect((0, utils_1.validateVisualPickerFields)({ scheduleFrequency: 'hourly', scheduleOnMinute: 30 })).toEqual({ valid: true });
        });
        it('accepts minute as a string number', () => {
            expect((0, utils_1.validateVisualPickerFields)({ scheduleFrequency: 'hourly', scheduleOnMinute: '45' })).toEqual({ valid: true });
        });
    });
    describe('daily', () => {
        it('rejects missing scheduleOnTime', () => {
            const result = (0, utils_1.validateVisualPickerFields)({ scheduleFrequency: 'daily' });
            expect(result.valid).toBe(false);
            expect(result.error).toMatch(/On Time is required/);
        });
        it('rejects time in wrong format', () => {
            const result = (0, utils_1.validateVisualPickerFields)({ scheduleFrequency: 'daily', scheduleOnTime: '9:00' });
            expect(result.valid).toBe(false);
            expect(result.error).toMatch(/HH:mm/);
        });
        it('rejects invalid hour', () => {
            const result = (0, utils_1.validateVisualPickerFields)({ scheduleFrequency: 'daily', scheduleOnTime: '24:00' });
            expect(result.valid).toBe(false);
            expect(result.error).toMatch(/out-of-range/);
        });
        it('rejects invalid minute', () => {
            const result = (0, utils_1.validateVisualPickerFields)({ scheduleFrequency: 'daily', scheduleOnTime: '09:60' });
            expect(result.valid).toBe(false);
        });
        it('accepts valid daily time', () => {
            expect((0, utils_1.validateVisualPickerFields)({ scheduleFrequency: 'daily', scheduleOnTime: '09:30' })).toEqual({ valid: true });
        });
    });
    describe('weekly', () => {
        const base = { scheduleFrequency: 'weekly', scheduleOnTime: '09:00' };
        it('rejects missing scheduleOnDayOfWeek', () => {
            const result = (0, utils_1.validateVisualPickerFields)(base);
            expect(result.valid).toBe(false);
            expect(result.error).toMatch(/Day of Week is required/);
        });
        it('rejects invalid day value (8)', () => {
            const result = (0, utils_1.validateVisualPickerFields)({ ...base, scheduleOnDayOfWeek: '8' });
            expect(result.valid).toBe(false);
            expect(result.error).toMatch(/Invalid day of week/);
        });
        it('rejects day 0 (not emitted by the UI; use 7 for Sunday)', () => {
            const result = (0, utils_1.validateVisualPickerFields)({ ...base, scheduleOnDayOfWeek: '0' });
            expect(result.valid).toBe(false);
            expect(result.error).toMatch(/Invalid day of week/);
        });
        it('accepts day 7 (Sunday)', () => {
            expect((0, utils_1.validateVisualPickerFields)({ ...base, scheduleOnDayOfWeek: '7' })).toEqual({ valid: true });
        });
        it('accepts comma-separated days', () => {
            expect((0, utils_1.validateVisualPickerFields)({ ...base, scheduleOnDayOfWeek: '1,3,5' })).toEqual({ valid: true });
        });
    });
    describe('monthly', () => {
        const base = { scheduleFrequency: 'monthly', scheduleOnTime: '08:00' };
        it('rejects missing scheduleOnDayOfMonth', () => {
            const result = (0, utils_1.validateVisualPickerFields)(base);
            expect(result.valid).toBe(false);
            expect(result.error).toMatch(/Day of Month is required/);
        });
        it('rejects day of month 0', () => {
            const result = (0, utils_1.validateVisualPickerFields)({ ...base, scheduleOnDayOfMonth: '0' });
            expect(result.valid).toBe(false);
            expect(result.error).toMatch(/Invalid day of month/);
        });
        it('rejects day of month 32', () => {
            const result = (0, utils_1.validateVisualPickerFields)({ ...base, scheduleOnDayOfMonth: '32' });
            expect(result.valid).toBe(false);
        });
        it('accepts valid days', () => {
            expect((0, utils_1.validateVisualPickerFields)({ ...base, scheduleOnDayOfMonth: '1,15' })).toEqual({ valid: true });
        });
        it('accepts last day of month (31)', () => {
            expect((0, utils_1.validateVisualPickerFields)({ ...base, scheduleOnDayOfMonth: '31' })).toEqual({ valid: true });
        });
        it('accepts the L (last day of month) token', () => {
            expect((0, utils_1.validateVisualPickerFields)({ ...base, scheduleOnDayOfMonth: 'L' })).toEqual({ valid: true });
        });
        it('accepts L mixed with numeric days', () => {
            expect((0, utils_1.validateVisualPickerFields)({ ...base, scheduleOnDayOfMonth: '1,15,L' })).toEqual({ valid: true });
        });
        it('rejects malformed L tokens', () => {
            expect((0, utils_1.validateVisualPickerFields)({ ...base, scheduleOnDayOfMonth: 'LL' }).valid).toBe(false);
            expect((0, utils_1.validateVisualPickerFields)({ ...base, scheduleOnDayOfMonth: 'l' }).valid).toBe(false); // lowercase not allowed
        });
    });
});
// ─── buildCronFromVisualPicker ────────────────────────────────────────────────
describe('buildCronFromVisualPicker', () => {
    it('builds hourly cron with correct minute', () => {
        expect((0, utils_1.buildCronFromVisualPicker)({ scheduleFrequency: 'hourly', scheduleOnMinute: 30 })).toBe('30 * * * *');
    });
    it('builds daily cron at 09:30', () => {
        expect((0, utils_1.buildCronFromVisualPicker)({ scheduleFrequency: 'daily', scheduleOnTime: '09:30' })).toBe('30 9 * * *');
    });
    it('builds daily cron at midnight (00:00)', () => {
        expect((0, utils_1.buildCronFromVisualPicker)({ scheduleFrequency: 'daily', scheduleOnTime: '00:00' })).toBe('0 0 * * *');
    });
    it('builds weekly cron for Mon/Wed/Fri at 08:00', () => {
        expect((0, utils_1.buildCronFromVisualPicker)({ scheduleFrequency: 'weekly', scheduleOnTime: '08:00', scheduleOnDayOfWeek: '1,3,5' })).toBe('0 8 * * 1,3,5');
    });
    it('builds monthly cron for the 1st and 15th at 09:00', () => {
        expect((0, utils_1.buildCronFromVisualPicker)({ scheduleFrequency: 'monthly', scheduleOnTime: '09:00', scheduleOnDayOfMonth: '1,15' })).toBe('0 9 1,15 * *');
    });
    it('throws for an unsupported frequency', () => {
        expect(() => (0, utils_1.buildCronFromVisualPicker)({ scheduleFrequency: 'yearly' })).toThrow(/Unsupported frequency/);
    });
});
// ─── resolveScheduleCron ──────────────────────────────────────────────────────
describe('resolveScheduleCron', () => {
    describe('cronExpression type (default)', () => {
        it('returns valid cron when expression is valid', () => {
            const result = (0, utils_1.resolveScheduleCron)({ scheduleCronExpression: '0 9 * * 1-5' });
            expect(result).toEqual({ valid: true, cronExpression: '0 9 * * 1-5' });
        });
        it('defaults to cronExpression type when scheduleType is not set', () => {
            const result = (0, utils_1.resolveScheduleCron)({ scheduleCronExpression: '* * * * *' });
            expect(result.valid).toBe(true);
            expect(result.cronExpression).toBe('* * * * *');
        });
        it('returns invalid when cron expression is invalid', () => {
            const result = (0, utils_1.resolveScheduleCron)({ scheduleCronExpression: 'not-a-cron' });
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
        });
        it('validates timezone from inputs', () => {
            const result = (0, utils_1.resolveScheduleCron)({
                scheduleCronExpression: '0 9 * * *',
                scheduleTimezone: 'Invalid/Zone'
            });
            expect(result.valid).toBe(false);
        });
    });
    describe('visualPicker type', () => {
        it('converts valid visual picker to cron expression', () => {
            const result = (0, utils_1.resolveScheduleCron)({
                scheduleType: 'visualPicker',
                scheduleFrequency: 'daily',
                scheduleOnTime: '09:00',
                scheduleTimezone: 'UTC'
            });
            expect(result.valid).toBe(true);
            expect(result.cronExpression).toBe('0 9 * * *');
        });
        it('returns invalid when visual picker fields are invalid', () => {
            const result = (0, utils_1.resolveScheduleCron)({
                scheduleType: 'visualPicker',
                scheduleFrequency: 'hourly'
                // missing scheduleOnMinute
            });
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
        });
        it('propagates timezone to cron validation', () => {
            const result = (0, utils_1.resolveScheduleCron)({
                scheduleType: 'visualPicker',
                scheduleFrequency: 'daily',
                scheduleOnTime: '09:00',
                scheduleTimezone: 'Asia/Tokyo'
            });
            expect(result.valid).toBe(true);
        });
    });
});
// ─── isScheduleInputValid ─────────────────────────────────────────────────────
describe('isScheduleInputValid', () => {
    describe("mode='text'", () => {
        it('returns true for a non-empty default input', () => {
            expect((0, utils_1.isScheduleInputValid)('text', 'hello')).toBe(true);
        });
        it('returns false when default input is empty', () => {
            expect((0, utils_1.isScheduleInputValid)('text', '')).toBe(false);
        });
        it('returns false when default input is rich-text empty', () => {
            expect((0, utils_1.isScheduleInputValid)('text', '<p></p>')).toBe(false);
        });
        it('accepts whitespace-only strings (only tests truthiness + rich-text empty marker)', () => {
            expect((0, utils_1.isScheduleInputValid)('text', '   ')).toBe(true);
        });
    });
    describe("mode='form'", () => {
        it('returns true when at least one form field is defined', () => {
            expect((0, utils_1.isScheduleInputValid)('form', undefined, [{ name: 'team', type: 'string' }])).toBe(true);
        });
        it('returns false when formInputTypes is empty', () => {
            expect((0, utils_1.isScheduleInputValid)('form', undefined, [])).toBe(false);
        });
        it('returns false when formInputTypes is missing', () => {
            expect((0, utils_1.isScheduleInputValid)('form', undefined, undefined)).toBe(false);
        });
        it('ignores defaultInput value — only formInputTypes matters', () => {
            expect((0, utils_1.isScheduleInputValid)('form', '', [{ name: 'x', type: 'string' }])).toBe(true);
        });
    });
    describe("mode='none'", () => {
        it('always returns true regardless of other inputs', () => {
            expect((0, utils_1.isScheduleInputValid)('none', undefined, undefined)).toBe(true);
            expect((0, utils_1.isScheduleInputValid)('none', '', [])).toBe(true);
        });
    });
});
// ─── canScheduleEnable ────────────────────────────────────────────────────────
describe('canScheduleEnable', () => {
    const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(); // 30 days from now
    const pastDate = new Date(Date.now() - 1000 * 60 * 60).toISOString(); // 1 hour ago
    it('returns false when scheduleInputMode is missing', () => {
        expect((0, utils_1.canScheduleEnable)({
            scheduleCronExpression: '0 9 * * 1-5',
            scheduleDefaultInput: 'hello'
        })).toBe(false);
    });
    it('returns false when cron expression is invalid', () => {
        expect((0, utils_1.canScheduleEnable)({
            scheduleCronExpression: 'bad-cron',
            scheduleInputMode: 'text',
            scheduleDefaultInput: 'hello',
            scheduleEndDate: futureDate
        })).toBe(false);
    });
    it('returns false when end date is in the past', () => {
        expect((0, utils_1.canScheduleEnable)({
            scheduleCronExpression: '* * * * *',
            scheduleInputMode: 'text',
            scheduleDefaultInput: 'hello',
            scheduleEndDate: pastDate
        })).toBe(false);
    });
    it('returns false when default input is missing', () => {
        expect((0, utils_1.canScheduleEnable)({
            scheduleCronExpression: '* * * * *',
            scheduleInputMode: 'text',
            scheduleDefaultInput: undefined
        })).toBe(false);
    });
    it('returns false when default input is rich-text empty', () => {
        expect((0, utils_1.canScheduleEnable)({
            scheduleCronExpression: '* * * * *',
            scheduleInputMode: 'text',
            scheduleDefaultInput: '<p></p>'
        })).toBe(false);
    });
    it('returns true when all conditions are valid (no end date)', () => {
        expect((0, utils_1.canScheduleEnable)({
            scheduleCronExpression: '0 9 * * 1-5',
            scheduleInputMode: 'text',
            scheduleDefaultInput: 'Generate the daily report'
        })).toBe(true);
    });
    it('returns true when all conditions are valid with future end date', () => {
        expect((0, utils_1.canScheduleEnable)({
            scheduleCronExpression: '0 9 * * 1-5',
            scheduleInputMode: 'text',
            scheduleDefaultInput: 'Generate the daily report',
            scheduleEndDate: futureDate
        })).toBe(true);
    });
    it('returns true for visual picker type when all fields are valid', () => {
        expect((0, utils_1.canScheduleEnable)({
            scheduleType: 'visualPicker',
            scheduleFrequency: 'daily',
            scheduleOnTime: '09:00',
            scheduleInputMode: 'text',
            scheduleDefaultInput: 'Run daily job'
        })).toBe(true);
    });
    describe("scheduleInputMode='form'", () => {
        it('returns false when no form fields are defined', () => {
            expect((0, utils_1.canScheduleEnable)({
                scheduleCronExpression: '0 9 * * 1-5',
                scheduleInputMode: 'form',
                scheduleFormInputTypes: []
            })).toBe(false);
        });
        it('returns true when at least one form field is defined (ignores empty defaultInput)', () => {
            expect((0, utils_1.canScheduleEnable)({
                scheduleCronExpression: '0 9 * * 1-5',
                scheduleInputMode: 'form',
                scheduleDefaultInput: '',
                scheduleFormInputTypes: [{ name: 'team', type: 'string', label: 'Team' }]
            })).toBe(true);
        });
    });
    describe("scheduleInputMode='none'", () => {
        it('returns true even with no default input and no form fields', () => {
            expect((0, utils_1.canScheduleEnable)({
                scheduleCronExpression: '0 9 * * 1-5',
                scheduleInputMode: 'none'
            })).toBe(true);
        });
        it('still rejects invalid cron', () => {
            expect((0, utils_1.canScheduleEnable)({
                scheduleCronExpression: 'not-a-cron',
                scheduleInputMode: 'none'
            })).toBe(false);
        });
        it('still rejects past end date', () => {
            expect((0, utils_1.canScheduleEnable)({
                scheduleCronExpression: '0 9 * * 1-5',
                scheduleInputMode: 'none',
                scheduleEndDate: pastDate
            })).toBe(false);
        });
    });
});
// ─── expandCronLForNodeCron ───────────────────────────────────────────────────
describe('expandCronLForNodeCron', () => {
    it('returns input verbatim when there is no L', () => {
        const result = (0, utils_1.expandCronLForNodeCron)('0 9 * * 1-5');
        expect(result).toEqual({ expression: '0 9 * * 1-5', hasL: false });
    });
    it('expands a standalone L in the day-of-month field to 28-31', () => {
        const result = (0, utils_1.expandCronLForNodeCron)('0 9 L * *');
        expect(result).toEqual({ expression: '0 9 28-31 * *', hasL: true });
    });
    it('expands L within a comma list, leaving other entries untouched', () => {
        const result = (0, utils_1.expandCronLForNodeCron)('0 9 1,15,L * *');
        expect(result).toEqual({ expression: '0 9 1,15,28-31 * *', hasL: true });
    });
    it('expands L correctly in a 6-field cron (DOM is at index 3)', () => {
        const result = (0, utils_1.expandCronLForNodeCron)('30 0 9 L * *');
        expect(result).toEqual({ expression: '30 0 9 28-31 * *', hasL: true });
    });
    it('does not touch L-like tokens in other positions', () => {
        // The malformed expression is left alone (validation is the caller's job).
        const result = (0, utils_1.expandCronLForNodeCron)('L 9 * * *');
        expect(result).toEqual({ expression: 'L 9 * * *', hasL: false });
    });
    it('returns input verbatim when field count is not 5 or 6', () => {
        // 4 fields → not a valid cron, no expansion attempted
        const result = (0, utils_1.expandCronLForNodeCron)('0 9 L *');
        expect(result.hasL).toBe(false);
        expect(result.expression).toBe('0 9 L *');
    });
    it('only expands the standalone `L` part, not substrings like `L5` or `LL`', () => {
        // These are not standalone "L"; they are passed through unchanged so the
        // upstream validator can reject them.
        const r1 = (0, utils_1.expandCronLForNodeCron)('0 9 L5 * *');
        expect(r1.hasL).toBe(false);
        expect(r1.expression).toBe('0 9 L5 * *');
        const r2 = (0, utils_1.expandCronLForNodeCron)('0 9 LL * *');
        expect(r2.hasL).toBe(false);
        expect(r2.expression).toBe('0 9 LL * *');
    });
    // ── deduplication of redundant numeric DOMs covered by `28-31` ─────
    it('drops standalone numeric days already covered by 28-31 (e.g. `31,L` → `28-31`)', () => {
        expect((0, utils_1.expandCronLForNodeCron)('0 9 31,L * *')).toEqual({ expression: '0 9 28-31 * *', hasL: true });
    });
    it('drops every numeric day in [28,31] when combined with L', () => {
        expect((0, utils_1.expandCronLForNodeCron)('0 9 28,29,30,31,L * *')).toEqual({ expression: '0 9 28-31 * *', hasL: true });
    });
    it('drops ranges entirely contained in [28,31] when combined with L', () => {
        expect((0, utils_1.expandCronLForNodeCron)('0 9 29-30,L * *')).toEqual({ expression: '0 9 28-31 * *', hasL: true });
    });
    it('keeps numeric days outside [28,31] alongside the appended 28-31', () => {
        expect((0, utils_1.expandCronLForNodeCron)('0 9 1,15,28,L * *')).toEqual({ expression: '0 9 1,15,28-31 * *', hasL: true });
    });
    it('keeps partially-overlapping ranges verbatim (e.g. 25-29 is not fully inside [28,31])', () => {
        // `25-29` partially overlaps with [28,31] but is left as-is — node-cron unions it with 28-31.
        expect((0, utils_1.expandCronLForNodeCron)('0 9 25-29,L * *')).toEqual({ expression: '0 9 25-29,28-31 * *', hasL: true });
    });
});
// ─── cronDomMatchesNow ────────────────────────────────────────────────────────
describe('cronDomMatchesNow', () => {
    it('returns true when DOM field has no L (no filtering needed)', () => {
        // A non-L expression: any date matches because the DOM field is `*`.
        expect((0, utils_1.cronDomMatchesNow)('0 9 * * *', new Date('2025-04-15T09:00:00Z'), 'UTC')).toBe(true);
    });
    it('returns true on the actual last day of a 31-day month', () => {
        // Jan has 31 days
        expect((0, utils_1.cronDomMatchesNow)('0 9 L * *', new Date('2025-01-31T09:00:00Z'), 'UTC')).toBe(true);
    });
    it('returns true on the last day of a 30-day month (Apr 30)', () => {
        expect((0, utils_1.cronDomMatchesNow)('0 9 L * *', new Date('2025-04-30T09:00:00Z'), 'UTC')).toBe(true);
    });
    it('returns false on day 30 of a 31-day month (not the last day)', () => {
        expect((0, utils_1.cronDomMatchesNow)('0 9 L * *', new Date('2025-01-30T09:00:00Z'), 'UTC')).toBe(false);
    });
    it('returns true on Feb 28 in a non-leap year', () => {
        expect((0, utils_1.cronDomMatchesNow)('0 9 L * *', new Date('2025-02-28T09:00:00Z'), 'UTC')).toBe(true);
    });
    it('returns false on Feb 28 in a leap year (Feb 29 is the actual last day)', () => {
        expect((0, utils_1.cronDomMatchesNow)('0 9 L * *', new Date('2024-02-28T09:00:00Z'), 'UTC')).toBe(false);
    });
    it('returns true on Feb 29 in a leap year', () => {
        expect((0, utils_1.cronDomMatchesNow)('0 9 L * *', new Date('2024-02-29T09:00:00Z'), 'UTC')).toBe(true);
    });
    it('honours timezone when resolving DOM', () => {
        // 2025-02-01T03:00:00Z is still Jan 31 22:00 in America/New_York (UTC-5).
        // For tz=America/New_York, the local DOM is 31 → matches L on a 31-day month.
        expect((0, utils_1.cronDomMatchesNow)('0 9 L * *', new Date('2025-02-01T03:00:00Z'), 'America/New_York')).toBe(true);
        // Same instant in UTC is Feb 1 → not the last day.
        expect((0, utils_1.cronDomMatchesNow)('0 9 L * *', new Date('2025-02-01T03:00:00Z'), 'UTC')).toBe(false);
    });
    it('matches a numeric DOM entry alongside L', () => {
        // `15,L` should match the 15th in any month
        expect((0, utils_1.cronDomMatchesNow)('0 9 15,L * *', new Date('2025-04-15T09:00:00Z'), 'UTC')).toBe(true);
        // …and the actual last day
        expect((0, utils_1.cronDomMatchesNow)('0 9 15,L * *', new Date('2025-04-30T09:00:00Z'), 'UTC')).toBe(true);
        // …but not the 16th
        expect((0, utils_1.cronDomMatchesNow)('0 9 15,L * *', new Date('2025-04-16T09:00:00Z'), 'UTC')).toBe(false);
    });
    it('falls back to UTC when timezone is invalid', () => {
        // Invalid timezone causes Intl.DateTimeFormat to throw; the catch block
        // uses UTC date components. Jan 31 UTC is the last day of January.
        expect((0, utils_1.cronDomMatchesNow)('0 9 L * *', new Date('2025-01-31T09:00:00Z'), 'Invalid/Zone')).toBe(true);
    });
});
//# sourceMappingURL=utils.test.js.map