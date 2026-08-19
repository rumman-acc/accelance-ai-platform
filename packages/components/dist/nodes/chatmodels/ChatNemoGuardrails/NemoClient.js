"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NemoClient = exports.ClientConfig = void 0;
const messages_1 = require("@langchain/core/messages");
class ClientConfig {
    constructor(baseUrl, configurationId) {
        this.baseUrl = baseUrl;
        this.configurationId = configurationId;
    }
}
exports.ClientConfig = ClientConfig;
class NemoClient {
    constructor(baseUrl, configurationId) {
        this.config = new ClientConfig(baseUrl, configurationId);
    }
    getRoleFromMessage(message) {
        if (message instanceof messages_1.HumanMessage || message instanceof messages_1.SystemMessage) {
            return 'user';
        }
        //AIMessage, ToolMessage, FunctionMessage
        return 'assistant';
    }
    getContentFromMessage(message) {
        return message.content.toString();
    }
    buildBody(messages, configurationId) {
        const bodyMessages = messages.map((message) => {
            return {
                role: this.getRoleFromMessage(message),
                content: this.getContentFromMessage(message)
            };
        });
        const body = {
            config_id: configurationId,
            messages: bodyMessages
        };
        return body;
    }
    async chat(messages) {
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        const body = this.buildBody(messages, this.config.configurationId);
        const requestOptions = {
            method: 'POST',
            body: JSON.stringify(body),
            headers: headers
        };
        return await fetch(`${this.config.baseUrl}/v1/chat/completions`, requestOptions)
            .then((response) => response.json())
            .then((body) => body.messages.map((message) => new messages_1.AIMessage(message.content)));
    }
}
exports.NemoClient = NemoClient;
//# sourceMappingURL=NemoClient.js.map