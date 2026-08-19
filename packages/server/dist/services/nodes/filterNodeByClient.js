"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterNodeByClient = void 0;
// Filter node inputs by client. Params/options with a `client` array that excludes the requesting client are removed. No-ops when client is omitted.
const filterNodeByClient = (node, client) => {
    if (!client || !node.inputs)
        return node;
    const filterParam = (param) => {
        const filtered = { ...param };
        if (filtered.options) {
            filtered.options = filtered.options.filter((opt) => !opt.client || opt.client.includes(client));
        }
        if (filtered.tabs) {
            filtered.tabs = filtered.tabs.filter((t) => !t.client || t.client.includes(client)).map(filterParam);
        }
        if (filtered.array) {
            filtered.array = filtered.array.filter((a) => !a.client || a.client.includes(client)).map(filterParam);
        }
        return filtered;
    };
    const filteredInputs = node.inputs.filter((param) => !param.client || param.client.includes(client)).map(filterParam);
    return { ...node, inputs: filteredInputs };
};
exports.filterNodeByClient = filterNodeByClient;
//# sourceMappingURL=filterNodeByClient.js.map