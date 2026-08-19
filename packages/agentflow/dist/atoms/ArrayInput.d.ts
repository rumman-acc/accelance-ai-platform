import { ComponentType } from 'react'
import { InputParam, NodeData } from '../core/types'
import { AsyncInputProps, ConfigInputComponentProps } from './NodeInputHandler'
import { VariableItem } from './VariablePicker'

export interface ArrayInputProps {
    inputParam: InputParam
    data: NodeData
    disabled?: boolean
    onDataChange?: (params: { inputParam: InputParam; newValue: unknown }) => void
    itemParameters?: InputParam[][]
    AsyncInputComponent?: ComponentType<AsyncInputProps>
    ConfigInputComponent?: ComponentType<ConfigInputComponentProps>
    onConfigChange?: (
        configKey: string,
        configValues: Record<string, unknown>,
        arrayContext?: {
            parentParamName: string
            arrayIndex: number
        }
    ) => void
    /** Variable items passed through to sub-field NodeInputHandlers for {{ autocomplete. */
    variableItems?: VariableItem[]
}
export declare function ArrayInput({
    inputParam,
    data,
    disabled,
    onDataChange,
    itemParameters: itemParametersProp,
    AsyncInputComponent,
    ConfigInputComponent,
    onConfigChange,
    variableItems
}: ArrayInputProps): import('react/jsx-runtime').JSX.Element
export default ArrayInput
