"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const http_status_codes_1 = require("http-status-codes");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const account_service_1 = require("../services/account.service");
const user_service_1 = require("../services/user.service");
const tenantRequestGuards_1 = require("../utils/tenantRequestGuards");
class UserController {
    async create(req, res, next) {
        try {
            const userService = new user_service_1.UserService();
            const user = await userService.createUser(req.body);
            return res.status(http_status_codes_1.StatusCodes.CREATED).json(user);
        }
        catch (error) {
            next(error);
        }
    }
    async read(req, res, next) {
        let queryRunner;
        try {
            queryRunner = (0, getRunningExpressApp_1.getRunningExpressApp)().AppDataSource.createQueryRunner();
            await queryRunner.connect();
            const sessionUser = req.user;
            if (!sessionUser) {
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.UNAUTHORIZED, "User Not Found" /* UserErrorMessage.USER_NOT_FOUND */);
            }
            const query = req.query;
            const userService = new user_service_1.UserService();
            let user;
            if (query.id) {
                await (0, tenantRequestGuards_1.assertMayReadTargetUser)(sessionUser, query.id, queryRunner);
                user = await userService.readUserById(query.id, queryRunner);
                if (!user)
                    throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found" /* UserErrorMessage.USER_NOT_FOUND */);
            }
            else if (query.email) {
                const emailLc = (typeof query.email === 'string' ? query.email : '').trim().toLowerCase();
                const selfEmail = sessionUser.email?.trim().toLowerCase();
                if (!selfEmail || emailLc !== selfEmail) {
                    const byEmail = await userService.readUserByEmail(query.email, queryRunner);
                    if (!byEmail)
                        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found" /* UserErrorMessage.USER_NOT_FOUND */);
                    await (0, tenantRequestGuards_1.assertMayReadTargetUser)(sessionUser, byEmail.id, queryRunner);
                    user = byEmail;
                }
                else {
                    user = await userService.readUserByEmail(query.email, queryRunner);
                    if (!user)
                        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found" /* UserErrorMessage.USER_NOT_FOUND */);
                }
            }
            else {
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Unhandled Edge Case" /* GeneralErrorMessage.UNHANDLED_EDGE_CASE */);
            }
            if (user) {
                delete user.credential;
                delete user.tempToken;
                delete user.tokenExpiry;
            }
            return res.status(http_status_codes_1.StatusCodes.OK).json(user);
        }
        catch (error) {
            next(error);
        }
        finally {
            if (queryRunner)
                await queryRunner.release();
        }
    }
    async update(req, res, next) {
        try {
            const currentUser = req.user;
            if (!currentUser) {
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.UNAUTHORIZED, "User Not Found" /* UserErrorMessage.USER_NOT_FOUND */);
            }
            const { id } = req.body;
            if (currentUser.id !== id) {
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.FORBIDDEN, "User Not Found" /* UserErrorMessage.USER_NOT_FOUND */);
            }
            const accountService = new account_service_1.AccountService();
            const result = await accountService.updateAuthenticatedUserProfile(currentUser.id, req.body, (userId, newEmail) => accountService.syncStripeCustomerEmailAfterUserEmailChange(userId, newEmail));
            return res.status(http_status_codes_1.StatusCodes.OK).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async test(req, res, next) {
        try {
            return res.status(http_status_codes_1.StatusCodes.OK).json({ message: 'Hello World' });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.UserController = UserController;
//# sourceMappingURL=user.controller.js.map