"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appConfig = void 0;
exports.appConfig = {
    showCommunityNodes: process.env.SHOW_COMMUNITY_NODES ? process.env.SHOW_COMMUNITY_NODES.toLowerCase() === 'true' : false
    // todo: add more config options here like database, log, storage, credential and allow modification from UI
};
//# sourceMappingURL=AppConfig.js.map