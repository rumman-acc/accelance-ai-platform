import { Position } from 'reactflow'

export interface ConnectionLineProps {
    fromX: number
    fromY: number
    toX: number
    toY: number
    fromPosition: Position
    toPosition: Position
}
/**
 * Connection line component for rendering active connections while dragging
 */
declare function ConnectionLineComponent({
    fromX,
    fromY,
    toX,
    toY,
    fromPosition,
    toPosition
}: ConnectionLineProps): import('react/jsx-runtime').JSX.Element
export declare const ConnectionLine: import('react').MemoExoticComponent<typeof ConnectionLineComponent>
export default ConnectionLine
