import { NodeDataSchema } from '../../core/types'

export interface AddNodesDrawerProps {
    /** Available nodes to display */
    nodes: NodeDataSchema[]
    /** Callback when a node drag starts */
    onDragStart?: (event: React.DragEvent, node: NodeDataSchema) => void
    /** Callback when a node is clicked (alternative to drag) */
    onNodeClick?: (node: NodeDataSchema) => void
}
/**
 * Add Nodes Drawer - Slide-out panel with draggable nodes
 */
declare function AddNodesDrawerComponent({ nodes, onDragStart, onNodeClick }: AddNodesDrawerProps): import('react/jsx-runtime').JSX.Element
export declare const AddNodesDrawer: import('react').MemoExoticComponent<typeof AddNodesDrawerComponent>
export default AddNodesDrawer
