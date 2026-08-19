import { HeaderRenderProps, ValidationResult } from '../../../core/types'

export interface AgentflowHeaderProps extends HeaderRenderProps {
    readOnly?: boolean
}
/**
 * Default header component for the Agentflow canvas
 */
export declare function AgentflowHeader({
    flowName,
    isDirty,
    readOnly,
    onSave
}: AgentflowHeaderProps): import('react/jsx-runtime').JSX.Element
/**
 * Creates header props from agentflow state and handlers
 */
export declare function createHeaderProps(
    flowName: string,
    isDirty: boolean,
    onSave: () => void,
    toJSON: () => string,
    validate: () => ValidationResult
): HeaderRenderProps
