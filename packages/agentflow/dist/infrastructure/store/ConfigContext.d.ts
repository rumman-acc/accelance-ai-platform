import { ReactNode } from 'react'
import { ConfigContextValue } from '../../core/types'

declare const ConfigContext: import('react').Context<ConfigContextValue | null>
interface ConfigProviderProps {
    isDarkMode?: boolean
    components?: string[]
    readOnly?: boolean
    children: ReactNode
}
export declare function ConfigProvider({
    isDarkMode,
    components,
    readOnly,
    children
}: ConfigProviderProps): import('react/jsx-runtime').JSX.Element
export declare function useConfigContext(): ConfigContextValue
export { ConfigContext }
