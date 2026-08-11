import { Request, Response, NextFunction } from 'express'
import toolPolicyService from '../../services/tool-policy'
import { AgentToolPolicyEffect } from '../../database/entities/AgentToolPolicy'
import { InternalAccelanceError } from '../../errors/internalAccelanceError'
import { StatusCodes } from 'http-status-codes'

const listPolicies = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const workspaceId = req.user?.activeWorkspaceId
        if (!workspaceId) {
            throw new InternalAccelanceError(StatusCodes.NOT_FOUND, `Error: toolPolicyController.listPolicies - workspace not found!`)
        }
        const chatflowId = req.query.chatflowId as string | undefined
        const apiResponse = await toolPolicyService.listPolicies(workspaceId, chatflowId)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const upsertPolicy = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const workspaceId = req.user?.activeWorkspaceId
        if (!workspaceId) {
            throw new InternalAccelanceError(StatusCodes.NOT_FOUND, `Error: toolPolicyController.upsertPolicy - workspace not found!`)
        }
        const { chatflowId, toolNodeName, effect } = req.body || {}
        if (!toolNodeName || !effect) {
            throw new InternalAccelanceError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: toolPolicyController.upsertPolicy - toolNodeName/effect not provided!`
            )
        }
        if (effect !== AgentToolPolicyEffect.ALLOW && effect !== AgentToolPolicyEffect.DENY) {
            throw new InternalAccelanceError(StatusCodes.BAD_REQUEST, `Error: toolPolicyController.upsertPolicy - invalid effect!`)
        }
        const apiResponse = await toolPolicyService.upsertPolicy(workspaceId, chatflowId, toolNodeName, effect, req.user?.id)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const deletePolicy = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.params.id) {
            throw new InternalAccelanceError(StatusCodes.PRECONDITION_FAILED, `Error: toolPolicyController.deletePolicy - id not provided!`)
        }
        const workspaceId = req.user?.activeWorkspaceId
        if (!workspaceId) {
            throw new InternalAccelanceError(StatusCodes.NOT_FOUND, `Error: toolPolicyController.deletePolicy - workspace not found!`)
        }
        const apiResponse = await toolPolicyService.deletePolicy(req.params.id, workspaceId)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

export default {
    listPolicies,
    upsertPolicy,
    deletePolicy
}
