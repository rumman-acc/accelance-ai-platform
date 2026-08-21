import { Request, Response, NextFunction } from 'express'
import guardrailsService from '../../services/guardrails'
import auditLogService from '../../services/audit-log'
import { InternalAccelanceError } from '../../errors/internalAccelanceError'
import { StatusCodes } from 'http-status-codes'

const requireWorkspaceId = (req: Request): string => {
    const workspaceId = req.user?.activeWorkspaceId
    if (!workspaceId) {
        throw new InternalAccelanceError(StatusCodes.NOT_FOUND, `Error: guardrailsController - workspace not found!`)
    }
    return workspaceId
}

// POST /catalog (custom-catalog authoring) removed per Guardrails v2 §2.2. GET/POST/DELETE
// /policy are KEPT -- see services/guardrails/index.ts's file comment for why (the per-agent
// canvas panel and the /compliance page's data_retention_policy toggle both still depend on
// them for real, currently-working functionality).

const listCatalog = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const apiResponse = await guardrailsService.listDefinitions(requireWorkspaceId(req))
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

// Phase 3 authoring -- see services/guardrails/index.ts's createCustomDefinition doc comment.
// Explicit allowlist, same convention as toolsController.createTool: workspaceId/createdBy are
// never taken from the client body, and defaultObserveMode is not client-controllable at all
// (decision 5 -- observe-first is non-negotiable).
const createDefinition = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const workspaceId = requireWorkspaceId(req)
        const body = req.body || {}
        const params: Record<string, unknown> = {}
        if (body.key !== undefined) params.key = body.key
        if (body.name !== undefined) params.name = body.name
        if (body.description !== undefined) params.description = body.description
        if (body.kindKey !== undefined) params.kindKey = body.kindKey
        if (body.defaultParams !== undefined) params.defaultParams = body.defaultParams
        if (body.defaultOnFailAction !== undefined) params.defaultOnFailAction = body.defaultOnFailAction
        if (body.defaultFailMode !== undefined) params.defaultFailMode = body.defaultFailMode
        if (body.defaultTimeoutMs !== undefined) params.defaultTimeoutMs = body.defaultTimeoutMs

        const apiResponse = await guardrailsService.createCustomDefinition(workspaceId, params as any, req.user?.id)
        await auditLogService.record(workspaceId, req.user?.id, 'guardrail_definition.create', 'GuardrailDefinition', apiResponse.id, {
            key: apiResponse.key,
            kindKey: apiResponse.kindKey
        })
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const listPolicies = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const workspaceId = requireWorkspaceId(req)
        const chatflowId = req.query.chatflowId as string | undefined
        const apiResponse = await guardrailsService.listPolicies(workspaceId, chatflowId)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const upsertPolicy = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const workspaceId = requireWorkspaceId(req)
        const { chatflowId, catalogKey, enabled, config } = req.body || {}
        if (!catalogKey || typeof enabled !== 'boolean') {
            throw new InternalAccelanceError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: guardrailsController.upsertPolicy - catalogKey/enabled not provided!`
            )
        }
        const apiResponse = await guardrailsService.upsertPolicy(workspaceId, chatflowId, catalogKey, enabled, config, req.user?.id)
        await auditLogService.record(workspaceId, req.user?.id, 'guardrail_policy.upsert', 'GuardrailPolicy', apiResponse.id, {
            catalogKey,
            enabled,
            chatflowId: chatflowId || null
        })
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const deletePolicy = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.params.id) {
            throw new InternalAccelanceError(StatusCodes.PRECONDITION_FAILED, `Error: guardrailsController.deletePolicy - id not provided!`)
        }
        const apiResponse = await guardrailsService.deletePolicy(req.params.id, requireWorkspaceId(req))
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const getSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const workspaceId = requireWorkspaceId(req)
        if (!req.params.chatflowId) {
            throw new InternalAccelanceError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: guardrailsController.getSummary - chatflowId not provided!`
            )
        }
        const apiResponse = await guardrailsService.getSummary(workspaceId, req.params.chatflowId)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

export default {
    listCatalog,
    createDefinition,
    listPolicies,
    upsertPolicy,
    deletePolicy,
    getSummary
}
