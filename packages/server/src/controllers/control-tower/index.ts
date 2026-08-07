import { Request, Response, NextFunction } from 'express'
import controlTowerService from '../../services/control-tower'

const getStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const workspaceId = req.user?.activeWorkspaceId
        const stats = await controlTowerService.getStats(workspaceId)
        return res.json(stats)
    } catch (error) {
        next(error)
    }
}

const getAgentIds = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const workspaceId = req.user?.activeWorkspaceId
        const status = req.query.status as 'healthy' | 'needsAttention' | 'runningNow'
        const agentflowIds = await controlTowerService.getAgentIdsByStatus(status, workspaceId)
        return res.json({ agentflowIds })
    } catch (error) {
        next(error)
    }
}

export default {
    getStats,
    getAgentIds
}
