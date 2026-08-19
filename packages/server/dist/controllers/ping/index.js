"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getPing = async (req, res, next) => {
    try {
        return res.status(200).send('pong');
    }
    catch (error) {
        next(error);
    }
};
exports.default = {
    getPing
};
//# sourceMappingURL=index.js.map