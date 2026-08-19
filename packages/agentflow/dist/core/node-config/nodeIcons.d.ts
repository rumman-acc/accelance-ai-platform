import { ComponentType } from 'react'

type IconComponent = ComponentType<any>
export interface AgentflowIcon {
    name: string
    icon: IconComponent
    color: string
}
export declare const AGENTFLOW_ICONS: AgentflowIcon[]
/**
 * Default node types that are always available
 */
export declare const DEFAULT_AGENTFLOW_NODES: string[]
export {}
