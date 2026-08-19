import { NodeDataSchema } from '../../core/types'

interface NodeListItemProps {
    node: NodeDataSchema
    apiBaseUrl: string
    isLast: boolean
    onDragStart: (event: React.DragEvent, node: NodeDataSchema) => void
    onClick: (node: NodeDataSchema) => void
}
declare function NodeListItemComponent({
    node,
    apiBaseUrl,
    isLast,
    onDragStart,
    onClick
}: NodeListItemProps): import('react/jsx-runtime').JSX.Element
export declare const NodeListItem: import('react').MemoExoticComponent<typeof NodeListItemComponent>
export {}
