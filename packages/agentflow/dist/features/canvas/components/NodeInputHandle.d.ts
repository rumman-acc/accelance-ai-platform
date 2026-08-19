export interface NodeInputHandleProps {
    nodeId: string
    nodeColor: string
    hidden?: boolean
}
/**
 * Input handle component for agent flow nodes
 * Note: Uses inline styles because ReactFlow's Handle component doesn't support sx prop
 */
declare function NodeInputHandleComponent({
    nodeId,
    nodeColor,
    hidden
}: NodeInputHandleProps): import('react/jsx-runtime').JSX.Element | null
export declare const NodeInputHandle: import('react').MemoExoticComponent<typeof NodeInputHandleComponent>
export {}
