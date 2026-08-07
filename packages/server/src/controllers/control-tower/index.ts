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

export default {
    getStats
}
