'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const ioredis_1 = require('ioredis')
const memory_1 = require('@langchain/classic/memory')
const messages_1 = require('@langchain/core/messages')
const Interface_1 = require('../../../src/Interface')
const utils_1 = require('../../../src/utils')
class RedisBackedChatMemory_Memory {
    constructor() {
        this.label = 'Redis-Backed Chat Memory'
        this.name = 'RedisBackedChatMemory'
        this.version = 2.0
        this.type = 'RedisBackedChatMemory'
        this.icon = 'redis.svg'
        this.category = 'Memory'
        this.description = 'Summarizes the conversation and stores the memory in Redis server'
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(memory_1.BufferMemory)]
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            optional: true,
            credentialNames: ['redisCacheApi', 'redisCacheUrlApi']
        }
        this.inputs = [
            {
                label: 'Session Id',
                name: 'sessionId',
                type: 'string',
                description:
                    'If not specified, a random id will be used. Learn <a target="_blank" href="https://docs.flowiseai.com/memory/long-term-memory#ui-and-embedded-chat">more</a>',
                default: '',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Session Timeouts',
                name: 'sessionTTL',
                type: 'number',
                description: 'Seconds till a session expires. If not specified, the session will never expire.',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Memory Key',
                name: 'memoryKey',
                type: 'string',
                default: 'chat_history',
                additionalParams: true
            },
            {
                label: 'Window Size',
                name: 'windowSize',
                type: 'number',
                description: 'Window of size k to surface the last k back-and-forth to use as memory.',
                additionalParams: true,
                optional: true
            }
        ]
    }
    async init(nodeData, _, options) {
        return await initializeRedis(nodeData, options)
    }
}
const initializeRedis = async (nodeData, options) => {
    const sessionTTL = nodeData.inputs?.sessionTTL
    const memoryKey = nodeData.inputs?.memoryKey
    const sessionId = nodeData.inputs?.sessionId
    const windowSize = nodeData.inputs?.windowSize
    const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options)
    const redisUrl = (0, utils_1.getCredentialParam)('redisUrl', credentialData, nodeData)
    const orgId = options.orgId
    const redisOptions = redisUrl
        ? redisUrl
        : {
              port: parseInt((0, utils_1.getCredentialParam)('redisCachePort', credentialData, nodeData) || '6379'),
              host: (0, utils_1.getCredentialParam)('redisCacheHost', credentialData, nodeData),
              username: (0, utils_1.getCredentialParam)('redisCacheUser', credentialData, nodeData),
              password: (0, utils_1.getCredentialParam)('redisCachePwd', credentialData, nodeData),
              tls: (0, utils_1.getCredentialParam)('redisCacheSslEnabled', credentialData, nodeData)
                  ? { rejectUnauthorized: false }
                  : undefined
          }
    const memory = new BufferMemoryExtended({
        memoryKey: memoryKey ?? 'chat_history',
        sessionId,
        windowSize,
        sessionTTL,
        redisOptions,
        orgId
    })
    return memory
}
class BufferMemoryExtended extends Interface_1.FlowiseMemory {
    constructor(fields) {
        super(fields)
        this.sessionId = ''
        this.orgId = ''
        this.sessionId = fields.sessionId
        this.windowSize = fields.windowSize
        this.sessionTTL = fields.sessionTTL
        this.orgId = fields.orgId
        this.redisOptions = fields.redisOptions
    }
    async withRedisClient(fn) {
        const client =
            typeof this.redisOptions === 'string'
                ? new ioredis_1.Redis(this.redisOptions, {
                      keepAlive:
                          process.env.REDIS_KEEP_ALIVE && !isNaN(parseInt(process.env.REDIS_KEEP_ALIVE, 10))
                              ? parseInt(process.env.REDIS_KEEP_ALIVE, 10)
                              : undefined
                  })
                : new ioredis_1.Redis({
                      ...this.redisOptions,
                      keepAlive:
                          process.env.REDIS_KEEP_ALIVE && !isNaN(parseInt(process.env.REDIS_KEEP_ALIVE, 10))
                              ? parseInt(process.env.REDIS_KEEP_ALIVE, 10)
                              : undefined
                  })
        try {
            return await fn(client)
        } finally {
            await client.quit()
        }
    }
    async getChatMessages(overrideSessionId = '', returnBaseMessages = false, prependMessages) {
        return this.withRedisClient(async (client) => {
            const id = overrideSessionId ? overrideSessionId : this.sessionId
            const rawStoredMessages = await client.lrange(id, this.windowSize ? this.windowSize * -1 : 0, -1)
            const orderedMessages = rawStoredMessages.reverse().map((message) => JSON.parse(message))
            const baseMessages = orderedMessages.map(messages_1.mapStoredMessageToChatMessage)
            if (prependMessages?.length) {
                baseMessages.unshift(...(await (0, utils_1.mapChatMessageToBaseMessage)(prependMessages, this.orgId)))
            }
            return returnBaseMessages ? baseMessages : (0, utils_1.convertBaseMessagetoIMessage)(baseMessages)
        })
    }
    async addChatMessages(msgArray, overrideSessionId = '') {
        await this.withRedisClient(async (client) => {
            const id = overrideSessionId ? overrideSessionId : this.sessionId
            const input = msgArray.find((msg) => msg.type === 'userMessage')
            const output = msgArray.find((msg) => msg.type === 'apiMessage')
            if (input) {
                const newInputMessage = new messages_1.HumanMessage(input.text)
                const messageToAdd = [newInputMessage].map((msg) => msg.toDict())
                await client.lpush(id, JSON.stringify(messageToAdd[0]))
                if (this.sessionTTL) await client.expire(id, this.sessionTTL)
            }
            if (output) {
                const newOutputMessage = new messages_1.AIMessage(output.text)
                const messageToAdd = [newOutputMessage].map((msg) => msg.toDict())
                await client.lpush(id, JSON.stringify(messageToAdd[0]))
                if (this.sessionTTL) await client.expire(id, this.sessionTTL)
            }
        })
    }
    async clearChatMessages(overrideSessionId = '') {
        await this.withRedisClient(async (client) => {
            const id = overrideSessionId ? overrideSessionId : this.sessionId
            await client.del(id)
            await this.clear()
        })
    }
}
module.exports = { nodeClass: RedisBackedChatMemory_Memory }
//# sourceMappingURL=RedisBackedChatMemory.js.map
