"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const org_service_1 = require("./org.service");
const middleware_1 = require("./middleware");
const router = express_1.default.Router();
router.use(middleware_1.requireAuth);
router.post('/invite', async (req, res) => {
    const user = req.jwtUser;
    try {
        const result = await (0, org_service_1.inviteMember)(user, req.body.email);
        return res.json(result);
    }
    catch (err) {
        return res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
    }
});
router.get('/members', async (req, res) => {
    const user = req.jwtUser;
    try {
        const result = await (0, org_service_1.getMembers)(user);
        return res.json(result);
    }
    catch (err) {
        return res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=org.routes.js.map