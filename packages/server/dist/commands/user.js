"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@oclif/core");
const DataSource = __importStar(require("../DataSource"));
const user_entity_1 = require("../enterprise/database/entities/user.entity");
const encryption_util_1 = require("../enterprise/utils/encryption.util");
const validation_util_1 = require("../enterprise/utils/validation.util");
const logger_1 = __importDefault(require("../utils/logger"));
const base_1 = require("./base");
class user extends base_1.BaseCommand {
    async run() {
        const { args } = await this.parse(user);
        let queryRunner;
        try {
            logger_1.default.info('Initializing DataSource');
            const dataSource = await DataSource.getDataSource();
            await dataSource.initialize();
            queryRunner = dataSource.createQueryRunner();
            await queryRunner.connect();
            if (args.email && args.password) {
                logger_1.default.info('Running resetPassword');
                await this.resetPassword(queryRunner, args.email, args.password);
            }
            else {
                logger_1.default.info('Running listUserEmails');
                await this.listUserEmails(queryRunner);
            }
        }
        catch (error) {
            logger_1.default.error(error);
        }
        finally {
            if (queryRunner && !queryRunner.isReleased)
                await queryRunner.release();
            await this.gracefullyExit();
        }
    }
    async listUserEmails(queryRunner) {
        logger_1.default.info('Listing all user emails');
        const users = await queryRunner.manager.find(user_entity_1.User, {
            select: ['email']
        });
        const emails = users.map((user) => user.email);
        logger_1.default.info(`Email addresses: ${emails.join(', ')}`);
        logger_1.default.info(`Email count: ${emails.length}`);
        logger_1.default.info('To reset user password, run the following command: pnpm user --email "myEmail" --password "myPassword"');
    }
    async resetPassword(queryRunner, email, password) {
        logger_1.default.info(`Finding user by email: ${email}`);
        const user = await queryRunner.manager.findOne(user_entity_1.User, {
            where: { email }
        });
        if (!user)
            throw new Error(`User not found with email: ${email}`);
        (0, validation_util_1.validatePasswordOrThrow)(password);
        user.credential = (0, encryption_util_1.getHash)(password);
        await queryRunner.manager.save(user);
        logger_1.default.info(`Password reset for user: ${email}`);
    }
}
user.args = {
    email: core_1.Args.string({
        description: 'Email address to search for in the user database'
    }),
    password: core_1.Args.string({
        description: 'New password for that user'
    })
};
exports.default = user;
//# sourceMappingURL=user.js.map