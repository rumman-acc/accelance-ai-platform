import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { InternalAccelanceError } from '../../errors/internalAccelanceError'
import composioCatalogService from '../../services/composio-catalog'

const requireWorkspaceId = (req: Request): string => {
    const workspaceId = req.user?.activeWorkspaceId
    if (!workspaceId) {
        throw new InternalAccelanceError(StatusCodes.NOT_FOUND, `Error: composioCatalogController - workspace not found!`)
    }
    return workspaceId
}

const searchActions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const workspaceId = requireWorkspaceId(req)
        const credentialId = req.query.credentialId as string
        const query = (req.query.query as string) || ''
        if (!credentialId) {
            throw new InternalAccelanceError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: composioCatalogController.searchActions - credentialId not provided!`
            )
        }
        const apiResponse = await composioCatalogService.searchActions(credentialId, workspaceId, query)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const listConnections = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const workspaceId = requireWorkspaceId(req)
        const credentialId = req.query.credentialId as string
        const appName = req.query.appName as string
        if (!credentialId || !appName) {
            throw new InternalAccelanceError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: composioCatalogController.listConnections - credentialId/appName not provided!`
            )
        }
        const apiResponse = await composioCatalogService.listConnections(credentialId, workspaceId, appName)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const importAction = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const workspaceId = requireWorkspaceId(req)
        const orgId = req.user?.activeOrganizationId
        if (!orgId) {
            throw new InternalAccelanceError(
                StatusCodes.NOT_FOUND,
                `Error: composioCatalogController.importAction - organization not found!`
            )
        }
        if (!req.body) {
            throw new InternalAccelanceError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: composioCatalogController.importAction - body not provided!`
            )
        }
        const { credentialId, actionName, connectedAccountId } = req.body
        if (!credentialId || !actionName) {
            throw new InternalAccelanceError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: composioCatalogController.importAction - credentialId/actionName not provided!`
            )
        }
        const apiResponse = await composioCatalogService.importAction(credentialId, workspaceId, orgId, actionName, connectedAccountId)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

export default {
    searchActions,
    listConnections,
    importAction
}
