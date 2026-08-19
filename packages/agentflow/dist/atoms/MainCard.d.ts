import { ReactNode } from 'react'
import { SxProps, Theme } from '@mui/material'

export interface MainCardProps {
    border?: boolean
    boxShadow?: boolean
    maxWidth?: 'full' | 'sm' | 'md'
    children?: ReactNode
    content?: boolean
    contentClass?: string
    contentSX?: SxProps<Theme>
    darkTitle?: boolean
    secondary?: ReactNode
    shadow?: string
    sx?: SxProps<Theme>
    title?: ReactNode
}
/**
 * Custom main card component for wrapping content
 */
export declare const MainCard: import('react').ForwardRefExoticComponent<MainCardProps & import('react').RefAttributes<HTMLDivElement>>
export default MainCard
