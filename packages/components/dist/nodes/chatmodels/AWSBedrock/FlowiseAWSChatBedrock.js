"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BedrockChat = void 0;
const aws_1 = require("@langchain/aws");
const utils_1 = require("./utils");
class BedrockChat extends aws_1.ChatBedrockConverse {
    constructor(id, fields, stopSeqUnsupported) {
        super(fields);
        this.id = id;
        this.configuredModel = fields?.model || '';
        this.configuredMaxToken = fields?.maxTokens;
        this.stopSeqUnsupported = stopSeqUnsupported ?? new Set();
    }
    /**
     * Strips stopSequences for models that don't support it.
     * Models are identified by exact ID from models.json (`stop_sequences: false`),
     * not by provider prefix, to avoid silently stripping from future models that
     * may add support.
     */
    invocationParams(options) {
        const params = super.invocationParams(options);
        const modelId = this.model ?? this.configuredModel;
        if (this.stopSeqUnsupported.has(modelId)) {
            if (params.inferenceConfig) {
                delete params.inferenceConfig.stopSequences;
            }
        }
        return params;
    }
    isTemperatureDeprecatedError(err) {
        return err instanceof Error && err.message.includes('temperature') && err.message.includes('deprecated');
    }
    disableTemperature() {
        this.temperature = undefined;
    }
    async _generate(messages, options, runManager) {
        try {
            return await super._generate(messages, options, runManager);
        }
        catch (err) {
            if (this.isTemperatureDeprecatedError(err)) {
                this.disableTemperature();
                return await super._generate(messages, options, runManager);
            }
            throw (0, utils_1.normalizeBedrockError)(err);
        }
    }
    async *_streamResponseChunks(messages, options, runManager) {
        try {
            yield* super._streamResponseChunks(messages, options, runManager);
        }
        catch (err) {
            if (this.isTemperatureDeprecatedError(err)) {
                this.disableTemperature();
                yield* super._streamResponseChunks(messages, options, runManager);
                return;
            }
            throw (0, utils_1.normalizeBedrockError)(err);
        }
    }
    setMultiModalOption(multiModalOption) {
        this.multiModalOption = multiModalOption;
    }
}
exports.BedrockChat = BedrockChat;
//# sourceMappingURL=FlowiseAWSChatBedrock.js.map