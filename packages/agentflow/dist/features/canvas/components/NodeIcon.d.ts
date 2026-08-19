import { NodeData } from '../../../core/types'

export interface NodeIconProps {
    data: NodeData
    apiBaseUrl: string
}
declare function NodeIconComponent({ data, apiBaseUrl }: NodeIconProps): import('react/jsx-runtime').JSX.Element
export declare const NodeIcon: import('react').MemoExoticComponent<typeof NodeIconComponent>
export {}
