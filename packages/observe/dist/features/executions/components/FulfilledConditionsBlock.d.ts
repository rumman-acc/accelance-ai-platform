import { ConditionEntry } from '../../../core/types';

interface FulfilledConditionsBlockProps {
    conditions: ConditionEntry[];
    isDarkMode: boolean;
}
/**
 * Renders only the fulfilled entries from a condition node's
 * `data.output.conditions` array — success-bordered boxes with a "Fulfilled"
 * chip. The "else" branch (string/equal with both values empty) shows a
 * sentence-style label; other branches show "Condition {n}" using the index
 * from the original `conditions` array, so the displayed number matches the
 * branch the user configured in the Condition node editor.
 *
 * PARITY: deviation — legacy `renderFullfilledConditions` filtered first then
 * indexed by post-filter position, which mislabeled "branch 2 fired" as
 * "Condition 0". Iterating over the original array fixes that.
 */
export declare function FulfilledConditionsBlock({ conditions, isDarkMode }: FulfilledConditionsBlockProps): import("react/jsx-runtime").JSX.Element | null;
export {};
