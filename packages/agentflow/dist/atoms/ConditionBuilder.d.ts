import { InputParam, NodeData } from '../core/types'
import { VariableItem } from './VariablePicker'

export interface ConditionBuilderProps {
    inputParam: InputParam
    data: NodeData
    disabled?: boolean
    onDataChange?: (params: { inputParam: InputParam; newValue: unknown }) => void
    itemParameters?: InputParam[][]
    variableItems?: VariableItem[]
}
/**
 * Specialized array input for condition nodes.
 * Renders each condition with a label (Condition 0, Condition 1, ...) and an Else indicator.
 * isEmpty/notEmpty operations hide the Value 2 field via the existing field visibility system.
 */
export declare function ConditionBuilder({
    inputParam,
    data,
    disabled,
    onDataChange,
    itemParameters: itemParametersProp,
    variableItems
}: ConditionBuilderProps): import('react/jsx-runtime').JSX.Element
export default ConditionBuilder
