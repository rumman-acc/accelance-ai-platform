"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_service_1 = require("./auth.service");
const middleware_1 = require("./middleware");
const router = express_1.default.Router();
router.post('/register', async (req, res) => {
    try {
        const result = await (0, auth_service_1.register)(req.body);
        res.cookie('token', result.token, { httpOnly: true, sameSite: 'lax' });
        return res.json(result);
    }
    catch (err) {
        return res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
    }
});
router.post('/login', async (req, res) => {
    try {
        const result = await (0, auth_service_1.login)(req.body);
        res.cookie('token', result.token, { httpOnly: true, sameSite: 'lax' });
        return res.json(result);
    }
    catch (err) {
        return res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
    }
});
router.post('/logout', (_req, res) => {
    res.clearCookie('token');
    return res.json({ message: 'Logged out' });
});
router.get('/canvas-token', middleware_1.requireAuth, (req, res) => {
    const user = req.jwtUser;
    return res.json((0, auth_service_1.generateCanvasToken)(user));
});
exports.default = router;
//# sourceMappingURL=auth.routes.js.map