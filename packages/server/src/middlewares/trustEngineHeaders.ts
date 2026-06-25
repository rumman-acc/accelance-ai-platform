import { NextFunction, Request, Response } from 'express'
import { LoggedInUser } from '../enterprise/Interface.Enterprise'

// Used when ACCELANCE_ENGINE_MODE=true.
// NestJS API validates auth and injects these headers before proxying to the engine.
// The engine trusts them unconditionally — never expose the engine's port publicly.
export const trustEngineHeaders = (req: Request, res: Response, next: NextFunction) => {
    const workspaceId = req.headers['x-workspace-id'] as string
    const tenantId = req.headers['x-tenant-id'] as string
    const userId = req.headers['x-user-id'] as string
    const userRole = req.headers['x-user-role'] as string

    if (!workspaceId || !tenantId) {
        return res.status(401).json({ error: 'Missing engine context headers (x-workspace-id, x-tenant-id)' })
    }

    // isOrganizationAdmin=true bypasses all checkPermission / checkAnyPermission guards.
    // The NestJS API already enforced the user's actual RBAC before proxying here.
    ;(req as any).user = {
        id: userId || '',
        email: '',
        name: '',
        roleId: userRole || '',
        activeOrganizationId: tenantId,
        activeOrganizationSubscriptionId: '',
        activeOrganizationCustomerId: '',
        activeOrganizationProductId: '',
        isOrganizationAdmin: true,
        activeWorkspaceId: workspaceId,
        activeWorkspace: '',
        assignedWorkspaces: [],
        permissions: ['*'],
        features: {}
    } satisfies LoggedInUser

    next()
}
