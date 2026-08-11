import { Request, Response, NextFunction } from 'express'
import credentialAccessService from '../../services/credential-access'
import { InternalAccelanceError } from '../../errors/internalAccelanceError'
import { StatusCodes } from 'http-status-codes'

const listAccess = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.credentialId) {
            throw new InternalAccelanceError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: credentialAccessController.listAccess - credentialId not provided!`
            )
        }
        const workspaceId = req.user?.activeWorkspaceId
        if (!workspaceId) {
            throw new InternalAccelanceError(StatusCodes.NOT_FOUND, `Error: credentialAccessController.listAccess - workspace not found!`)
        }
        const apiResponse = await credentialAccessService.listAccessForCredential(req.params.credentialId, workspaceId)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const grantAccess = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.credentialId) {
            throw new InternalAccelanceError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: credentialAccessController.grantAccess - credentialId not provided!`
            )
        }
        if (!req.body?.userId) {
            throw new InternalAccelanceError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: credentialAccessController.grantAccess - userId not provided!`
            )
        }
        const workspaceId = req.user?.activeWorkspaceId
        if (!workspaceId) {
            throw new InternalAccelanceError(StatusCodes.NOT_FOUND, `Error: credentialAccessController.grantAccess - workspace not found!`)
        }
        const apiResponse = await credentialAccessService.grantAccess(req.params.credentialId, req.body.userId, workspaceId, req.user?.id)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const revokeAccess = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.credentialId || !req.params.userId) {
            throw new InternalAccelanceError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: credentialAccessController.revokeAccess - credentialId/userId not provided!`
            )
        }
        const workspaceId = req.user?.activeWorkspaceId
        if (!workspaceId) {
            throw new InternalAccelanceError(StatusCodes.NOT_FOUND, `Error: credentialAccessController.revokeAccess - workspace not found!`)
        }
        const apiResponse = await credentialAccessService.revokeAccess(req.params.credentialId, req.params.userId, workspaceId)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

export default {
    listAccess,
    grantAccess,
    revokeAccess
}
