import { InputParam, NodeData } from '../core/types'

declare const OUTPUT_TYPES: readonly [
    {
        readonly label: 'String'
        readonly value: 'string'
    },
    {
        readonly label: 'String Array'
        readonly value: 'stringArray'
    },
    {
        readonly label: 'Number'
        readonly value: 'number'
    },
    {
        readonly label: 'Boolean'
        readonly value: 'boolean'
    },
    {
        readonly label: 'Enum'
        readonly value: 'enum'
    },
    {
        readonly label: 'JSON Array'
        readonly value: 'jsonArray'
    }
]
type OutputType = (typeof OUTPUT_TYPES)[number]['value']
export interface StructuredOutputEntry {
    key: string
    type: OutputType
    enumValues?: string
    jsonSchema?: string
    description?: string
}
export interface StructuredOutputBuilderProps {
    inputParam: InputParam
    data: NodeData
    disabled?: boolean
    onDataChange?: (params: { inputParam: InputParam; newValue: unknown }) => void
}
/**
 * Specialized array input for structured output schemas (Agent + LLM nodes).
 * Each entry has a key text field, a type dropdown, optional conditional fields
 * (enum values, JSON schema), and a description field.
 */
export declare function StructuredOutputBuilder({
    inputParam,
    data,
    disabled,
    onDataChange
}: StructuredOutputBuilderProps): import('react/jsx-runtime').JSX.Element
export {}
