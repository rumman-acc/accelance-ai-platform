"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const http_status_codes_1 = require("http-status-codes");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const UpsertHistory_1 = require("../../database/entities/UpsertHistory");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const utils_1 = require("../../errors/utils");
const chatflows_1 = __importDefault(require("../chatflows"));
const getAllUpsertHistory = async (sortOrder, chatflowid, startDate, endDate) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        let createdDateQuery;
        if (startDate || endDate) {
            if (startDate && endDate) {
                createdDateQuery = (0, typeorm_1.Between)(new Date(startDate), new Date(endDate));
            }
            else if (startDate) {
                createdDateQuery = (0, typeorm_1.MoreThanOrEqual)(new Date(startDate));
            }
            else if (endDate) {
                createdDateQuery = (0, typeorm_1.LessThanOrEqual)(new Date(endDate));
            }
        }
        let upsertHistory = await appServer.AppDataSource.getRepository(UpsertHistory_1.UpsertHistory).find({
            where: {
                chatflowid,
                date: createdDateQuery
            },
            order: {
                date: sortOrder === 'DESC' ? 'DESC' : 'ASC'
            }
        });
        upsertHistory = upsertHistory.map((hist) => {
            return {
                ...hist,
                result: hist.result ? JSON.parse(hist.result) : {},
                flowData: hist.flowData ? JSON.parse(hist.flowData) : {}
            };
        });
        return upsertHistory;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: upsertHistoryServices.getAllUpsertHistory - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const patchDeleteUpsertHistory = async (ids = [], workspaceId) => {
    try {
        const uniqueIds = [...new Set((ids ?? []).filter((id) => typeof id === 'string' && id.length > 0))];
        if (uniqueIds.length === 0) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Error: upsertHistoryServices.patchDeleteUpsertHistory - ids are required!');
        }
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        let queryRunner;
        try {
            queryRunner = appServer.AppDataSource.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();
            const repo = queryRunner.manager.getRepository(UpsertHistory_1.UpsertHistory);
            const rows = await repo.find({
                where: { id: (0, typeorm_1.In)(uniqueIds) },
                select: ['id', 'chatflowid']
            });
            if (rows.length !== uniqueIds.length) {
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Error: upsertHistoryServices.patchDeleteUpsertHistory - one or more upsert history records were not found!');
            }
            const chatflowIds = [...new Set(rows.map((r) => r.chatflowid))];
            await chatflows_1.default.assertChatflowIdsInWorkspace(chatflowIds, workspaceId, queryRunner);
            const deleteResult = await repo.delete({ id: (0, typeorm_1.In)(uniqueIds) });
            await queryRunner.commitTransaction();
            return deleteResult;
        }
        catch (error) {
            if (queryRunner?.isTransactionActive)
                await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            if (queryRunner && !queryRunner.isReleased)
                await queryRunner.release();
        }
    }
    catch (error) {
        if (error instanceof internalAccelanceError_1.InternalAccelanceError) {
            throw error;
        }
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: upsertHistoryServices.patchDeleteUpsertHistory - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
exports.default = {
    getAllUpsertHistory,
    patchDeleteUpsertHistory
};
//# sourceMappingURL=index.js.map