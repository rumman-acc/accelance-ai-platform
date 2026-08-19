"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const organization_controller_1 = require("../controllers/organization.controller");
const router = express_1.default.Router();
const organizationController = new organization_controller_1.OrganizationController();
router.get('/', organizationController.read);
router.post('/', organizationController.create);
router.put('/', organizationController.update);
router.get('/additional-seats-quantity', organizationController.getAdditionalSeatsQuantity);
router.get('/customer-default-source', organizationController.getCustomerWithDefaultSource);
router.get('/additional-seats-proration', organizationController.getAdditionalSeatsProration);
router.post('/update-additional-seats', organizationController.updateAdditionalSeats);
router.get('/plan-proration', organizationController.getPlanProration);
router.post('/update-subscription-plan', organizationController.updateSubscriptionPlan);
router.get('/get-current-usage', organizationController.getCurrentUsage);
exports.default = router;
//# sourceMappingURL=organization.route.js.map