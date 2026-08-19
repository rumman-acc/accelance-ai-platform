import express from 'express'
import guardrailsController from '../../controllers/guardrails'
import { checkPermission } from '../../enterprise/rbac/PermissionCheck'
const router = express.Router()

// POST /catalog (custom-catalog authoring) removed per Guardrails v2 §2.2 -- see
// controllers/guardrails/index.ts for why GET/POST/DELETE /policy are kept.
router.get('/catalog', checkPermission('guardrails:view'), guardrailsController.listCatalog)
router.get('/policy', checkPermission('guardrails:view'), guardrailsController.listPolicies)
router.post('/policy', checkPermission('guardrails:manage'), guardrailsController.upsertPolicy)
router.delete('/policy/:id', checkPermission('guardrails:manage'), guardrailsController.deletePolicy)
router.get('/summary/:chatflowId', checkPermission('guardrails:view'), guardrailsController.getSummary)

export default router
