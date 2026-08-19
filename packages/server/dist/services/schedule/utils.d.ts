/**
 * Pure utility functions for schedule management.
 * No server, database, or Express dependencies — safe to import and test in isolation.
 */
import type { ScheduleInputMode } from '../../Interface';
/**
 * Validates a cron expression and returns parsed info.
 * Uses a lightweight regex-based check without external dependencies.
 *
 * Supports extended 6-field cron: second minute hour day month weekday
 */
export declare const validateCronExpression: (expression: string, timezone?: string, minIntervalSeconds?: number) => {
    valid: boolean;
    error?: string;
};
/**
 * Computes the next Date after `after` (defaults to now) when the cron expression will fire.
 *
 * For 5-field cron expressions, searches minute-by-minute up to 1 year ahead.
 *
 * For 6-field cron expressions (with seconds), finds the next matching minute first,
 * then resolves the exact second within that minute. This supports sub-minute schedules
 * such as every 15 or 30 seconds (default minimum safe threshold: 60 seconds).
 *
 * The Intl.DateTimeFormat instance and parsed cron fields are created once before the loop
 * to avoid repeated allocations on every iteration.
 */
export declare const computeNextRunAt: (cronExpression: string, timezone?: string, after?: Date) => Date | null;
/**
 * `node-cron` does not understand the `L` token (last day of month). To stay
 * compatible across both BullMQ (cron-parser, supports `L`) and node-cron
 * scheduling backends, expand any standalone `L` part in the day-of-month
 * field to the candidate range `28-31`, while leaving the rest of the
 * expression untouched.
 *
 * The expanded expression is *only* meant to be handed to `node-cron`; the
 * original (un-expanded) expression should still be used for any actual
 * "does this date match?" decision via {@link cronDomMatchesNow}.
 *
 * @returns `{ expression, hasL }` — `expression` is the expanded cron string
 * (or the input verbatim if there was nothing to expand); `hasL` indicates
 * whether the input contained `L` and therefore needs runtime DOM filtering.
 */
export declare const expandCronLForNodeCron: (cronExpression: string) => {
    expression: string;
    hasL: boolean;
};
/**
 * Verify that the given `date`'s day-of-month (interpreted in `timezone`)
 * satisfies the day-of-month field of the *original* cron expression,
 * including the `L` token. Used to filter false-positive fires from
 * `node-cron` after expanding `L` → `28-31` via {@link expandCronLForNodeCron}.
 *
 * Returns `true` when the DOM matches (fire is legitimate) or when the
 * original expression contains no `L` (no filtering needed).
 */
export declare const cronDomMatchesNow: (cronExpression: string, date?: Date, timezone?: string) => boolean;
export interface VisualPickerInput {
    scheduleFrequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
    scheduleOnMinute?: string | number;
    scheduleOnTime?: string;
    scheduleOnDayOfWeek?: string;
    scheduleOnDayOfMonth?: string;
}
/**
 * Validate the visual-picker fields and return errors (if any).
 */
export declare const validateVisualPickerFields: (input: VisualPickerInput) => {
    valid: boolean;
    error?: string;
};
/**
 * Convert visual-picker fields into a standard 5-field cron expression.
 * Assumes fields have already been validated via validateVisualPickerFields.
 */
export declare const buildCronFromVisualPicker: (input: VisualPickerInput) => string;
/**
 * Unified helper: resolves the cron expression from a Start node's inputs,
 * handling both "cronExpression" and "visualPicker" schedule types.
 * Returns { valid, cronExpression?, error? }.
 */
export declare const resolveScheduleCron: (inputs: Record<string, any>) => {
    valid: boolean;
    cronExpression?: string;
    error?: string;
};
/**
 * Mode-aware schedule input validator.
 *  - 'text': requires a non-empty defaultInput (treats `<p></p>` — the rich-text empty marker — as empty).
 *  - 'form': requires at least one field defined in scheduleFormInputTypes.
 *  - 'none': always valid (flow opts out of receiving input).
 *
 */
export declare const isScheduleInputValid: (mode: ScheduleInputMode, defaultInput?: string, scheduleFormInputTypes?: any[]) => boolean;
/**
 * Determines if a schedule can be enabled based on its inputs: cron validity,
 * end date (must be in the future if set), and mode-specific input validity.
 */
export declare const canScheduleEnable: (inputs: Record<string, any>) => boolean;
