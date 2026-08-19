export interface DrawerWidthOverrides {
    defaultWidth?: number;
    minWidth?: number;
    maxWidth?: number;
}
export interface ResolvedDrawerWidths {
    minWidth: number;
    maxWidth: number;
    defaultWidth: number;
}
/**
 * Resolves the drawer width triple from optional consumer overrides + the
 * current viewport. The returned `defaultWidth` is always clamped into
 * `[minWidth, maxWidth]` so an inconsistent override (e.g.
 * `defaultWidth=200, minWidth=400`) doesn't initialize below the floor.
 *
 * Memoized on the three override fields, so passing a fresh `drawer` object
 * literal each render does NOT recompute (or shake the downstream
 * `useResizableSidebar` width state).
 */
export declare function useDrawerWidths(overrides: DrawerWidthOverrides | undefined): ResolvedDrawerWidths;
