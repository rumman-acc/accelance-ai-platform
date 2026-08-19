import { RefObject } from 'react'

/**
 * Calculates the maximum height for a drawer based on its rendered position in the viewport.
 * Recalculates on window resize.
 *
 * @param open - Whether the drawer is currently open
 * @param ref - Ref to the element whose position is measured
 * @param bottomPadding - Padding from the viewport bottom (defaults to tokens.spacing.xxl)
 */
export declare function useDrawerMaxHeight(open: boolean, ref: RefObject<HTMLElement | null>, bottomPadding?: 24): number | undefined
