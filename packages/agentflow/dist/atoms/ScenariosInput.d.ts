import { InputParam, NodeData } from '../core/types'

export interface ScenariosInputProps {
    inputParam: InputParam
    data: NodeData
    disabled?: boolean
    onDataChange?: (params: { inputParam: InputParam; newValue: unknown }) => void
}
/**
 * Array input for ConditionAgent scenario strings.
 * Each entry creates a dynamic output anchor (e.g., Scenario 0, Scenario 1).
 * The UI also includes a visual indicator for the implicit "Else" case, which executes when no scenarios match.
 * Simpler than ConditionBuilder — each item has a single string field.
 */
export declare function ScenariosInput({
    inputParam,
    data,
    disabled,
    onDataChange
}: ScenariosInputProps): import('react/jsx-runtime').JSX.Element
export default ScenariosInput
