export interface UseNodeColorsOptions {
    nodeColor?: string
    selected?: boolean
    isDarkMode: boolean
    isHovered: boolean
}
export interface UseNodeColorsReturn {
    nodeColor: string
    stateColor: string
    backgroundColor: string
}
export declare function useNodeColors({ nodeColor: rawColor, selected, isDarkMode, isHovered }: UseNodeColorsOptions): UseNodeColorsReturn
