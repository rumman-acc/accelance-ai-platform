import { RefObject } from 'react'
import { OutputAnchor } from '../../../core/types'

export interface NodeOutputHandlesProps {
    outputAnchors: OutputAnchor[]
    nodeColor: string
    isHovered: boolean
    nodeRef: RefObject<HTMLDivElement | null>
    nodeId: string
}
/**
 * Calculate the minimum height needed for a node based on output anchor count
 */
export declare function getMinimumNodeHeight(outputCount: number): number
/**
 * Output handles component for agent flow nodes
 * Note: Uses inline styles because ReactFlow's Handle component doesn't support sx prop
 */
declare function NodeOutputHandlesComponent({
    outputAnchors,
    nodeColor,
    isHovered,
    nodeRef,
    nodeId
}: NodeOutputHandlesProps): import('react/jsx-runtime').JSX.Element
export declare const NodeOutputHandles: import('react').MemoExoticComponent<typeof NodeOutputHandlesComponent>
export {}
