import { ComponentType } from 'react'
import { FabProps } from '@mui/material'

export interface StyledFabProps extends FabProps {
    gradient?: boolean
}
/**
 * Styled floating action button with hover effects
 * Supports gradient background for special actions like Generate
 */
export declare const StyledFab: ComponentType<StyledFabProps>
export default StyledFab
