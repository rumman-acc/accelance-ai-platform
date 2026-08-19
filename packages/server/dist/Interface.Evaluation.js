"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluatorDTO = exports.EvaluationStatus = void 0;
// Evaluation Related Interfaces
const Evaluator_1 = require("./database/entities/Evaluator");
const stripProtectedFields_1 = require("./utils/stripProtectedFields");
var EvaluationStatus;
(function (EvaluationStatus) {
    EvaluationStatus["PENDING"] = "pending";
    EvaluationStatus["COMPLETED"] = "completed";
    EvaluationStatus["ERROR"] = "error";
})(EvaluationStatus || (exports.EvaluationStatus = EvaluationStatus = {}));
class EvaluatorDTO {
    static toEntity(body) {
        const newDs = new Evaluator_1.Evaluator();
        Object.assign(newDs, (0, stripProtectedFields_1.stripProtectedFields)(body));
        let config = {};
        if (body.type === 'llm') {
            config = {
                prompt: body.prompt,
                outputSchema: body.outputSchema
            };
        }
        else if (body.type === 'text') {
            config = {
                operator: body.operator,
                value: body.value
            };
        }
        else if (body.type === 'json') {
            config = {
                operator: body.operator
            };
        }
        else if (body.type === 'numeric') {
            config = {
                operator: body.operator,
                value: body.value,
                measure: body.measure
            };
        }
        else {
            throw new Error('Invalid evaluator type');
        }
        newDs.config = JSON.stringify(config);
        return newDs;
    }
    static fromEntity(entity) {
        const newDs = new EvaluatorDTO();
        Object.assign(newDs, entity);
        const config = JSON.parse(entity.config);
        if (entity.type === 'llm') {
            newDs.prompt = config.prompt;
            newDs.outputSchema = config.outputSchema;
        }
        else if (entity.type === 'text') {
            newDs.operator = config.operator;
            newDs.value = config.value;
        }
        else if (entity.type === 'json') {
            newDs.operator = config.operator;
            newDs.value = config.value;
        }
        else if (entity.type === 'numeric') {
            newDs.operator = config.operator;
            newDs.value = config.value;
            newDs.measure = config.measure;
        }
        delete newDs.config;
        return newDs;
    }
    static fromEntities(entities) {
        return entities.map((entity) => this.fromEntity(entity));
    }
}
exports.EvaluatorDTO = EvaluatorDTO;
//# sourceMappingURL=Interface.Evaluation.js.map