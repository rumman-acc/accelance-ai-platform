import express from 'express'
import guardrailsController from '../../controllers/guardrails'
import { checkPermission } from '../../enterprise/rbac/PermissionCheck'
const router = express.Router()

router.get('/catalog', checkPermission('guardrails:view'), guardrailsController.listCatalog)
router.post('/catalog', checkPermission('guardrails:manage'), guardrailsController.createCustomCatalogItem)
router.get('/policy', checkPermission('guardrails:view'), guardrailsController.listPolicies)
router.post('/policy', checkPermission('guardrails:manage'), guardrailsController.upsertPolicy)
router.delete('/policy/:id', checkPermission('guardrails:manage'), guardrailsController.deletePolicy)
router.get('/summary/:chatflowId', checkPermission('guardrails:view'), guardrailsController.getSummary)

export default router
