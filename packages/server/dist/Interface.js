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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomMcpServerTransportType = exports.CustomMcpServerAuthType = exports.CustomMcpServerStatus = exports.UserPlan = exports.Platform = exports.ChatMessageRatingType = exports.ChatType = exports.MODE = void 0;
var MODE;
(function (MODE) {
    MODE["QUEUE"] = "queue";
    MODE["MAIN"] = "main";
})(MODE || (exports.MODE = MODE = {}));
var ChatType;
(function (ChatType) {
    ChatType["INTERNAL"] = "INTERNAL";
    ChatType["EXTERNAL"] = "EXTERNAL";
    ChatType["EVALUATION"] = "EVALUATION";
    ChatType["MCP"] = "MCP";
    ChatType["SCHEDULED"] = "SCHEDULED";
    ChatType["WEBHOOK"] = "WEBHOOK";
})(ChatType || (exports.ChatType = ChatType = {}));
var ChatMessageRatingType;
(function (ChatMessageRatingType) {
    ChatMessageRatingType["THUMBS_UP"] = "THUMBS_UP";
    ChatMessageRatingType["THUMBS_DOWN"] = "THUMBS_DOWN";
})(ChatMessageRatingType || (exports.ChatMessageRatingType = ChatMessageRatingType = {}));
var Platform;
(function (Platform) {
    Platform["OPEN_SOURCE"] = "open source";
    Platform["CLOUD"] = "cloud";
    Platform["ENTERPRISE"] = "enterprise";
})(Platform || (exports.Platform = Platform = {}));
var UserPlan;
(function (UserPlan) {
    UserPlan["STARTER"] = "STARTER";
    UserPlan["PRO"] = "PRO";
    UserPlan["FREE"] = "FREE";
})(UserPlan || (exports.UserPlan = UserPlan = {}));
var CustomMcpServerStatus;
(function (CustomMcpServerStatus) {
    CustomMcpServerStatus["PENDING"] = "PENDING";
    CustomMcpServerStatus["AUTHORIZED"] = "AUTHORIZED";
    CustomMcpServerStatus["ERROR"] = "ERROR";
})(CustomMcpServerStatus || (exports.CustomMcpServerStatus = CustomMcpServerStatus = {}));
var CustomMcpServerAuthType;
(function (CustomMcpServerAuthType) {
    CustomMcpServerAuthType["NONE"] = "NONE";
    CustomMcpServerAuthType["CUSTOM_HEADERS"] = "CUSTOM_HEADERS";
})(CustomMcpServerAuthType || (exports.CustomMcpServerAuthType = CustomMcpServerAuthType = {}));
var CustomMcpServerTransportType;
(function (CustomMcpServerTransportType) {
    CustomMcpServerTransportType["URL"] = "url";
    CustomMcpServerTransportType["STDIO"] = "stdio";
})(CustomMcpServerTransportType || (exports.CustomMcpServerTransportType = CustomMcpServerTransportType = {}));
// DocumentStore related
__exportStar(require("./Interface.DocumentStore"), exports);
// Evaluations related
__exportStar(require("./Interface.Evaluation"), exports);
//# sourceMappingURL=Interface.js.map