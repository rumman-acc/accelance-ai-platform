import { NodeData } from '../../../core/types'

export interface IterationNodeProps {
    data: NodeData
}
/**
 * Iteration Node component for loop/iteration nodes in the canvas
 */
declare function IterationNodeComponent({ data }: IterationNodeProps): import('react/jsx-runtime').JSX.Element
export declare const IterationNode: import('react').MemoExoticComponent<typeof IterationNodeComponent>
export default IterationNode
