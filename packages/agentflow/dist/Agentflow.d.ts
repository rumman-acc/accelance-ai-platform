import { AgentFlowInstance, AgentflowProps } from './core/types'

/**
 * Main Agentflow component.
 * Renders an embeddable agentflow canvas with optional header and node palette.
 *
 * @example
 * ```tsx
 * import { Agentflow } from '@accelance/agentflow'
 * import '@accelance/agentflow/flowise.css'
 *
 * function App() {
 *   return (
 *     <Agentflow
 *       apiBaseUrl="https://flowise-url.com"
 *       token="your-auth-token"
 *       components={['agentAgentflow', 'llmAgentflow']}
 *     />
 *   )
 * }
 * ```
 */
export declare const Agentflow: import('react').ForwardRefExoticComponent<AgentflowProps & import('react').RefAttributes<AgentFlowInstance>>
export default Agentflow
