"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../src/utils");
class IfElseFunction_Utilities {
    constructor() {
        this.label = 'IfElse Function';
        this.name = 'ifElseFunction';
        this.version = 2.0;
        this.type = 'IfElseFunction';
        this.icon = 'ifelsefunction.svg';
        this.category = 'Utilities';
        this.description = `Split flows based on If Else javascript functions`;
        this.baseClasses = [this.type, 'Utilities'];
        this.tags = ['Utilities'];
        this.inputs = [
            {
                label: 'Input Variables',
                name: 'functionInputVariables',
                description: 'Input variables can be used in the function with prefix $. For example: $var',
                type: 'json',
                optional: true,
                acceptVariable: true,
                list: true
            },
            {
                label: 'IfElse Name',
                name: 'functionName',
                type: 'string',
                optional: true,
                placeholder: 'If Condition Match'
            },
            {
                label: 'If Function',
                name: 'ifFunction',
                description: 'Function must return a value',
                type: 'code',
                rows: 2,
                default: `if ("hello" == "hello") {
    return true;
}`
            },
            {
                label: 'Else Function',
                name: 'elseFunction',
                description: 'Function must return a value',
                type: 'code',
                rows: 2,
                default: `return false;`
            }
        ];
        this.outputs = [
            {
                label: 'True',
                name: 'returnTrue',
                baseClasses: ['string', 'number', 'boolean', 'json', 'array'],
                isAnchor: true
            },
            {
                label: 'False',
                name: 'returnFalse',
                baseClasses: ['string', 'number', 'boolean', 'json', 'array'],
                isAnchor: true
            }
        ];
    }
    async init(nodeData, input, options) {
        const ifFunction = nodeData.inputs?.ifFunction;
        const elseFunction = nodeData.inputs?.elseFunction;
        const functionInputVariablesRaw = nodeData.inputs?.functionInputVariables;
        const appDataSource = options.appDataSource;
        const databaseEntities = options.databaseEntities;
        const variables = await (0, utils_1.getVars)(appDataSource, databaseEntities, nodeData, options);
        const flow = {
            chatflowId: options.chatflowid,
            sessionId: options.sessionId,
            chatId: options.chatId,
            input
        };
        let inputVars = {};
        if (functionInputVariablesRaw) {
            try {
                inputVars =
                    typeof functionInputVariablesRaw === 'object' ? functionInputVariablesRaw : JSON.parse(functionInputVariablesRaw);
            }
            catch (exception) {
                throw new Error("Invalid JSON in the IfElse's Input Variables: " + exception);
            }
        }
        // Some values might be a stringified JSON, parse it
        for (const key in inputVars) {
            let value = inputVars[key];
            if (typeof value === 'string') {
                value = (0, utils_1.handleEscapeCharacters)(value, true);
                if (value.startsWith('{') && value.endsWith('}')) {
                    try {
                        value = JSON.parse(value);
                    }
                    catch (e) {
                        // ignore
                    }
                }
                inputVars[key] = value;
            }
        }
        // Create additional sandbox variables
        const additionalSandbox = {};
        // Add input variables to sandbox
        if (Object.keys(inputVars).length) {
            for (const item in inputVars) {
                additionalSandbox[`$${item}`] = inputVars[item];
            }
        }
        const sandbox = (0, utils_1.createCodeExecutionSandbox)(input, variables, flow, additionalSandbox);
        try {
            const responseTrue = await (0, utils_1.executeJavaScriptCode)(ifFunction, sandbox);
            if (responseTrue)
                return { output: typeof responseTrue === 'string' ? (0, utils_1.handleEscapeCharacters)(responseTrue, false) : responseTrue, type: true };
            const responseFalse = await (0, utils_1.executeJavaScriptCode)(elseFunction, sandbox);
            return { output: typeof responseFalse === 'string' ? (0, utils_1.handleEscapeCharacters)(responseFalse, false) : responseFalse, type: false };
        }
        catch (e) {
            throw new Error(e);
        }
    }
}
module.exports = { nodeClass: IfElseFunction_Utilities };
//# sourceMappingURL=IfElseFunction.js.map