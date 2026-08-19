"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const accelance_components_1 = require("accelance-components");
const http_status_codes_1 = require("http-status-codes");
const typeorm_1 = require("typeorm");
const uuid_1 = require("uuid");
const ApiKey_1 = require("../../database/entities/ApiKey");
const Assistant_1 = require("../../database/entities/Assistant");
const ChatFlow_1 = require("../../database/entities/ChatFlow");
const Credential_1 = require("../../database/entities/Credential");
const Dataset_1 = require("../../database/entities/Dataset");
const DatasetRow_1 = require("../../database/entities/DatasetRow");
const Evaluation_1 = require("../../database/entities/Evaluation");
const EvaluationRun_1 = require("../../database/entities/EvaluationRun");
const ControllerServiceUtils_1 = require("../../enterprise/utils/ControllerServiceUtils");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const utils_1 = require("../../errors/utils");
const Interface_1 = require("../../Interface");
const utils_2 = require("../../utils");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const stripProtectedFields_1 = require("../../utils/stripProtectedFields");
const evaluator_1 = __importDefault(require("../evaluator"));
const CostCalculator_1 = require("./CostCalculator");
const EvaluatorRunner_1 = require("./EvaluatorRunner");
const LLMEvaluationRunner_1 = require("./LLMEvaluationRunner");
const runAgain = async (id, baseURL, orgId, workspaceId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const evaluation = await appServer.AppDataSource.getRepository(Evaluation_1.Evaluation).findOneBy({
            id: id,
            workspaceId: workspaceId
        });
        if (!evaluation)
            throw new Error(`Evaluation ${id} not found`);
        const additionalConfig = evaluation.additionalConfig ? JSON.parse(evaluation.additionalConfig) : {};
        const data = {
            chatflowId: evaluation.chatflowId,
            chatflowName: evaluation.chatflowName,
            datasetName: evaluation.datasetName,
            datasetId: evaluation.datasetId,
            evaluationType: evaluation.evaluationType,
            selectedSimpleEvaluators: JSON.stringify(additionalConfig.simpleEvaluators),
            datasetAsOneConversation: additionalConfig.datasetAsOneConversation,
            chatflowType: JSON.stringify(additionalConfig.chatflowTypes ? additionalConfig.chatflowTypes : [])
        };
        data.name = evaluation.name;
        data.workspaceId = evaluation.workspaceId;
        if (evaluation.evaluationType === 'llm') {
            data.selectedLLMEvaluators = JSON.stringify(additionalConfig.lLMEvaluators);
            data.credentialId = additionalConfig.credentialId;
            // this is to preserve backward compatibility for evaluations created before the llm/model options were added
            if (!additionalConfig.credentialId && additionalConfig.llmConfig) {
                data.model = additionalConfig.llmConfig.model;
                data.llm = additionalConfig.llmConfig.llm;
                data.credentialId = additionalConfig.llmConfig.credentialId;
            }
            else {
                data.model = 'gpt-3.5-turbo';
                data.llm = 'OpenAI';
            }
        }
        data.version = true;
        return await createEvaluation(data, baseURL, orgId, workspaceId);
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: EvalsService.runAgain - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const createEvaluation = async (body, baseURL, orgId, workspaceId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const newEval = new Evaluation_1.Evaluation();
        Object.assign(newEval, (0, stripProtectedFields_1.stripProtectedFields)(body));
        newEval.workspaceId = workspaceId;
        newEval.status = Interface_1.EvaluationStatus.PENDING;
        const row = appServer.AppDataSource.getRepository(Evaluation_1.Evaluation).create(newEval);
        row.average_metrics = JSON.stringify({});
        const chatflowTypes = body.chatflowType ? JSON.parse(body.chatflowType) : [];
        if (!Array.isArray(chatflowTypes)) {
            throw new Error('chatflowType must be a valid array');
        }
        const simpleEvaluators = body.selectedSimpleEvaluators && body.selectedSimpleEvaluators.length > 0 ? JSON.parse(body.selectedSimpleEvaluators) : [];
        if (!Array.isArray(simpleEvaluators)) {
            throw new Error('selectedSimpleEvaluators must be a valid array');
        }
        const additionalConfig = {
            chatflowTypes: chatflowTypes,
            datasetAsOneConversation: body.datasetAsOneConversation,
            simpleEvaluators: simpleEvaluators
        };
        if (body.evaluationType === 'llm') {
            const lLMEvaluators = body.selectedLLMEvaluators && body.selectedLLMEvaluators.length > 0 ? JSON.parse(body.selectedLLMEvaluators) : [];
            if (!Array.isArray(lLMEvaluators)) {
                throw new Error('selectedLLMEvaluators must be a valid array');
            }
            additionalConfig.lLMEvaluators = lLMEvaluators;
            additionalConfig.llmConfig = {
                credentialId: body.credentialId,
                llm: body.llm,
                model: body.model
            };
        }
        row.additionalConfig = JSON.stringify(additionalConfig);
        const newEvaluation = await appServer.AppDataSource.getRepository(Evaluation_1.Evaluation).save(row);
        await appServer.telemetry.sendTelemetry('evaluation_created', {
            version: await (0, utils_2.getAppVersion)()
        }, orgId);
        const dataset = await appServer.AppDataSource.getRepository(Dataset_1.Dataset).findOneBy({
            id: body.datasetId,
            workspaceId: workspaceId
        });
        if (!dataset)
            throw new Error(`Dataset ${body.datasetId} not found`);
        const items = await appServer.AppDataSource.getRepository(DatasetRow_1.DatasetRow).find({
            where: { datasetId: dataset.id },
            order: { sequenceNo: 'ASC' }
        });
        dataset.rows = items;
        const data = {
            chatflowId: body.chatflowId,
            dataset: dataset,
            evaluationType: body.evaluationType,
            evaluationId: newEvaluation.id,
            credentialId: body.credentialId
        };
        if (body.datasetAsOneConversation) {
            data.sessionId = (0, uuid_1.v4)();
        }
        // When chatflow has an APIKey
        const apiKeys = [];
        const chatflowIds = JSON.parse(body.chatflowId);
        if (!Array.isArray(chatflowIds)) {
            throw new Error('chatflowId must be a valid array');
        }
        for (let i = 0; i < chatflowIds.length; i++) {
            const chatflowId = chatflowIds[i];
            const cFlow = await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).findOneBy({
                id: chatflowId,
                workspaceId: workspaceId
            });
            if (cFlow && cFlow.apikeyid) {
                const apikeyObj = await appServer.AppDataSource.getRepository(ApiKey_1.ApiKey).findOneBy({
                    id: cFlow.apikeyid
                });
                if (apikeyObj) {
                    apiKeys.push({
                        chatflowId: chatflowId,
                        apiKey: apikeyObj.apiKey
                    });
                }
            }
        }
        if (apiKeys.length > 0) {
            data.apiKeys = apiKeys;
        }
        // save the evaluation with status as pending
        const evalRunner = new accelance_components_1.EvaluationRunner(baseURL);
        if (body.evaluationType === 'llm') {
            const credential = await appServer.AppDataSource.getRepository(Credential_1.Credential).findOneBy({
                id: body.credentialId
            });
            if (!credential)
                throw new Error(`Credential ${body.credentialId} not found`);
        }
        let evalMetrics = { passCount: 0, failCount: 0, errorCount: 0 };
        evalRunner
            .runEvaluations(data)
            .then(async (result) => {
            let totalTime = 0;
            // let us assume that the eval is successful
            let allRowsSuccessful = true;
            try {
                const llmEvaluationRunner = new LLMEvaluationRunner_1.LLMEvaluationRunner();
                for (const resultRow of result.rows) {
                    const metricsArray = [];
                    const actualOutputArray = [];
                    const errorArray = [];
                    for (const evaluationRow of resultRow.evaluations) {
                        if (evaluationRow.status === 'error') {
                            // if a row failed, mark the entire run as failed (error)
                            allRowsSuccessful = false;
                        }
                        actualOutputArray.push(evaluationRow.actualOutput);
                        totalTime += parseFloat(evaluationRow.latency);
                        let metricsObjFromRun = {};
                        let nested_metrics = evaluationRow.nested_metrics;
                        let promptTokens = 0, completionTokens = 0, totalTokens = 0;
                        let inputCost = 0, outputCost = 0, totalCost = 0;
                        if (nested_metrics && nested_metrics.length > 0) {
                            for (let i = 0; i < nested_metrics.length; i++) {
                                const nested_metric = nested_metrics[i];
                                if (nested_metric.model && nested_metric.promptTokens > 0) {
                                    promptTokens += nested_metric.promptTokens;
                                    completionTokens += nested_metric.completionTokens;
                                    totalTokens += nested_metric.totalTokens;
                                    inputCost += nested_metric.cost_values.input_cost;
                                    outputCost += nested_metric.cost_values.output_cost;
                                    totalCost += nested_metric.cost_values.total_cost;
                                    nested_metric['totalCost'] = (0, CostCalculator_1.formatCost)(nested_metric.cost_values.total_cost);
                                    nested_metric['promptCost'] = (0, CostCalculator_1.formatCost)(nested_metric.cost_values.input_cost);
                                    nested_metric['completionCost'] = (0, CostCalculator_1.formatCost)(nested_metric.cost_values.output_cost);
                                }
                            }
                            nested_metrics = nested_metrics.filter((metric) => {
                                return metric.model && metric.provider;
                            });
                        }
                        const metrics = evaluationRow.metrics;
                        if (metrics) {
                            if (nested_metrics && nested_metrics.length > 0) {
                                metrics.push({
                                    promptTokens: promptTokens,
                                    completionTokens: completionTokens,
                                    totalTokens: totalTokens,
                                    totalCost: (0, CostCalculator_1.formatCost)(totalCost),
                                    promptCost: (0, CostCalculator_1.formatCost)(inputCost),
                                    completionCost: (0, CostCalculator_1.formatCost)(outputCost)
                                });
                                metricsObjFromRun.nested_metrics = nested_metrics;
                            }
                            metrics.map((metric) => {
                                if (metric) {
                                    const json = typeof metric === 'object' ? metric : JSON.parse(metric);
                                    Object.getOwnPropertyNames(json).map((key) => {
                                        metricsObjFromRun[key] = json[key];
                                    });
                                }
                            });
                            metricsArray.push(metricsObjFromRun);
                        }
                        errorArray.push(evaluationRow.error);
                    }
                    const newRun = new EvaluationRun_1.EvaluationRun();
                    newRun.evaluationId = newEvaluation.id;
                    newRun.runDate = new Date();
                    newRun.input = resultRow.input;
                    newRun.expectedOutput = resultRow.expectedOutput;
                    newRun.actualOutput = JSON.stringify(actualOutputArray);
                    newRun.errors = JSON.stringify(errorArray);
                    (0, CostCalculator_1.calculateCost)(metricsArray);
                    newRun.metrics = JSON.stringify(metricsArray);
                    const { results, evaluatorMetrics } = await (0, EvaluatorRunner_1.runAdditionalEvaluators)(metricsArray, actualOutputArray, errorArray, additionalConfig.simpleEvaluators, workspaceId);
                    newRun.evaluators = JSON.stringify(results);
                    evalMetrics.passCount += evaluatorMetrics.passCount;
                    evalMetrics.failCount += evaluatorMetrics.failCount;
                    evalMetrics.errorCount += evaluatorMetrics.errorCount;
                    if (body.evaluationType === 'llm') {
                        resultRow.llmConfig = additionalConfig.llmConfig;
                        resultRow.LLMEvaluators = additionalConfig.lLMEvaluators;
                        const llmEvaluatorMap = [];
                        for (let i = 0; i < resultRow.LLMEvaluators.length; i++) {
                            const evaluatorId = resultRow.LLMEvaluators[i];
                            const evaluator = await evaluator_1.default.getEvaluator(evaluatorId, workspaceId);
                            llmEvaluatorMap.push({
                                evaluatorId: evaluatorId,
                                evaluator: evaluator
                            });
                        }
                        // iterate over the actualOutputArray and add the actualOutput to the evaluationLineItem object
                        const resultArray = await llmEvaluationRunner.runLLMEvaluators(resultRow, actualOutputArray, errorArray, llmEvaluatorMap);
                        newRun.llmEvaluators = JSON.stringify(resultArray);
                        const row = appServer.AppDataSource.getRepository(EvaluationRun_1.EvaluationRun).create(newRun);
                        await appServer.AppDataSource.getRepository(EvaluationRun_1.EvaluationRun).save(row);
                    }
                    else {
                        const row = appServer.AppDataSource.getRepository(EvaluationRun_1.EvaluationRun).create(newRun);
                        await appServer.AppDataSource.getRepository(EvaluationRun_1.EvaluationRun).save(row);
                    }
                }
                //update the evaluation with status as completed
                let passPercent = -1;
                if (evalMetrics.passCount + evalMetrics.failCount + evalMetrics.errorCount > 0) {
                    passPercent =
                        (evalMetrics.passCount / (evalMetrics.passCount + evalMetrics.failCount + evalMetrics.errorCount)) * 100;
                }
                appServer.AppDataSource.getRepository(Evaluation_1.Evaluation)
                    .findOneBy({ id: newEvaluation.id })
                    .then((evaluation) => {
                    if (evaluation) {
                        evaluation.status = allRowsSuccessful ? Interface_1.EvaluationStatus.COMPLETED : Interface_1.EvaluationStatus.ERROR;
                        evaluation.average_metrics = JSON.stringify({
                            averageLatency: (totalTime / result.rows.length).toFixed(3),
                            totalRuns: result.rows.length,
                            ...evalMetrics,
                            passPcnt: passPercent.toFixed(2)
                        });
                        appServer.AppDataSource.getRepository(Evaluation_1.Evaluation).save(evaluation);
                    }
                });
            }
            catch (error) {
                //update the evaluation with status as error
                appServer.AppDataSource.getRepository(Evaluation_1.Evaluation)
                    .findOneBy({ id: newEvaluation.id })
                    .then((evaluation) => {
                    if (evaluation) {
                        evaluation.status = Interface_1.EvaluationStatus.ERROR;
                        appServer.AppDataSource.getRepository(Evaluation_1.Evaluation).save(evaluation);
                    }
                });
            }
        })
            .catch((error) => {
            // Handle errors from runEvaluations
            console.error('Error running evaluations:', (0, utils_1.getErrorMessage)(error));
            appServer.AppDataSource.getRepository(Evaluation_1.Evaluation)
                .findOneBy({ id: newEvaluation.id })
                .then((evaluation) => {
                if (evaluation) {
                    evaluation.status = Interface_1.EvaluationStatus.ERROR;
                    evaluation.average_metrics = JSON.stringify({
                        error: (0, utils_1.getErrorMessage)(error)
                    });
                    appServer.AppDataSource.getRepository(Evaluation_1.Evaluation).save(evaluation);
                }
            })
                .catch((dbError) => {
                console.error('Error updating evaluation status:', (0, utils_1.getErrorMessage)(dbError));
            });
        });
        return getAllEvaluations(body.workspaceId);
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: EvalsService.createEvaluation - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const getAllEvaluations = async (workspaceId, page = -1, limit = -1) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        // First, get the count of distinct evaluation names for the total
        // needed as the The getCount() method in TypeORM doesn't respect the GROUP BY clause and will return the total count of records
        const countQuery = appServer.AppDataSource.getRepository(Evaluation_1.Evaluation)
            .createQueryBuilder('ev')
            .select('COUNT(DISTINCT(ev.name))', 'count')
            .where('ev.workspaceId = :workspaceId', { workspaceId: workspaceId });
        const totalResult = await countQuery.getRawOne();
        const total = totalResult ? parseInt(totalResult.count) : 0;
        // Then get the distinct evaluation names with their counts and latest run date
        const namesQueryBuilder = appServer.AppDataSource.getRepository(Evaluation_1.Evaluation)
            .createQueryBuilder('ev')
            .select('DISTINCT(ev.name)', 'name')
            .addSelect('COUNT(ev.name)', 'count')
            .addSelect('MAX(ev.runDate)', 'latestRunDate')
            .andWhere('ev.workspaceId = :workspaceId', { workspaceId: workspaceId })
            .groupBy('ev.name')
            .orderBy('max(ev.runDate)', 'DESC'); // Order by the latest run date
        if (page > 0 && limit > 0) {
            namesQueryBuilder.skip((page - 1) * limit);
            namesQueryBuilder.take(limit);
        }
        const evaluationNames = await namesQueryBuilder.getRawMany();
        // Get all evaluations for all names at once in a single query
        const returnResults = [];
        if (evaluationNames.length > 0) {
            const names = evaluationNames.map((item) => item.name);
            // Fetch all evaluations for these names in a single query
            const allEvaluations = await appServer.AppDataSource.getRepository(Evaluation_1.Evaluation)
                .createQueryBuilder('ev')
                .where('ev.name IN (:...names)', { names })
                .andWhere('ev.workspaceId = :workspaceId', { workspaceId })
                .orderBy('ev.name', 'ASC')
                .addOrderBy('ev.runDate', 'DESC')
                .getMany();
            // Process the results by name
            const evaluationsByName = new Map();
            // Group evaluations by name
            for (const evaluation of allEvaluations) {
                if (!evaluationsByName.has(evaluation.name)) {
                    evaluationsByName.set(evaluation.name, []);
                }
                evaluationsByName.get(evaluation.name).push(evaluation);
            }
            // Process each name's evaluations
            for (const item of evaluationNames) {
                const evaluationsForName = evaluationsByName.get(item.name) || [];
                for (let i = 0; i < evaluationsForName.length; i++) {
                    const evaluation = evaluationsForName[i];
                    evaluation.latestEval = i === 0;
                    evaluation.version = parseInt(item.count) - i;
                    returnResults.push(evaluation);
                }
            }
        }
        if (page > 0 && limit > 0) {
            return {
                total: total,
                data: returnResults
            };
        }
        else {
            return returnResults;
        }
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: EvalsService.getAllEvaluations - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
// Delete evaluation and all rows via id
const deleteEvaluation = async (id, activeWorkspaceId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const evaluationRepo = appServer.AppDataSource.getRepository(Evaluation_1.Evaluation);
        const existing = await evaluationRepo.findOneBy({
            id,
            workspaceId: activeWorkspaceId
        });
        if (!existing) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Evaluation ${id} not found`);
        }
        await appServer.AppDataSource.getRepository(EvaluationRun_1.EvaluationRun).delete({ evaluationId: id });
        await evaluationRepo.delete({ id, workspaceId: activeWorkspaceId });
        const results = await evaluationRepo.findBy((0, ControllerServiceUtils_1.getWorkspaceSearchOptions)(activeWorkspaceId));
        return results;
    }
    catch (error) {
        if (error instanceof internalAccelanceError_1.InternalAccelanceError) {
            throw error;
        }
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: EvalsService.deleteEvaluation - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
// check for outdated evaluations
const isOutdated = async (id, workspaceId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const evaluation = await appServer.AppDataSource.getRepository(Evaluation_1.Evaluation).findOneBy({
            id: id,
            workspaceId: workspaceId
        });
        if (!evaluation)
            throw new Error(`Evaluation ${id} not found`);
        const evaluationRunDate = evaluation.runDate.getTime();
        let isOutdated = false;
        const returnObj = {
            isOutdated: false,
            chatflows: [],
            dataset: '',
            errors: []
        };
        // check if the evaluation is outdated by extracting the runTime and then check with the dataset last updated time as well
        // as the chatflows last updated time. If the evaluation is outdated, then return true else return false
        const dataset = await appServer.AppDataSource.getRepository(Dataset_1.Dataset).findOneBy({
            id: evaluation.datasetId,
            workspaceId: workspaceId
        });
        if (dataset) {
            const datasetLastUpdated = dataset.updatedDate.getTime();
            if (datasetLastUpdated > evaluationRunDate) {
                isOutdated = true;
                returnObj.dataset = dataset;
            }
        }
        else {
            returnObj.errors.push({
                message: `Dataset ${evaluation.datasetName} not found`,
                id: evaluation.datasetId
            });
            isOutdated = true;
        }
        const chatflowIds = evaluation.chatflowId ? JSON.parse(evaluation.chatflowId) : [];
        const chatflowNames = evaluation.chatflowName ? JSON.parse(evaluation.chatflowName) : [];
        const chatflowTypes = evaluation.additionalConfig ? JSON.parse(evaluation.additionalConfig).chatflowTypes : [];
        for (let i = 0; i < chatflowIds.length; i++) {
            // check for backward compatibility, as previous versions did not the types in additionalConfig
            if (chatflowTypes && chatflowTypes.length >= 0) {
                if (chatflowTypes[i] === 'Custom Assistant') {
                    // if the chatflow type is custom assistant, then we should NOT check in the chatflows table
                    continue;
                }
            }
            const chatflow = await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).findOneBy({
                id: chatflowIds[i],
                workspaceId: workspaceId
            });
            if (!chatflow) {
                returnObj.errors.push({
                    message: `Chatflow ${chatflowNames[i]} not found`,
                    id: chatflowIds[i]
                });
                isOutdated = true;
            }
            else {
                const chatflowLastUpdated = chatflow.updatedDate.getTime();
                if (chatflowLastUpdated > evaluationRunDate) {
                    isOutdated = true;
                    returnObj.chatflows.push({
                        chatflowName: chatflowNames[i],
                        chatflowId: chatflowIds[i],
                        chatflowType: chatflow.type === 'AGENTFLOW' ? 'Agentflow v2' : 'Chatflow',
                        isOutdated: true
                    });
                }
            }
        }
        if (chatflowTypes && chatflowTypes.length > 0) {
            for (let i = 0; i < chatflowIds.length; i++) {
                if (chatflowTypes[i] !== 'Custom Assistant') {
                    // if the chatflow type is NOT custom assistant, then bail out for this item
                    continue;
                }
                const assistant = await appServer.AppDataSource.getRepository(Assistant_1.Assistant).findOneBy({
                    id: chatflowIds[i],
                    workspaceId: workspaceId
                });
                if (!assistant) {
                    returnObj.errors.push({
                        message: `Custom Assistant ${chatflowNames[i]} not found`,
                        id: chatflowIds[i]
                    });
                    isOutdated = true;
                }
                else {
                    const chatflowLastUpdated = assistant.updatedDate.getTime();
                    if (chatflowLastUpdated > evaluationRunDate) {
                        isOutdated = true;
                        returnObj.chatflows.push({
                            chatflowName: chatflowNames[i],
                            chatflowId: chatflowIds[i],
                            chatflowType: 'Custom Assistant',
                            isOutdated: true
                        });
                    }
                }
            }
        }
        returnObj.isOutdated = isOutdated;
        return returnObj;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: EvalsService.isOutdated - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const getEvaluation = async (id, workspaceId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const evaluation = await appServer.AppDataSource.getRepository(Evaluation_1.Evaluation).findOneBy({
            id: id,
            workspaceId: workspaceId
        });
        if (!evaluation)
            throw new Error(`Evaluation ${id} not found`);
        const versionCount = await appServer.AppDataSource.getRepository(Evaluation_1.Evaluation).countBy({
            name: evaluation.name
        });
        const items = await appServer.AppDataSource.getRepository(EvaluationRun_1.EvaluationRun).find({
            where: { evaluationId: id }
        });
        const versions = (await getVersions(id, workspaceId)).versions;
        const versionNo = versions.findIndex((version) => version.id === id) + 1;
        return {
            ...evaluation,
            versionCount: versionCount,
            versionNo: versionNo,
            rows: items
        };
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: EvalsService.getEvaluation - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const getVersions = async (id, workspaceId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const evaluation = await appServer.AppDataSource.getRepository(Evaluation_1.Evaluation).findOneBy({
            id: id,
            workspaceId: workspaceId
        });
        if (!evaluation)
            throw new Error(`Evaluation ${id} not found`);
        const versions = await appServer.AppDataSource.getRepository(Evaluation_1.Evaluation).find({
            where: {
                name: evaluation.name
            },
            order: {
                runDate: 'ASC'
            }
        });
        const returnResults = [];
        versions.map((version, index) => {
            returnResults.push({
                id: version.id,
                runDate: version.runDate,
                version: index + 1
            });
        });
        return {
            versions: returnResults
        };
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: EvalsService.getEvaluation - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const patchDeleteEvaluations = async (ids = [], activeWorkspaceId, isDeleteAllVersion) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const evalsToBeDeleted = await appServer.AppDataSource.getRepository(Evaluation_1.Evaluation).find({
            where: {
                id: (0, typeorm_1.In)(ids),
                workspaceId: activeWorkspaceId
            }
        });
        await appServer.AppDataSource.getRepository(Evaluation_1.Evaluation).delete(ids);
        for (const evaluation of evalsToBeDeleted) {
            await appServer.AppDataSource.getRepository(EvaluationRun_1.EvaluationRun).delete({ evaluationId: evaluation.id });
        }
        if (isDeleteAllVersion) {
            for (const evaluation of evalsToBeDeleted) {
                const otherVersionEvals = await appServer.AppDataSource.getRepository(Evaluation_1.Evaluation).find({
                    where: {
                        name: evaluation.name
                    }
                });
                if (otherVersionEvals.length > 0) {
                    await appServer.AppDataSource.getRepository(Evaluation_1.Evaluation).delete([...otherVersionEvals].map((evaluation) => evaluation.id));
                    for (const otherVersionEval of otherVersionEvals) {
                        await appServer.AppDataSource.getRepository(EvaluationRun_1.EvaluationRun).delete({ evaluationId: otherVersionEval.id });
                    }
                }
            }
        }
        const results = await appServer.AppDataSource.getRepository(Evaluation_1.Evaluation).findBy((0, ControllerServiceUtils_1.getWorkspaceSearchOptions)(activeWorkspaceId));
        return results;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: EvalsService.patchDeleteEvaluations - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
exports.default = {
    createEvaluation,
    getAllEvaluations,
    deleteEvaluation,
    getEvaluation,
    isOutdated,
    runAgain,
    getVersions,
    patchDeleteEvaluations
};
//# sourceMappingURL=index.js.map