import express from 'express'
import controlTowerController from '../../controllers/control-tower'
import { checkAnyPermission } from '../../enterprise/rbac/PermissionCheck'
const router = express.Router()

// Reuses the existing executions:view permission — Control Tower is a
// dashboard over the same execution data, not a distinct resource.
router.get('/stats', checkAnyPermission('executions:view'), controlTowerController.getStats)
router.get('/agent-ids', checkAnyPermission('executions:view'), controlTowerController.getAgentIds)

export default router
