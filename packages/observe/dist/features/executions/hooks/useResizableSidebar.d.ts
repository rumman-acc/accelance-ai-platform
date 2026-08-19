interface UseResizableSidebarOptions {
    /** Width to use when the user has not yet dragged the handle. */
    defaultWidth: number;
    /** Minimum width (in px) the user can drag the sidebar to. */
    minWidth: number;
    /** Maximum width (in px) the user can drag the sidebar to. */
    maxWidth: number;
    /**
     * When true, dragging left grows the panel (and dragging right shrinks it).
     * Use for right-anchored panels like a right-side `<Drawer>` whose handle
     * sits on its LEFT edge. Defaults to false (left-anchored: drag right grows).
     */
    inverted?: boolean;
}
interface UseResizableSidebarResult {
    width: number;
    onMouseDown: (e: React.MouseEvent) => void;
}
/**
 * Drag-to-resize behavior for a horizontally-resizable sidebar. The width
 * follows `defaultWidth` (i.e., the viewport breakpoint) until the user drags
 * the handle, after which the width sticks to their choice and stops
 * reacting to viewport changes.
 *
 * Encapsulates: width state, drag-state refs, document-level mousemove /
 * mouseup listeners, and cleanup on unmount.
 */
export declare function useResizableSidebar({ defaultWidth, minWidth, maxWidth, inverted }: UseResizableSidebarOptions): UseResizableSidebarResult;
export {};
