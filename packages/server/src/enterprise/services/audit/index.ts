import { StatusCodes } from 'http-status-codes'
import { Between, In } from 'typeorm'
import { InternalAccelanceError } from '../../../errors/internalAccelanceError'
import { getErrorMessage } from '../../../errors/utils'
import { Platform } from '../../../Interface'
import { getRunningExpressApp } from '../../../utils/getRunningExpressApp'
import { LoginActivity } from '../../database/entities/EnterpriseEntities'
import { LoginActivityCode } from '../../Interface.Enterprise'

const PAGE_SIZE = 10

const aMonthAgo = () => {
    const date = new Date()
    date.setMonth(new Date().getMonth() - 1)
    return date
}

const setDateToStartOrEndOfDay = (dateTimeStr: string, setHours: 'start' | 'end') => {
    const date = new Date(dateTimeStr)
    if (isNaN(date.getTime())) {
        return undefined
    }
    setHours === 'start' ? date.setHours(0, 0, 0, 0) : date.setHours(23, 59, 59, 999)
    return date
}

const fetchLoginActivity = async (body: any, organizationId: string) => {
    try {
        const page = body.pageNo ? parseInt(body.pageNo) : 1
        const skip = (page - 1) * PAGE_SIZE
        const take = PAGE_SIZE
        const appServer = getRunningExpressApp()

        let fromDate
        if (body.startDate) fromDate = setDateToStartOrEndOfDay(body.startDate, 'start')

        let toDate
        if (body.endDate) toDate = setDateToStartOrEndOfDay(body.endDate, 'end')

        // Always scoped to the caller's own organization, derived server-side from their
        // session — never trust a client-supplied organizationId for this filter.
        const whereCondition: any = {
            organizationId,
            attemptedDateTime: Between(fromDate ?? aMonthAgo(), toDate ?? new Date())
        }
        if (body.activityCodes && body.activityCodes?.length > 0) {
            whereCondition['activityCode'] = In(body.activityCodes)
        }
        const count = await appServer.AppDataSource.getRepository(LoginActivity).count({
            where: whereCondition
        })
        const pagedResults = await appServer.AppDataSource.getRepository(LoginActivity).find({
            where: whereCondition,
            order: {
                attemptedDateTime: 'DESC'
            },
            skip,
            take
        })
        return {
            data: pagedResults,
            count: count,
            currentPage: page,
            pageSize: PAGE_SIZE
        }
    } catch (error) {
        throw new InternalAccelanceError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: auditService.getLoginActivity - ${getErrorMessage(error)}`
        )
    }
}

const recordLoginActivity = async (
    username: string,
    activityCode: LoginActivityCode,
    message: string,
    ssoProvider?: string,
    organizationId?: string
) => {
    try {
        const appServer = getRunningExpressApp()
        const platform = appServer.identityManager.getPlatformType()
        if (platform !== Platform.ENTERPRISE) {
            return
        }
        const loginMode = ssoProvider ?? 'Email/Password'
        const loginActivity = appServer.AppDataSource.getRepository(LoginActivity).create({
            username,
            activityCode,
            message,
            loginMode,
            organizationId
        })
        const result = await appServer.AppDataSource.getRepository(LoginActivity).save(loginActivity)
        return result
    } catch (error) {
        throw new InternalAccelanceError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: authService.loginActivity - ${getErrorMessage(error)}`)
    }
}

export default {
    recordLoginActivity,
    fetchLoginActivity
}
