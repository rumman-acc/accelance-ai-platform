import express from 'express'
import guardrailsController from '../../controllers/guardrails'
import { checkPermission } from '../../enterprise/rbac/PermissionCheck'
const router = express.Router()

// POST /catalog (custom-catalog authoring) removed per Guardrails v2 §2.2 -- see
// controllers/guardrails/index.ts for why GET/POST/DELETE /policy are kept.
router.get('/catalog', checkPermission('guardrails:view'), guardrailsController.listCatalog)
// Phase 3 authoring -- new surface, not a resurrection of the removed POST /catalog (that was
// custom-CATALOG-ITEM authoring under the old model; this creates a real GuardrailDefinition
// row under the new one). See controllers/guardrails/index.ts's createDefinition doc comment.
router.post('/definitions', checkPermission('guardrails:manage'), guardrailsController.createDefinition)
router.post('/definitions/dry-run', checkPermission('guardrails:manage'), guardrailsController.dryRunDefinition)
router.get('/verdicts', checkPermission('guardrails:view'), guardrailsController.listVerdicts)
router.get('/policy', checkPermission('guardrails:view'), guardrailsController.listPolicies)
router.post('/policy', checkPermission('guardrails:manage'), guardrailsController.upsertPolicy)
router.delete('/policy/:id', checkPermission('guardrails:manage'), guardrailsController.deletePolicy)
router.get('/summary/:chatflowId', checkPermission('guardrails:view'), guardrailsController.getSummary)

export default router
