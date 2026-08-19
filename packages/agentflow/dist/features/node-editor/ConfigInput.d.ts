import { ComponentType } from 'react'
import { AsyncInputProps } from '../../atoms'
import { InputParam, NodeData } from '../../core/types'

export interface ConfigInputProps {
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
export declare function ConfigInput({
    data,
    inputParam,
    disabled,
    arrayIndex,
    parentArrayParam,
    onConfigChange,
    AsyncInputComponent
}: ConfigInputProps): import('react/jsx-runtime').JSX.Element | null
