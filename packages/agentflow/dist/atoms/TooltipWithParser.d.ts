import { SxProps } from '@mui/material'

export interface TooltipWithParserProps {
    title: string
    sx?: SxProps
}
/**
 * An info-icon tooltip that parses HTML in the title string.
 * Mirrors the original Flowise TooltipWithParser component.
 */
export declare function TooltipWithParser({ title, sx }: TooltipWithParserProps): import('react/jsx-runtime').JSX.Element
