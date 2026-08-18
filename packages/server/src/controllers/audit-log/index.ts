import { Request, Response, NextFunction } from 'express'
import auditLogService from '../../services/audit-log'
import { InternalAccelanceError } from '../../errors/internalAccelanceError'
import { StatusCodes } from 'http-status-codes'

const list = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const workspaceId = req.user?.activeWorkspaceId
        if (!workspaceId) {
            throw new InternalAccelanceError(StatusCodes.NOT_FOUND, `Error: auditLogController.list - workspace not found!`)
        }
        const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50
        const apiResponse = await auditLogService.list(workspaceId, limit)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

export default {
    list
}
