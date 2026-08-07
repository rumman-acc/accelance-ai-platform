import { StatusCodes } from 'http-status-codes'
import { InternalAccelanceError } from '../../errors/internalAccelanceError'
import { getErrorMessage } from '../../errors/utils'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import { getCached, setCached } from '../../utils/redisCache'

export interface ControlTowerStats {
    totalAgents: number
    healthy: number
    needsAttention: number
    runningNow: number
    awaitingApproval: number
}

// Short TTL: this is a dashboard number, not a source of truth — a few seconds of
// staleness is an acceptable trade for skipping the round-trip to Azure Postgres
// on every tab click / poll.
const STATS_CACHE_TTL_SECONDS = 20

/**
 * Single-round-trip rollup for the Control Tower stats bar.
 * "Healthy"/"Needs Attention" are computed from each agent's MOST RECENT execution only
 * (via DISTINCT ON), not a historical average — an agent that just failed is "Needs Attention"
 * even if every prior run succeeded.
 */
const getStats = async (workspaceId?: string): Promise<ControlTowerStats> => {
    const cacheKey = `controlTower:stats:${workspaceId ?? 'none'}`
    const cached = await getCached<ControlTowerStats>(cacheKey)
    if (cached) return cached

    try {
        const appServer = getRunningExpressApp()
        const rows = await appServer.AppDataSource.query(
            `WITH agent_execs AS (
                -- Inner join against chat_flow so a deleted/renamed agent's leftover execution
                -- rows never inflate these counts — every number here is scoped to agents that
                -- currently exist and are still of type AGENTFLOW.
                SELECT e."agentflowId", e."state", e."updatedDate"
                FROM execution e
                INNER JOIN chat_flow cf ON cf.id = e."agentflowId"
                WHERE e."workspaceId" = $1 AND cf."type" = 'AGENTFLOW'
            ),
            latest_exec AS (
                SELECT DISTINCT ON ("agentflowId") "agentflowId", "state"
                FROM agent_execs
                ORDER BY "agentflowId", "updatedDate" DESC
            )
            SELECT
                (SELECT COUNT(*) FROM chat_flow WHERE "workspaceId" = $1 AND "type" = 'AGENTFLOW')::int AS "totalAgents",
                (SELECT COUNT(*) FROM latest_exec WHERE "state" = 'FINISHED')::int AS "healthy",
                (SELECT COUNT(*) FROM latest_exec WHERE "state" IN ('ERROR', 'TERMINATED', 'TIMEOUT'))::int AS "needsAttention",
                (SELECT COUNT(*) FROM agent_execs WHERE "state" = 'INPROGRESS')::int AS "runningNow",
                (SELECT COUNT(*) FROM agent_execs WHERE "state" = 'STOPPED')::int AS "awaitingApproval"
            `,
            [workspaceId ?? null]
        )
        const stats = rows[0]
        await setCached(cacheKey, stats, STATS_CACHE_TTL_SECONDS)
        return stats
    } catch (error) {
        throw new InternalAccelanceError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: controlTowerService.getStats - ${getErrorMessage(error)}`
        )
    }
}

export default {
    getStats
}
