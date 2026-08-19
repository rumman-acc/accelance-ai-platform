"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const nvidia_nim_1 = __importDefault(require("../../controllers/nvidia-nim"));
const router = express_1.default.Router();
// READ
router.get('/preload', nvidia_nim_1.default.preload);
router.get('/get-token', nvidia_nim_1.default.getToken);
router.get('/download-installer', nvidia_nim_1.default.downloadInstaller);
router.get('/list-running-containers', nvidia_nim_1.default.listRunningContainers);
router.post('/pull-image', nvidia_nim_1.default.pullImage);
router.post('/start-container', nvidia_nim_1.default.startContainer);
router.post('/stop-container', nvidia_nim_1.default.stopContainer);
router.post('/get-image', nvidia_nim_1.default.getImage);
router.post('/get-container', nvidia_nim_1.default.getContainer);
exports.default = router;
//# sourceMappingURL=index.js.map