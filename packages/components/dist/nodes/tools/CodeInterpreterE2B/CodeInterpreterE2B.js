"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.E2BTool = void 0;
const utils_1 = require("../../../src/utils");
const tools_1 = require("@langchain/core/tools");
const code_interpreter_1 = require("@e2b/code-interpreter");
const v3_1 = require("zod/v3");
const storageUtils_1 = require("../../../src/storageUtils");
const manager_1 = require("@langchain/core/callbacks/manager");
const agents_1 = require("../../../src/agents");
const DESC = `Evaluates python code in a sandbox environment. \
The environment is long running and exists across multiple executions. \
You must send the whole script every time and print your outputs. \
Script should be pure python code that can be evaluated. \
It should be in python format NOT markdown. \
The code should NOT be wrapped in backticks. \
All python packages including requests, matplotlib, scipy, numpy, pandas, \
etc are available. Create and display chart using "plt.show()".`;
const NAME = 'code_interpreter';
class Code_Interpreter_Tools {
    constructor() {
        this.label = 'Code Interpreter by E2B';
        this.name = 'codeInterpreterE2B';
        this.version = 1.0;
        this.type = 'CodeInterpreter';
        this.icon = 'e2b.png';
        this.category = 'Tools';
        this.description = 'Execute code in a sandbox environment';
        this.baseClasses = [this.type, 'Tool', ...(0, utils_1.getBaseClasses)(E2BTool)];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['E2BApi'],
            optional: true
        };
        this.inputs = [
            {
                label: 'Tool Name',
                name: 'toolName',
                type: 'string',
                description: 'Specify the name of the tool',
                default: 'code_interpreter'
            },
            {
                label: 'Tool Description',
                name: 'toolDesc',
                type: 'string',
                rows: 4,
                description: 'Specify the description of the tool',
                default: DESC
            }
        ];
    }
    async init(nodeData, _, options) {
        const toolDesc = nodeData.inputs?.toolDesc;
        const toolName = nodeData.inputs?.toolName;
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const e2bApiKey = (0, utils_1.getCredentialParam)('e2bApiKey', credentialData, nodeData);
        return await E2BTool.initialize({
            description: toolDesc ?? DESC,
            name: toolName ?? NAME,
            apiKey: e2bApiKey,
            schema: v3_1.z.object({
                input: v3_1.z.string().describe('Python code to be executed in the sandbox environment')
            }),
            chatflowid: options.chatflowid,
            orgId: options.orgId
        });
    }
}
class E2BTool extends tools_1.StructuredTool {
    static lc_name() {
        return 'E2BTool';
    }
    constructor(options) {
        super(options);
        this.name = NAME;
        this.description = DESC;
        this.description = options.description;
        this.name = options.name;
        this.apiKey = options.apiKey;
        this.schema = options.schema;
        this.chatflowid = options.chatflowid;
        this.orgId = options.orgId;
        this.templateCodeInterpreterE2B = options.templateCodeInterpreterE2B;
        this.domainCodeInterpreterE2B = options.domainCodeInterpreterE2B;
    }
    static async initialize(options) {
        return new this({
            name: options.name,
            description: options.description,
            apiKey: options.apiKey,
            schema: options.schema,
            chatflowid: options.chatflowid,
            orgId: options.orgId,
            templateCodeInterpreterE2B: options.templateCodeInterpreterE2B,
            domainCodeInterpreterE2B: options.domainCodeInterpreterE2B
        });
    }
    async call(arg, configArg, tags, flowConfig) {
        const config = (0, manager_1.parseCallbackConfigArg)(configArg);
        if (config.runName === undefined) {
            config.runName = this.name;
        }
        let parsed;
        try {
            parsed = await (0, utils_1.parseWithTypeConversion)(this.schema, arg);
        }
        catch (e) {
            throw new tools_1.ToolInputParsingException(`Received tool input did not match expected schema`, JSON.stringify(arg));
        }
        const callbackManager_ = await manager_1.CallbackManager.configure(config.callbacks, this.callbacks, config.tags || tags, this.tags, config.metadata, this.metadata, { verbose: this.verbose });
        const runManager = await callbackManager_?.handleToolStart(this.toJSON(), typeof parsed === 'string' ? parsed : JSON.stringify(parsed), undefined, undefined, undefined, undefined, config.runName);
        let result;
        try {
            result = await this._call(parsed, runManager, flowConfig);
        }
        catch (e) {
            await runManager?.handleToolError(e);
            throw e;
        }
        if (result && typeof result !== 'string') {
            result = JSON.stringify(result);
        }
        await runManager?.handleToolEnd(result);
        return result;
    }
    // @ts-ignore
    async _call(arg, _, flowConfig) {
        flowConfig = { ...this.flowObj, ...flowConfig };
        try {
            if ('input' in arg) {
                this.instance = await code_interpreter_1.Sandbox.create({ apiKey: this.apiKey });
                const execution = await this.instance.runCode(arg?.input, { language: 'python' });
                const artifacts = [];
                for (const result of execution.results) {
                    for (const key in result) {
                        if (!result[key])
                            continue;
                        if (key === 'png') {
                            //@ts-ignore
                            const pngData = Buffer.from(result.png, 'base64');
                            const filename = `artifact_${Date.now()}.png`;
                            // Don't check storage usage because this is incoming file, and if we throw error, agent will keep on retrying
                            const { path } = await (0, storageUtils_1.addSingleFileToStorage)('image/png', pngData, filename, this.orgId, this.chatflowid, flowConfig.chatId);
                            artifacts.push({ type: 'png', data: path });
                        }
                        else if (key === 'jpeg') {
                            //@ts-ignore
                            const jpegData = Buffer.from(result.jpeg, 'base64');
                            const filename = `artifact_${Date.now()}.jpg`;
                            const { path } = await (0, storageUtils_1.addSingleFileToStorage)('image/jpg', jpegData, filename, this.orgId, this.chatflowid, flowConfig.chatId);
                            artifacts.push({ type: 'jpeg', data: path });
                        }
                        else if (key === 'html' || key === 'markdown' || key === 'latex' || key === 'json' || key === 'javascript') {
                            artifacts.push({ type: key, data: result[key] });
                        } //TODO: support for pdf
                    }
                }
                let output = '';
                if (execution.text)
                    output = execution.text;
                if (!execution.text && execution.logs.stdout.length)
                    output = execution.logs.stdout.join('\n');
                if (execution.error) {
                    return `${execution.error.name}: ${execution.error.value}`;
                }
                return artifacts.length > 0 ? output + agents_1.ARTIFACTS_PREFIX + JSON.stringify(artifacts) : output;
            }
            else {
                return 'No input provided';
            }
        }
        catch (e) {
            if (this.instance)
                this.instance.kill();
            return typeof e === 'string' ? e : JSON.stringify(e, null, 2);
        }
    }
    setFlowObject(flowObj) {
        this.flowObj = flowObj;
    }
}
exports.E2BTool = E2BTool;
module.exports = { nodeClass: Code_Interpreter_Tools };
//# sourceMappingURL=CodeInterpreterE2B.js.map