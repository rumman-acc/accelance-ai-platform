export interface NodeModelConfigsProps {
    inputs?: Record<string, unknown>
}
/**
 * Displays model configuration badges on a node
 */
declare function NodeModelConfigsComponent({ inputs }: NodeModelConfigsProps): import('react/jsx-runtime').JSX.Element | null
export declare const NodeModelConfigs: import('react').MemoExoticComponent<typeof NodeModelConfigsComponent>
export {}
