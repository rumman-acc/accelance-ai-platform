import { NodeData } from '../../../core/types'

export interface StickyNoteProps {
    data: NodeData
}
/**
 * Sticky Note node component for adding notes to the canvas
 */
declare function StickyNoteComponent({ data }: StickyNoteProps): import('react/jsx-runtime').JSX.Element
export declare const StickyNote: import('react').MemoExoticComponent<typeof StickyNoteComponent>
export default StickyNote
