"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const utils_1 = require("../../errors/utils");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const redisCache_1 = require("../../utils/redisCache");
// Short TTL: this is a dashboard number, not a source of truth — a few seconds of
// staleness is an acceptable trade for skipping the round-trip to Azure Postgres
// on every tab click / poll.
const STATS_CACHE_TTL_SECONDS = 20;
/**
 * Single-round-trip rollup for the Control Tower stats bar.
 * "Healthy"/"Needs Attention" are computed from each agent's MOST RECENT execution only
 * (via DISTINCT ON), not a historical average — an agent that just failed is "Needs Attention"
 * even if every prior run succeeded.
 */
const getStats = async (workspaceId) => {
    const cacheKey = `controlTower:stats:${workspaceId ?? 'none'}`;
    const cached = await (0, redisCache_1.getCached)(cacheKey);
    if (cached)
        return cached;
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const rows = await appServer.AppDataSource.query(`WITH agent_execs AS (
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
            `, [workspaceId ?? null]);
        const stats = rows[0];
        await (0, redisCache_1.setCached)(cacheKey, stats, STATS_CACHE_TTL_SECONDS);
        return stats;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: controlTowerService.getStats - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
// Backs the Control Tower stat tiles' click-through: which specific agents make up a bucket,
// for the Agents list page to filter down to. Same latest-execution-per-agent logic as getStats,
// just returning ids instead of a count — no separate cache, this is only hit on a stat-tile click.
const getAgentIdsByStatus = async (status, workspaceId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const baseCte = `WITH agent_execs AS (
                SELECT e."agentflowId", e."state", e."updatedDate"
                FROM execution e
                INNER JOIN chat_flow cf ON cf.id = e."agentflowId"
                WHERE e."workspaceId" = $1 AND cf."type" = 'AGENTFLOW'
            ),
            latest_exec AS (
                SELECT DISTINCT ON ("agentflowId") "agentflowId", "state"
                FROM agent_execs
                ORDER BY "agentflowId", "updatedDate" DESC
            )`;
        let query;
        if (status === 'healthy') {
            query = `${baseCte} SELECT "agentflowId" FROM latest_exec WHERE "state" = 'FINISHED'`;
        }
        else if (status === 'needsAttention') {
            query = `${baseCte} SELECT "agentflowId" FROM latest_exec WHERE "state" IN ('ERROR', 'TERMINATED', 'TIMEOUT')`;
        }
        else {
            query = `${baseCte} SELECT DISTINCT "agentflowId" FROM agent_execs WHERE "state" = 'INPROGRESS'`;
        }
        const rows = await appServer.AppDataSource.query(query, [workspaceId ?? null]);
        return rows.map((row) => row.agentflowId);
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: controlTowerService.getAgentIdsByStatus - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
exports.default = {
    getStats,
    getAgentIdsByStatus
};
//# sourceMappingURL=index.js.map