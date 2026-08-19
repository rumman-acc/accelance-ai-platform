"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSEStreamer = void 0;
class SSEStreamer {
    constructor() {
        this.clients = new Map();
        // Observers receive a passive copy of every event written for `sourceChatId` — one source,
        // many destinations. Use cases: webhook listener panels watching an in-flight execution,
        // multi-tab chat sync, admin shadowing, test/eval harnesses. Per-replica only — cross-replica
        // fan-out happens upstream by having the observer's replica subscribe to the source chatId itself.
        this.observers = new Map();
        this.heartbeatInterval = null;
    }
    hasClient(chatId) {
        return this.clients.has(chatId);
    }
    /**
     * True when there's either a real client or at least one active observer for this chatId.
     */
    hasClientOrObserver(chatId) {
        return this.clients.has(chatId) || (this.observers.get(chatId)?.size ?? 0) > 0;
    }
    addObserver(sourceChatId, observerId) {
        let set = this.observers.get(sourceChatId);
        if (!set) {
            set = new Set();
            this.observers.set(sourceChatId, set);
        }
        set.add(observerId);
    }
    removeObserver(sourceChatId, observerId) {
        const set = this.observers.get(sourceChatId);
        if (!set)
            return;
        set.delete(observerId);
        if (set.size === 0)
            this.observers.delete(sourceChatId);
    }
    clearObservers(sourceChatId) {
        this.observers.delete(sourceChatId);
    }
    addExternalClient(chatId, res) {
        this.clients.set(chatId, { clientType: 'EXTERNAL', response: res, started: false });
    }
    addClient(chatId, res) {
        this.clients.set(chatId, { clientType: 'INTERNAL', response: res, started: false });
    }
    /**
     * Safely write data to a client's response. If the write fails (e.g., client already disconnected),
     * the client is automatically removed to prevent further writes to a dead connection.
     * Also fans out to any registered observers of `chatId`.
     */
    safeWrite(chatId, data) {
        const client = this.clients.get(chatId);
        let ok = false;
        if (client) {
            try {
                client.response.write(data);
                ok = true;
            }
            catch {
                this.clients.delete(chatId);
            }
        }
        const observerSet = this.observers.get(chatId);
        if (observerSet && observerSet.size > 0) {
            for (const observerId of Array.from(observerSet)) {
                const observer = this.clients.get(observerId);
                if (!observer) {
                    observerSet.delete(observerId);
                    continue;
                }
                try {
                    observer.response.write(data);
                }
                catch {
                    this.clients.delete(observerId);
                    observerSet.delete(observerId);
                }
            }
            if (observerSet.size === 0)
                this.observers.delete(chatId);
        }
        return ok;
    }
    removeClient(chatId) {
        const client = this.clients.get(chatId);
        if (client) {
            try {
                const clientResponse = {
                    event: 'end',
                    data: '[DONE]'
                };
                client.response.write('message:\ndata:' + JSON.stringify(clientResponse) + '\n\n');
                client.response.end();
            }
            catch {
                // Client already disconnected, ignore write errors
            }
            finally {
                this.clients.delete(chatId);
            }
        }
        // Notify any observers that this execution finished, but keep their long-lived
        // connections open for whatever they're observing next. UI transitions in_progress → done → idle.
        const observerSet = this.observers.get(chatId);
        if (observerSet && observerSet.size > 0) {
            for (const observerId of Array.from(observerSet)) {
                const observer = this.clients.get(observerId);
                if (!observer)
                    continue;
                try {
                    const payload = { event: 'executionEnd', data: { chatId } };
                    observer.response.write('message:\ndata:' + JSON.stringify(payload) + '\n\n');
                }
                catch {
                    this.clients.delete(observerId);
                }
            }
            this.observers.delete(chatId);
        }
        // If the removed `chatId` was itself an observer, scrub it from every observer Set that
        // still references it. Otherwise stale references would sit in memory until the next
        // write to each observed chatId organically failed and lazily cleaned them up.
        for (const [sourceId, observerIds] of this.observers) {
            if (observerIds.delete(chatId) && observerIds.size === 0) {
                this.observers.delete(sourceId);
            }
        }
    }
    streamCustomEvent(chatId, eventType, data) {
        const clientResponse = {
            event: eventType,
            data: data
        };
        this.safeWrite(chatId, 'message:\ndata:' + JSON.stringify(clientResponse) + '\n\n');
    }
    streamStartEvent(chatId, data) {
        const client = this.clients.get(chatId);
        // prevent multiple start events being streamed to the client
        if (client && !client.started) {
            const clientResponse = {
                event: 'start',
                data: data
            };
            if (this.safeWrite(chatId, 'message:\ndata:' + JSON.stringify(clientResponse) + '\n\n')) {
                client.started = true;
            }
        }
    }
    streamTokenEvent(chatId, data) {
        const clientResponse = {
            event: 'token',
            data: data
        };
        this.safeWrite(chatId, 'message:\ndata:' + JSON.stringify(clientResponse) + '\n\n');
    }
    streamThinkingEvent(chatId, data, duration) {
        const clientResponse = {
            event: 'thinking',
            data: data,
            duration: duration
        };
        this.safeWrite(chatId, 'message:\ndata:' + JSON.stringify(clientResponse) + '\n\n');
    }
    streamSourceDocumentsEvent(chatId, data) {
        const clientResponse = {
            event: 'sourceDocuments',
            data: data
        };
        this.safeWrite(chatId, 'message:\ndata:' + JSON.stringify(clientResponse) + '\n\n');
    }
    streamArtifactsEvent(chatId, data) {
        const clientResponse = {
            event: 'artifacts',
            data: data
        };
        this.safeWrite(chatId, 'message:\ndata:' + JSON.stringify(clientResponse) + '\n\n');
    }
    streamUsedToolsEvent(chatId, data) {
        const clientResponse = {
            event: 'usedTools',
            data: data
        };
        this.safeWrite(chatId, 'message:\ndata:' + JSON.stringify(clientResponse) + '\n\n');
    }
    streamCalledToolsEvent(chatId, data) {
        const clientResponse = {
            event: 'calledTools',
            data: data
        };
        this.safeWrite(chatId, 'message:\ndata:' + JSON.stringify(clientResponse) + '\n\n');
    }
    streamFileAnnotationsEvent(chatId, data) {
        const clientResponse = {
            event: 'fileAnnotations',
            data: data
        };
        this.safeWrite(chatId, 'message:\ndata:' + JSON.stringify(clientResponse) + '\n\n');
    }
    streamToolEvent(chatId, data) {
        const clientResponse = {
            event: 'tool',
            data: data
        };
        this.safeWrite(chatId, 'message:\ndata:' + JSON.stringify(clientResponse) + '\n\n');
    }
    streamAgentReasoningEvent(chatId, data) {
        const clientResponse = {
            event: 'agentReasoning',
            data: data
        };
        this.safeWrite(chatId, 'message:\ndata:' + JSON.stringify(clientResponse) + '\n\n');
    }
    streamNextAgentEvent(chatId, data) {
        const clientResponse = {
            event: 'nextAgent',
            data: data
        };
        this.safeWrite(chatId, 'message:\ndata:' + JSON.stringify(clientResponse) + '\n\n');
    }
    streamAgentFlowEvent(chatId, data) {
        const clientResponse = {
            event: 'agentFlowEvent',
            data: data
        };
        this.safeWrite(chatId, 'message:\ndata:' + JSON.stringify(clientResponse) + '\n\n');
    }
    streamAgentFlowExecutedDataEvent(chatId, data) {
        const clientResponse = {
            event: 'agentFlowExecutedData',
            data: data
        };
        this.safeWrite(chatId, 'message:\ndata:' + JSON.stringify(clientResponse) + '\n\n');
    }
    streamNextAgentFlowEvent(chatId, data) {
        const clientResponse = {
            event: 'nextAgentFlow',
            data: data
        };
        this.safeWrite(chatId, 'message:\ndata:' + JSON.stringify(clientResponse) + '\n\n');
    }
    streamActionEvent(chatId, data) {
        const clientResponse = {
            event: 'action',
            data: data
        };
        this.safeWrite(chatId, 'message:\ndata:' + JSON.stringify(clientResponse) + '\n\n');
    }
    streamAbortEvent(chatId) {
        const clientResponse = {
            event: 'abort',
            data: '[DONE]'
        };
        this.safeWrite(chatId, 'message:\ndata:' + JSON.stringify(clientResponse) + '\n\n');
    }
    streamEndEvent(_) {
        // placeholder for future use
    }
    streamErrorEvent(chatId, msg) {
        if (msg.includes('401 Incorrect API key provided'))
            msg = '401 Unauthorized – check your API key and ensure it has access to the requested model.';
        const clientResponse = {
            event: 'error',
            data: msg
        };
        this.safeWrite(chatId, 'message:\ndata:' + JSON.stringify(clientResponse) + '\n\n');
    }
    streamMetadataEvent(chatId, apiResponse) {
        const metadataJson = {};
        if (apiResponse.chatId) {
            metadataJson['chatId'] = apiResponse.chatId;
        }
        if (apiResponse.chatMessageId) {
            metadataJson['chatMessageId'] = apiResponse.chatMessageId;
        }
        if (apiResponse.question) {
            metadataJson['question'] = apiResponse.question;
        }
        if (apiResponse.sessionId) {
            metadataJson['sessionId'] = apiResponse.sessionId;
        }
        if (apiResponse.memoryType) {
            metadataJson['memoryType'] = apiResponse.memoryType;
        }
        if (apiResponse.followUpPrompts) {
            metadataJson['followUpPrompts'] =
                typeof apiResponse.followUpPrompts === 'string' ? JSON.parse(apiResponse.followUpPrompts) : apiResponse.followUpPrompts;
        }
        if (apiResponse.flowVariables) {
            metadataJson['flowVariables'] =
                typeof apiResponse.flowVariables === 'string' ? JSON.parse(apiResponse.flowVariables) : apiResponse.flowVariables;
        }
        if (apiResponse.action) {
            metadataJson['action'] = typeof apiResponse.action === 'string' ? JSON.parse(apiResponse.action) : apiResponse.action;
        }
        if (Object.keys(metadataJson).length > 0) {
            this.streamCustomEvent(chatId, 'metadata', metadataJson);
        }
    }
    streamUsageMetadataEvent(chatId, data) {
        const clientResponse = {
            event: 'usageMetadata',
            data: data
        };
        this.safeWrite(chatId, 'message:\ndata:' + JSON.stringify(clientResponse) + '\n\n');
    }
    streamTTSStartEvent(chatId, chatMessageId, format) {
        const clientResponse = {
            event: 'tts_start',
            data: { chatMessageId, format }
        };
        this.safeWrite(chatId, 'message:\ndata:' + JSON.stringify(clientResponse) + '\n\n');
    }
    streamTTSDataEvent(chatId, chatMessageId, audioChunk) {
        const clientResponse = {
            event: 'tts_data',
            data: { chatMessageId, audioChunk }
        };
        this.safeWrite(chatId, 'message:\ndata:' + JSON.stringify(clientResponse) + '\n\n');
    }
    streamTTSEndEvent(chatId, chatMessageId) {
        const clientResponse = {
            event: 'tts_end',
            data: { chatMessageId }
        };
        this.safeWrite(chatId, 'message:\ndata:' + JSON.stringify(clientResponse) + '\n\n');
    }
    streamTTSAbortEvent(chatId, chatMessageId) {
        const client = this.clients.get(chatId);
        if (client) {
            try {
                const clientResponse = {
                    event: 'tts_abort',
                    data: { chatMessageId }
                };
                client.response.write('message:\ndata:' + JSON.stringify(clientResponse) + '\n\n');
                client.response.end();
            }
            catch {
                // Client already disconnected, ignore write errors
            }
            finally {
                this.clients.delete(chatId);
            }
        }
    }
    startHeartbeat(intervalMs = 30_000) {
        this.heartbeatInterval = setInterval(() => {
            for (const chatId of this.clients.keys()) {
                // SSE comment line — ignored by clients but keeps the connection alive through ALB/proxies
                this.safeWrite(chatId, ':heartbeat\n\n');
            }
        }, intervalMs);
    }
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }
}
exports.SSEStreamer = SSEStreamer;
//# sourceMappingURL=SSEStreamer.js.map