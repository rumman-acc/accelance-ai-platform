/**
 * Returns a stable array of string keys that grows/shrinks with `length`,
 * plus a `removeKey(index)` helper for deletion handlers.
 *
 * Keys are held in state (persist across renders) and a local `effectiveKeys`
 * variable is returned so that newly generated keys are available in the same
 * render pass that triggered the growth — calling setState alone would only
 * take effect on the *next* render, leaving keys undefined in the current one.
 *
 * Safe in concurrent rendering: idCounterRef may skip numbers if a render is
 * abandoned, but keys remain unique.
 *
 * @param length  Current list length (e.g. `arrayItems.length`)
 * @param prefix  Key prefix string (e.g. `'item'` → `'item-0'`, `'item-1'`, …)
 */
export declare function useStableKeys(
    length: number,
    prefix: string
): {
    keys: string[]
    removeKey: (index: number) => void
}
