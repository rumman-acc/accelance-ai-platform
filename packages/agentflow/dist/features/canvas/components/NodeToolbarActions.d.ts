export interface NodeToolbarActionsProps {
    nodeId: string
    nodeName: string
    isVisible: boolean
    onInfoClick?: () => void
}
/**
 * Toolbar with action buttons for a node (duplicate, delete, info)
 */
declare function NodeToolbarActionsComponent({
    nodeId,
    nodeName,
    isVisible,
    onInfoClick
}: NodeToolbarActionsProps): import('react/jsx-runtime').JSX.Element
export declare const NodeToolbarActions: import('react').MemoExoticComponent<typeof NodeToolbarActionsComponent>
export {}
