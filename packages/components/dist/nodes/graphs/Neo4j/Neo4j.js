"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../src/utils");
const neo4j_graph_1 = require("@langchain/community/graphs/neo4j_graph");
class Neo4j_Graphs {
    constructor() {
        this.label = 'Neo4j';
        this.name = 'Neo4j';
        this.version = 1.0;
        this.type = 'Neo4j';
        this.icon = 'neo4j.svg';
        this.category = 'Graph';
        this.description = 'Connect with Neo4j graph database';
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(neo4j_graph_1.Neo4jGraph)];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['neo4jApi']
        };
        this.inputs = [
            {
                label: 'Database',
                name: 'database',
                type: 'string',
                placeholder: 'neo4j',
                optional: true
            },
            {
                label: 'Timeout (ms)',
                name: 'timeoutMs',
                type: 'number',
                default: 5000,
                optional: true
            },
            {
                label: 'Enhanced Schema',
                name: 'enhancedSchema',
                type: 'boolean',
                default: false,
                optional: true
            }
        ];
    }
    async init(nodeData, _, options) {
        const database = nodeData.inputs?.database;
        const timeoutMs = nodeData.inputs?.timeoutMs;
        const enhancedSchema = nodeData.inputs?.enhancedSchema;
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const neo4jConfig = {
            url: credentialData?.url,
            username: credentialData?.username,
            password: credentialData?.password
        };
        const neo4jGraph = await neo4j_graph_1.Neo4jGraph.initialize({
            ...neo4jConfig,
            ...(database && { database }),
            ...(timeoutMs && { timeoutMs }),
            ...(enhancedSchema && { enhancedSchema })
        });
        return neo4jGraph;
    }
}
module.exports = { nodeClass: Neo4j_Graphs };
//# sourceMappingURL=Neo4j.js.map