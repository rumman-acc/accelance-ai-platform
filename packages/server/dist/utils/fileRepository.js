"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFlowDataWithFilePaths = exports.containsBase64File = void 0;
const accelance_components_1 = require("accelance-components");
const quotaUsage_1 = require("./quotaUsage");
const containsBase64File = (chatflow) => {
    const parsedFlowData = JSON.parse(chatflow.flowData);
    const re = new RegExp('^data.*;base64', 'i');
    let found = false;
    const nodes = parsedFlowData.nodes;
    for (const node of nodes) {
        if (node.data.category !== 'Document Loaders') {
            continue;
        }
        const inputs = node.data.inputs;
        if (inputs) {
            const keys = Object.getOwnPropertyNames(inputs);
            for (let i = 0; i < keys.length; i++) {
                const input = inputs[keys[i]];
                if (!input) {
                    continue;
                }
                if (typeof input !== 'string') {
                    continue;
                }
                if (input.startsWith('[')) {
                    try {
                        const files = JSON.parse(input);
                        for (let j = 0; j < files.length; j++) {
                            const file = files[j];
                            if (re.test(file)) {
                                found = true;
                                break;
                            }
                        }
                    }
                    catch (e) {
                        continue;
                    }
                }
                if (re.test(input)) {
                    found = true;
                    break;
                }
            }
        }
    }
    return found;
};
exports.containsBase64File = containsBase64File;
const updateFlowDataWithFilePaths = async (chatflowid, flowData, orgId, workspaceId, subscriptionId, usageCacheManager) => {
    try {
        const parsedFlowData = JSON.parse(flowData);
        const re = new RegExp('^data.*;base64', 'i');
        const nodes = parsedFlowData.nodes;
        for (let j = 0; j < nodes.length; j++) {
            const node = nodes[j];
            if (node.data.category !== 'Document Loaders') {
                continue;
            }
            if (node.data.inputs) {
                const inputs = node.data.inputs;
                const keys = Object.getOwnPropertyNames(inputs);
                for (let i = 0; i < keys.length; i++) {
                    const fileNames = [];
                    const key = keys[i];
                    const input = inputs?.[key];
                    if (!input) {
                        continue;
                    }
                    if (typeof input !== 'string') {
                        continue;
                    }
                    if (input.startsWith('[')) {
                        try {
                            const files = JSON.parse(input);
                            for (let j = 0; j < files.length; j++) {
                                const file = files[j];
                                if (re.test(file)) {
                                    await (0, quotaUsage_1.checkStorage)(orgId, subscriptionId, usageCacheManager);
                                    const { path, totalSize } = await (0, accelance_components_1.addBase64FilesToStorage)(file, chatflowid, fileNames, orgId);
                                    node.data.inputs[key] = path;
                                    await (0, quotaUsage_1.updateStorageUsage)(orgId, workspaceId, totalSize, usageCacheManager);
                                }
                            }
                        }
                        catch (e) {
                            continue;
                        }
                    }
                    else if (re.test(input)) {
                        await (0, quotaUsage_1.checkStorage)(orgId, subscriptionId, usageCacheManager);
                        const { path, totalSize } = await (0, accelance_components_1.addBase64FilesToStorage)(input, chatflowid, fileNames, orgId);
                        node.data.inputs[key] = path;
                        await (0, quotaUsage_1.updateStorageUsage)(orgId, workspaceId, totalSize, usageCacheManager);
                    }
                }
            }
        }
        return JSON.stringify(parsedFlowData);
    }
    catch (e) {
        throw new Error(`Error updating flow data with file paths: ${e.message}`);
    }
};
exports.updateFlowDataWithFilePaths = updateFlowDataWithFilePaths;
//# sourceMappingURL=fileRepository.js.map