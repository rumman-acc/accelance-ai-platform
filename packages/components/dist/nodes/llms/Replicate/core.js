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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Replicate = void 0;
const llms_1 = require("@langchain/core/language_models/llms");
const outputs_1 = require("@langchain/core/outputs");
class Replicate extends llms_1.LLM {
    constructor(fields) {
        super(fields);
        this.lc_serializable = true;
        const apiKey = fields?.apiKey;
        if (!apiKey) {
            throw new Error('Please set the REPLICATE_API_TOKEN');
        }
        this.apiKey = apiKey;
        this.model = fields.model;
        this.input = fields.input ?? {};
        this.promptKey = fields.promptKey;
    }
    _llmType() {
        return 'replicate';
    }
    /** @ignore */
    async _call(prompt, options) {
        const replicate = await this._prepareReplicate();
        const input = await this._getReplicateInput(replicate, prompt);
        const output = await this.caller.callWithOptions({ signal: options.signal }, () => replicate.run(this.model, {
            input
        }));
        if (typeof output === 'string') {
            return output;
        }
        else if (Array.isArray(output)) {
            return output.join('');
        }
        else {
            // Note this is a little odd, but the output format is not consistent
            // across models, so it makes some amount of sense.
            return String(output);
        }
    }
    async *_streamResponseChunks(prompt, options, runManager) {
        const replicate = await this._prepareReplicate();
        const input = await this._getReplicateInput(replicate, prompt);
        const stream = await this.caller.callWithOptions({ signal: options?.signal }, async () => replicate.stream(this.model, {
            input
        }));
        for await (const chunk of stream) {
            if (chunk.event === 'output') {
                yield new outputs_1.GenerationChunk({ text: chunk.data, generationInfo: chunk });
                await runManager?.handleLLMNewToken(chunk.data ?? '');
            }
            // stream is done
            if (chunk.event === 'done')
                yield new outputs_1.GenerationChunk({
                    text: '',
                    generationInfo: { finished: true }
                });
        }
    }
    /** @ignore */
    static async imports() {
        try {
            const { default: Replicate } = await Promise.resolve().then(() => __importStar(require('replicate')));
            return { Replicate };
        }
        catch (e) {
            throw new Error('Please install replicate as a dependency with, e.g. `yarn add replicate`');
        }
    }
    async _prepareReplicate() {
        const imports = await Replicate.imports();
        return new imports.Replicate({
            userAgent: 'flowise',
            auth: this.apiKey
        });
    }
    async _getReplicateInput(replicate, prompt) {
        if (this.promptKey === undefined) {
            const [modelString, versionString] = this.model.split(':');
            if (versionString) {
                const version = await replicate.models.versions.get(modelString.split('/')[0], modelString.split('/')[1], versionString);
                const openapiSchema = version.openapi_schema;
                const inputProperties = openapiSchema?.components?.schemas?.Input?.properties;
                if (inputProperties === undefined) {
                    this.promptKey = 'prompt';
                }
                else {
                    const sortedInputProperties = Object.entries(inputProperties).sort(([_keyA, valueA], [_keyB, valueB]) => {
                        const orderA = valueA['x-order'] || 0;
                        const orderB = valueB['x-order'] || 0;
                        return orderA - orderB;
                    });
                    this.promptKey = sortedInputProperties[0][0] ?? 'prompt';
                }
            }
            else {
                this.promptKey = 'prompt';
            }
        }
        return {
            [this.promptKey]: prompt,
            ...this.input
        };
    }
}
exports.Replicate = Replicate;
//# sourceMappingURL=core.js.map