import { AgentFlowInstance } from './core/types'

/**
 * Hook for programmatic access to the Agentflow instance.
 * Provides methods for getting flow data, validation, and canvas manipulation.
 *
 * @example
 * ```tsx
 * function ControlPanel() {
 *   const agentflow = useAgentflow()
 *
 *   const handleSave = () => {
 *     const flow = agentflow.getFlow()
 *     console.log('Saving flow:', flow)
 *   }
 *
 *   const handleValidate = () => {
 *     const result = agentflow.validate()
 *     if (!result.valid) {
 *       console.error('Validation errors:', result.errors)
 *     }
 *   }
 *
 *   return (
 *     <div>
 *       <button onClick={handleSave}>Save</button>
 *       <button onClick={handleValidate}>Validate</button>
 *       <button onClick={() => agentflow.fitView()}>Fit View</button>
 *     </div>
 *   )
 * }
 * ```
 */
export declare function useAgentflow(): AgentFlowInstance
export default useAgentflow
