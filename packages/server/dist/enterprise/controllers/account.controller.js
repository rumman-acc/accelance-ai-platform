"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountController = void 0;
const http_status_codes_1 = require("http-status-codes");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const telemetry_1 = require("../../utils/telemetry");
const account_service_1 = require("../services/account.service");
class AccountController {
    async register(req, res, next) {
        try {
            const accountService = new account_service_1.AccountService();
            const sanitizedBody = sanitizeRegistrationDTO(req.body);
            const data = await accountService.register(sanitizedBody);
            return res.status(http_status_codes_1.StatusCodes.CREATED).json(data);
        }
        catch (error) {
            next(error);
        }
    }
    async invite(req, res, next) {
        try {
            const accountService = new account_service_1.AccountService();
            const data = await accountService.invite(req.body, req.user);
            return res.status(http_status_codes_1.StatusCodes.CREATED).json(data);
        }
        catch (error) {
            next(error);
        }
    }
    async verify(req, res, next) {
        try {
            const accountService = new account_service_1.AccountService();
            const data = await accountService.verify(req.body);
            return res.status(http_status_codes_1.StatusCodes.CREATED).json(data);
        }
        catch (error) {
            next(error);
        }
    }
    async resendVerificationEmail(req, res, next) {
        try {
            const accountService = new account_service_1.AccountService();
            const data = await accountService.resendVerificationEmail(req.body);
            return res.status(http_status_codes_1.StatusCodes.CREATED).json(data);
        }
        catch (error) {
            next(error);
        }
    }
    async confirmEmailChange(req, res, next) {
        try {
            const accountService = new account_service_1.AccountService();
            const data = await accountService.confirmEmailChange(req.body);
            return res.status(http_status_codes_1.StatusCodes.OK).json(data);
        }
        catch (error) {
            next(error);
        }
    }
    async forgotPassword(req, res, next) {
        try {
            const accountService = new account_service_1.AccountService();
            const data = await accountService.forgotPassword(req.body);
            return res.status(http_status_codes_1.StatusCodes.CREATED).json(data);
        }
        catch (error) {
            next(error);
        }
    }
    async resetPassword(req, res, next) {
        try {
            const accountService = new account_service_1.AccountService();
            const data = await accountService.resetPassword(req.body);
            return res.status(http_status_codes_1.StatusCodes.OK).json(data);
        }
        catch (error) {
            next(error);
        }
    }
    async createStripeCustomerPortalSession(req, res, next) {
        try {
            const { url: portalSessionUrl } = await (0, getRunningExpressApp_1.getRunningExpressApp)().identityManager.createStripeCustomerPortalSession(req);
            return res.status(http_status_codes_1.StatusCodes.OK).json({ url: portalSessionUrl });
        }
        catch (error) {
            next(error);
        }
    }
    async logout(req, res, next) {
        try {
            if (req.user) {
                const accountService = new account_service_1.AccountService();
                await accountService.logout(req.user);
                if (req.isAuthenticated()) {
                    req.logout((err) => {
                        if (err) {
                            return res.status(500).json({ message: 'Logout failed' });
                        }
                        req.session.destroy((err) => {
                            if (err) {
                                return res.status(500).json({ message: 'Failed to destroy session' });
                            }
                        });
                    });
                }
                else {
                    clearAuthCookies(res);
                    return res.redirect('/login');
                }
            }
            clearAuthCookies(res);
            return res.status(200).json({ message: 'logged_out', redirectTo: `/login` });
        }
        catch (error) {
            next(error);
        }
    }
    async delete(req, res, next) {
        let queryRunner;
        try {
            const { confirmationText } = req.body;
            if (confirmationText !== 'permanently delete') {
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Confirmation text must match "permanently delete"');
            }
            queryRunner = (0, getRunningExpressApp_1.getRunningExpressApp)().AppDataSource.createQueryRunner();
            await queryRunner.connect();
            if (!req.user || !req.ip)
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Unauthorized" /* GeneralErrorMessage.UNAUTHORIZED */);
            const accountService = new account_service_1.AccountService();
            await accountService.delete(queryRunner, req.user, req.ip);
            return res.status(http_status_codes_1.StatusCodes.OK).json({ message: 'Account deleted' });
        }
        catch (error) {
            if (queryRunner && queryRunner.isTransactionActive)
                await queryRunner.rollbackTransaction();
            await (0, telemetry_1.emitEvent)({
                category: telemetry_1.TelemetryEventCategory.AUDIT,
                eventType: 'account-deleted',
                actionType: 'delete',
                userId: req.user?.id ?? 'unknown',
                orgId: req.user?.activeOrganizationId ?? 'unknown',
                resourceId: req.user?.id ?? 'unknown',
                ipAddress: req.ip,
                result: telemetry_1.TelemetryEventResult.FAILED,
                metadata: {
                    failureReason: error instanceof internalAccelanceError_1.InternalAccelanceError ? error.message : 'internal_error'
                }
            });
            next(error);
        }
        finally {
            if (queryRunner && !queryRunner.isReleased)
                await queryRunner.release();
        }
    }
}
exports.AccountController = AccountController;
function sanitizeRegistrationDTO(data) {
    const sanitized = {
        user: {},
        organization: {},
        organizationUser: {},
        workspace: {},
        workspaceUser: {},
        role: {}
    };
    // Strict allowlist: only fields a client may supply during registration.
    // Never accept server-managed fields: id, createdBy, updatedBy, createdDate, updatedDate, status, tokenExpiry.
    const allowedUserFields = ['name', 'email', 'credential', 'tempToken'];
    if (data.user && typeof data.user === 'object' && !Array.isArray(data.user)) {
        for (const field of allowedUserFields) {
            const value = data.user[field];
            if (value != null) {
                sanitized.user[field] = value;
            }
        }
        if (data.user.referral != null) {
            sanitized.user.referral = data.user.referral;
        }
    }
    // Allow organization.name for Enterprise owner registration (the only path that doesn't hardcode it).
    const allowedOrgFields = ['name'];
    if (data.organization && typeof data.organization === 'object' && !Array.isArray(data.organization)) {
        for (const field of allowedOrgFields) {
            const value = data.organization[field];
            if (value != null) {
                sanitized.organization[field] = value;
            }
        }
    }
    return sanitized;
}
function clearAuthCookies(res) {
    res.clearCookie('connect.sid');
    res.clearCookie('token');
    res.clearCookie('refreshToken');
}
//# sourceMappingURL=account.controller.js.map