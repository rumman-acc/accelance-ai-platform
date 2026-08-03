import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { InternalAccelanceError } from '../../../errors/internalAccelanceError'
import auditService from '../../services/audit'
import { getLoggedInUser } from '../../utils/tenantRequestGuards'

const fetchLoginActivity = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.body === 'undefined') {
            throw new InternalAccelanceError(StatusCodes.PRECONDITION_FAILED, `Error: auditService.fetchLoginHistory - body not provided!`)
        }
        const user = getLoggedInUser(req)
        const apiResponse = await auditService.fetchLoginActivity(req.body, user.activeOrganizationId)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

export default {
    fetchLoginActivity
}
