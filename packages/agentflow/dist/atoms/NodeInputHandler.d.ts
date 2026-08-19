import { ComponentType } from 'react'
import { InputAnchor, InputParam, NodeData } from '../core/types'
import { VariableItem } from './VariablePicker'

/** Props passed to an async input component (asyncOptions / asyncMultiOptions). */
export interface AsyncInputProps {
    inputParam: InputParam
    value: unknown
    disabled: boolean
    onChange: (newValue: string) => void
    nodeName?: string
    nodeId?: string
    inputValues?: Record<string, unknown>
}
/** Props passed to a config input component (loadConfig accordion). */
export interface ConfigInputComponentProps {
    data: NodeData
    inputParam: InputParam
    disabled?: boolean
    arrayIndex?: number | null
    parentArrayParam?: InputParam | null
    onConfigChange: (
        configKey: string,
        configValues: Record<string, unknown>,
        arrayContext?: {
            parentParamName: string
            arrayIndex: number
        }
    ) => void
    AsyncInputComponent?: ComponentType<AsyncInputProps>
}
export interface NodeInputHandlerProps {
    inputAnchor?: InputAnchor
    inputParam?: InputParam
    data: NodeData
    disabled?: boolean
    isAdditionalParams?: boolean
    disablePadding?: boolean
    onDataChange?: (params: { inputParam: InputParam; newValue: unknown }) => void
    itemParameters?: InputParam[][]
    /** Renders asyncOptions / asyncMultiOptions fields. Lives in features/ to keep atoms free of infrastructure. */
    AsyncInputComponent?: ComponentType<AsyncInputProps>
    /** Renders loadConfig accordion beneath async dropdowns. Injected from features/ to keep atoms infrastructure-free. */
    ConfigInputComponent?: ComponentType<ConfigInputComponentProps>
    /** Callback for config value changes (from ConfigInputComponent). */
    onConfigChange?: (
        configKey: string,
        configValues: Record<string, unknown>,
        arrayContext?: {
            parentParamName: string
            arrayIndex: number
        }
    ) => void
    /** For array-based configs: index of current array item. */
    arrayIndex?: number | null
    /** For array-based configs: the parent array InputParam definition. */
    parentArrayParam?: InputParam | null
    /** Variable items for the VariablePicker popover (injected from features layer). */
    variableItems?: VariableItem[]
}
/**
 * Simplified input handler for agentflow nodes
 * Handles basic input types: string, number, password, boolean, options, array, single-select, multi-select.
 */
export declare function NodeInputHandler({
    inputAnchor,
    inputParam,
    data,
    disabled,
    isAdditionalParams,
    disablePadding,
    onDataChange,
    itemParameters,
    AsyncInputComponent,
    ConfigInputComponent,
    onConfigChange,
    arrayIndex,
    parentArrayParam,
    variableItems
}: NodeInputHandlerProps): import('react/jsx-runtime').JSX.Element
export default NodeInputHandler
