"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
const memory_1 = require("@langchain/classic/memory");
const messages_1 = require("@langchain/core/messages");
const utils_1 = require("../../../src/utils");
const Interface_1 = require("../../../src/Interface");
// TODO: Add ability to specify env variable and use singleton pattern (i.e initialize MongoDB on server and pass to component)
class MongoDB_Memory {
    constructor() {
        this.label = 'MongoDB Atlas Chat Memory';
        this.name = 'MongoDBAtlasChatMemory';
        this.version = 1.0;
        this.type = 'MongoDBAtlasChatMemory';
        this.icon = 'mongodb.svg';
        this.category = 'Memory';
        this.description = 'Stores the conversation in MongoDB Atlas';
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(memory_1.BufferMemory)];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['mongoDBUrlApi']
        };
        this.inputs = [
            {
                label: 'Database',
                name: 'databaseName',
                placeholder: '<DB_NAME>',
                type: 'string'
            },
            {
                label: 'Collection Name',
                name: 'collectionName',
                placeholder: '<COLLECTION_NAME>',
                type: 'string'
            },
            {
                label: 'Session Id',
                name: 'sessionId',
                type: 'string',
                description: 'If not specified, a random id will be used. Learn <a target="_blank" href="https://docs.flowiseai.com/memory/long-term-memory#ui-and-embedded-chat">more</a>',
                default: '',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Memory Key',
                name: 'memoryKey',
                type: 'string',
                default: 'chat_history',
                additionalParams: true
            }
        ];
    }
    async init(nodeData, _, options) {
        return initializeMongoDB(nodeData, options);
    }
}
const initializeMongoDB = async (nodeData, options) => {
    const databaseName = nodeData.inputs?.databaseName;
    const collectionName = nodeData.inputs?.collectionName;
    const memoryKey = nodeData.inputs?.memoryKey;
    const sessionId = nodeData.inputs?.sessionId;
    const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
    const mongoDBConnectUrl = (0, utils_1.getCredentialParam)('mongoDBConnectUrl', credentialData, nodeData);
    const driverInfo = { name: 'Flowise', version: (await (0, utils_1.getVersion)()).version };
    const orgId = options.orgId;
    return new BufferMemoryExtended({
        memoryKey: memoryKey ?? 'chat_history',
        sessionId,
        orgId,
        mongoConnection: {
            databaseName,
            collectionName,
            mongoDBConnectUrl,
            driverInfo
        }
    });
};
class BufferMemoryExtended extends Interface_1.FlowiseMemory {
    constructor(fields) {
        super(fields);
        this.sessionId = '';
        this.orgId = '';
        this.sessionId = fields.sessionId;
        this.orgId = fields.orgId;
        this.mongoConnection = fields.mongoConnection;
    }
    async getChatMessages(overrideSessionId = '', returnBaseMessages = false, prependMessages) {
        const client = new mongodb_1.MongoClient(this.mongoConnection.mongoDBConnectUrl, { driverInfo: this.mongoConnection.driverInfo });
        const collection = client.db(this.mongoConnection.databaseName).collection(this.mongoConnection.collectionName);
        const id = overrideSessionId ? overrideSessionId : this.sessionId;
        const document = await collection.findOne({ sessionId: id });
        const messages = document?.messages || [];
        const baseMessages = messages.map(messages_1.mapStoredMessageToChatMessage);
        if (prependMessages?.length) {
            baseMessages.unshift(...(await (0, utils_1.mapChatMessageToBaseMessage)(prependMessages, this.orgId)));
        }
        await client.close();
        return returnBaseMessages ? baseMessages : (0, utils_1.convertBaseMessagetoIMessage)(baseMessages);
    }
    async addChatMessages(msgArray, overrideSessionId = '') {
        const client = new mongodb_1.MongoClient(this.mongoConnection.mongoDBConnectUrl, { driverInfo: this.mongoConnection.driverInfo });
        const collection = client.db(this.mongoConnection.databaseName).collection(this.mongoConnection.collectionName);
        const id = overrideSessionId ? overrideSessionId : this.sessionId;
        const input = msgArray.find((msg) => msg.type === 'userMessage');
        const output = msgArray.find((msg) => msg.type === 'apiMessage');
        if (input) {
            const newInputMessage = new messages_1.HumanMessage(input.text);
            const messageToAdd = [newInputMessage].map((msg) => ({
                ...msg.toDict(),
                timestamp: new Date() // Add timestamp to the message
            }));
            await collection.updateOne({ sessionId: id }, {
                $push: { messages: { $each: messageToAdd } }
            }, { upsert: true });
        }
        if (output) {
            const newOutputMessage = new messages_1.AIMessage(output.text);
            const messageToAdd = [newOutputMessage].map((msg) => ({
                ...msg.toDict(),
                timestamp: new Date() // Add timestamp to the message
            }));
            await collection.updateOne({ sessionId: id }, {
                $push: { messages: { $each: messageToAdd } }
            }, { upsert: true });
        }
        await client.close();
    }
    async clearChatMessages(overrideSessionId = '') {
        const client = new mongodb_1.MongoClient(this.mongoConnection.mongoDBConnectUrl, { driverInfo: this.mongoConnection.driverInfo });
        const collection = client.db(this.mongoConnection.databaseName).collection(this.mongoConnection.collectionName);
        const id = overrideSessionId ? overrideSessionId : this.sessionId;
        await collection.deleteOne({ sessionId: id });
        await this.clear();
        await client.close();
    }
}
module.exports = { nodeClass: MongoDB_Memory };
//# sourceMappingURL=MongoDBMemory.js.map