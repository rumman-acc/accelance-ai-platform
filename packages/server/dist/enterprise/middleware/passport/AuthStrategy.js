"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthStrategy = void 0;
const passport_jwt_1 = require("passport-jwt");
const tempTokenUtils_1 = require("../../utils/tempTokenUtils");
const _cookieExtractor = (req) => {
    let jwt = null;
    if (req && req.cookies) {
        jwt = req.cookies['token'];
    }
    return jwt;
};
const getAuthStrategy = (options) => {
    let jwtFromRequest;
    jwtFromRequest = _cookieExtractor;
    const jwtOptions = {
        jwtFromRequest: jwtFromRequest,
        passReqToCallback: true,
        ...options
    };
    const jwtVerify = async (req, payload, done) => {
        try {
            if (!req.user) {
                return done(null, false, 'Unauthorized.');
            }
            const meta = (0, tempTokenUtils_1.decryptToken)(payload.meta);
            if (!meta) {
                return done(null, false, 'Unauthorized.');
            }
            const ids = meta.split(':');
            if (ids.length !== 2 || req.user.id !== ids[0]) {
                return done(null, false, 'Unauthorized.');
            }
            done(null, req.user);
        }
        catch (error) {
            done(error, false);
        }
    };
    return new passport_jwt_1.Strategy(jwtOptions, jwtVerify);
};
exports.getAuthStrategy = getAuthStrategy;
//# sourceMappingURL=AuthStrategy.js.map