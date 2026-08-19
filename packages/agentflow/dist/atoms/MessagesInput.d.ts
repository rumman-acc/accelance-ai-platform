import { InputParam, NodeData } from '../core/types'
import { VariableItem } from './VariablePicker'

declare const MESSAGE_ROLES: readonly [
    {
        readonly label: 'System'
        readonly value: 'system'
    },
    {
        readonly label: 'Assistant'
        readonly value: 'assistant'
    },
    {
        readonly label: 'Developer'
        readonly value: 'developer'
    },
    {
        readonly label: 'User'
        readonly value: 'user'
    }
]
type MessageRole = (typeof MESSAGE_ROLES)[number]['value']
export interface MessageEntry {
    role: MessageRole | ''
    content: string
}
export interface MessagesInputProps {
    inputParam: InputParam
    data: NodeData
    disabled?: boolean
    /** Variable items for `{{ }}` autocomplete in message content fields. */
    variableItems?: VariableItem[]
    onDataChange?: (params: { inputParam: InputParam; newValue: unknown }) => void
}
/**
 * Specialized array input for message entries (Agent + LLM nodes).
 * Each entry has a role dropdown (system/assistant/developer/user)
 * and a multiline content textarea with variable support ({{ variable }} syntax).
 */
export declare function MessagesInput({
    inputParam,
    data,
    disabled,
    variableItems,
    onDataChange
}: MessagesInputProps): import('react/jsx-runtime').JSX.Element
export {}
