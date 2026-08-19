"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAnyPermission = exports.checkPermission = void 0;
const Interface_Enterprise_1 = require("../Interface.Enterprise");
// Check if the user has the required permission for a route
const checkPermission = (permission) => {
    return (req, res, next) => {
        const user = req.user;
        // if the user is not logged in, return forbidden
        if (user) {
            if (user.isOrganizationAdmin) {
                return next();
            }
            const permissions = user.permissions;
            if (permissions && permissions.includes(permission)) {
                return next();
            }
        }
        // else throw 403 forbidden error
        return res.status(403).json({ message: Interface_Enterprise_1.ErrorMessage.FORBIDDEN });
    };
};
exports.checkPermission = checkPermission;
// checks for any permission, input is the permissions separated by comma
const checkAnyPermission = (permissionsString) => {
    return (req, res, next) => {
        const user = req.user;
        // if the user is not logged in, return forbidden
        if (user) {
            if (user.isOrganizationAdmin) {
                return next();
            }
            const permissions = user.permissions;
            const permissionIds = permissionsString.split(',');
            if (permissions && permissions.length) {
                // split permissions and check if any of the permissions are present in the user's permissions
                for (let i = 0; i < permissionIds.length; i++) {
                    if (permissions.includes(permissionIds[i])) {
                        return next();
                    }
                }
            }
        }
        // else throw 403 forbidden error
        return res.status(403).json({ message: Interface_Enterprise_1.ErrorMessage.FORBIDDEN });
    };
};
exports.checkAnyPermission = checkAnyPermission;
//# sourceMappingURL=PermissionCheck.js.map