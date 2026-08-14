import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { InternalAccelanceError } from '../../errors/internalAccelanceError'
import mcpRegistryService from '../../services/mcp-registry'

const requireWorkspaceId = (req: Request): string => {
    const workspaceId = req.user?.activeWorkspaceId
    if (!workspaceId) {
        throw new InternalAccelanceError(StatusCodes.NOT_FOUND, `Error: mcpRegistryController - workspace not found!`)
    }
    return workspaceId
}

const searchServers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = (req.query.query as string) || ''
        const cursor = req.query.cursor as string | undefined
        const apiResponse = await mcpRegistryService.searchServers(query, cursor)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const importServer = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const workspaceId = requireWorkspaceId(req)
        const orgId = req.user?.activeOrganizationId
        if (!orgId) {
            throw new InternalAccelanceError(StatusCodes.NOT_FOUND, `Error: mcpRegistryController.importServer - organization not found!`)
        }
        if (!req.body) {
            throw new InternalAccelanceError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: mcpRegistryController.importServer - body not provided!`
            )
        }
        const { registryId, transport, headerValues, envValues } = req.body
        if (!registryId || (transport !== 'remote' && transport !== 'stdio')) {
            throw new InternalAccelanceError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: mcpRegistryController.importServer - registryId and a valid transport ("remote"|"stdio") are required!`
            )
        }
        const apiResponse = await mcpRegistryService.importServer(workspaceId, orgId, registryId, transport, headerValues, envValues)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

export default {
    searchServers,
    importServer
}
