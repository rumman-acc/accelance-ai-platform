"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const http_status_codes_1 = require("http-status-codes");
const typeorm_1 = require("typeorm");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const utils_1 = require("../../utils");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const sanitize_util_1 = require("../../utils/sanitize.util");
const telemetry_1 = require("../../utils/telemetry");
const user_entity_1 = require("../database/entities/user.entity");
const SessionPersistance_1 = require("../middleware/passport/SessionPersistance");
const encryption_util_1 = require("../utils/encryption.util");
const validation_util_1 = require("../utils/validation.util");
class UserService {
    constructor() {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        this.dataSource = appServer.AppDataSource;
        this.telemetry = appServer.telemetry;
    }
    validateUserId(id) {
        if ((0, validation_util_1.isInvalidUUID)(id))
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid User Id" /* UserErrorMessage.INVALID_USER_ID */);
    }
    async readUserById(id, queryRunner) {
        this.validateUserId(id);
        return await queryRunner.manager.findOneBy(user_entity_1.User, { id });
    }
    validateUserName(name) {
        if ((0, validation_util_1.isInvalidName)(name))
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid User Name" /* UserErrorMessage.INVALID_USER_NAME */);
    }
    validateUserEmail(email) {
        if ((0, validation_util_1.isInvalidEmail)(email))
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid User Email" /* UserErrorMessage.INVALID_USER_EMAIL */);
    }
    async readUserByEmail(email, queryRunner) {
        if (!email)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid User Email" /* UserErrorMessage.INVALID_USER_EMAIL */);
        this.validateUserEmail(email);
        return await queryRunner.manager.findOneBy(user_entity_1.User, { email: (0, typeorm_1.ILike)(email) });
    }
    async readUserByToken(token, queryRunner) {
        return await queryRunner.manager.findOneBy(user_entity_1.User, { tempToken: token });
    }
    validateUserStatus(status) {
        if (status && !Object.values(user_entity_1.UserStatus).includes(status))
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid User Status" /* UserErrorMessage.INVALID_USER_STATUS */);
    }
    async readUser(queryRunner) {
        return await queryRunner.manager.find(user_entity_1.User);
    }
    encryptUserCredential(credential) {
        if (!credential || (0, validation_util_1.isInvalidPassword)(credential))
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid Password" /* GeneralErrorMessage.INVALID_PASSWORD */);
        return (0, encryption_util_1.getHash)(credential);
    }
    async createNewUser(data, queryRunner) {
        const user = await this.readUserByEmail(data.email, queryRunner);
        if (user)
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "User Email Already Exists" /* UserErrorMessage.USER_EMAIL_ALREADY_EXISTS */);
        if (data.credential)
            data.credential = this.encryptUserCredential(data.credential);
        if (!data.name)
            data.name = data.email;
        this.validateUserName(data.name);
        if (data.status)
            this.validateUserStatus(data.status);
        data.id = (0, utils_1.generateId)();
        const createdById = data.createdBy;
        if (createdById) {
            const createdByUser = await this.readUserById(createdById, queryRunner);
            if (!createdByUser)
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found" /* UserErrorMessage.USER_NOT_FOUND */);
            data.createdBy = createdByUser.id;
            data.updatedBy = data.createdBy;
        }
        else {
            data.createdBy = data.id;
            data.updatedBy = data.id;
        }
        const userObj = queryRunner.manager.create(user_entity_1.User, data);
        this.telemetry.sendTelemetry(telemetry_1.TelemetryEventType.USER_CREATED, {
            userId: userObj.id,
            createdBy: userObj.createdBy
        }, userObj.id);
        return userObj;
    }
    async saveUser(data, queryRunner) {
        return await queryRunner.manager.save(user_entity_1.User, data);
    }
    async createUser(data) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        let newUser = await this.createNewUser(data, queryRunner);
        try {
            await queryRunner.startTransaction();
            newUser = await this.saveUser(newUser, queryRunner);
            await queryRunner.commitTransaction();
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
        return newUser;
    }
    async updateUser(newUserData, options) {
        let queryRunner;
        let updatedUser;
        try {
            queryRunner = this.dataSource.createQueryRunner();
            await queryRunner.connect();
            const oldUserData = await this.readUserById(newUserData.id, queryRunner);
            if (!oldUserData)
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found" /* UserErrorMessage.USER_NOT_FOUND */);
            const currentEmail = oldUserData.email;
            if (newUserData.updatedBy) {
                const updateUserData = await this.readUserById(newUserData.updatedBy, queryRunner);
                if (!updateUserData)
                    throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found" /* UserErrorMessage.USER_NOT_FOUND */);
            }
            if (newUserData.name) {
                this.validateUserName(newUserData.name);
            }
            if (newUserData.oldPassword && newUserData.newPassword && newUserData.confirmPassword) {
                if (!oldUserData.credential) {
                    throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid User Credential" /* UserErrorMessage.INVALID_USER_CREDENTIAL */);
                }
                // verify old password
                if (!(0, encryption_util_1.compareHash)(newUserData.oldPassword, oldUserData.credential)) {
                    throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid User Credential" /* UserErrorMessage.INVALID_USER_CREDENTIAL */);
                }
                if (newUserData.newPassword !== newUserData.confirmPassword) {
                    throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, "Passwords do not match" /* UserErrorMessage.PASSWORDS_DO_NOT_MATCH */);
                }
                newUserData.credential = this.encryptUserCredential(newUserData.newPassword);
                newUserData.tempToken = '';
                newUserData.tokenExpiry = undefined;
            }
            const safePatch = {
                createdBy: oldUserData.createdBy // always preserve from DB
            };
            if (newUserData.name) {
                safePatch.name = newUserData.name;
            }
            safePatch.updatedBy = newUserData.updatedBy; // always set (controller forces req.user.id)
            if (newUserData.oldPassword && newUserData.newPassword && newUserData.confirmPassword) {
                // credential/tempToken/tokenExpiry were set by the validated workflow above
                safePatch.credential = newUserData.credential;
                safePatch.tempToken = newUserData.tempToken;
                safePatch.tokenExpiry = newUserData.tokenExpiry;
            }
            updatedUser = queryRunner.manager.merge(user_entity_1.User, oldUserData, safePatch);
            await queryRunner.startTransaction();
            await this.saveUser(updatedUser, queryRunner);
            await queryRunner.commitTransaction();
            const passwordChanged = !!(newUserData.oldPassword && newUserData.newPassword && newUserData.confirmPassword);
            const emailChanged = !!(updatedUser.email && updatedUser.email !== currentEmail);
            if (emailChanged && updatedUser.email && options?.onEmailChanged) {
                await options.onEmailChanged(updatedUser.id, updatedUser.email);
            }
            if (passwordChanged || emailChanged) {
                await (0, SessionPersistance_1.destroyAllSessionsForUser)(updatedUser.id);
            }
        }
        catch (error) {
            if (queryRunner && queryRunner.isTransactionActive)
                await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            if (queryRunner && !queryRunner.isReleased)
                await queryRunner.release();
        }
        return (0, sanitize_util_1.sanitizeUser)(updatedUser);
    }
}
exports.UserService = UserService;
//# sourceMappingURL=user.service.js.map