import { InputParam } from '../types'

/**
 * Check if a ground value matches a comparison value using the same matrix
 * as the UI's _showHideOperation in genericHelper.js.
 *
 * Ground values are normalized to arrays so scalar and array inputs share
 * a single code path, reducing duplication.
 */
export declare function conditionMatches(groundValue: unknown, comparisonValue: unknown): boolean
/**
 * Evaluate whether a single param should be visible given current input values.
 */
export declare function evaluateParamVisibility(param: InputParam, inputValues: Record<string, unknown>, arrayIndex?: number): boolean
/**
 * Evaluate visibility for all params, returning new param objects with computed `display`.
 * Also filters individual options within `type: 'options'` params based on their own show/hide conditions.
 * Does not mutate the originals.
 */
export declare function evaluateFieldVisibility(
    params: InputParam[],
    inputValues: Record<string, unknown>,
    arrayIndex?: number
): InputParam[]
export declare function applyVisibleFieldDefaults(
    params: InputParam[],
    inputValues: Record<string, unknown>,
    arrayIndex?: number
): Record<string, unknown>
/**
 * Return a copy of inputValues with keys for hidden params removed.
 */
export declare function stripHiddenFieldValues(
    params: InputParam[],
    inputValues: Record<string, unknown>,
    arrayIndex?: number
): Record<string, unknown>
