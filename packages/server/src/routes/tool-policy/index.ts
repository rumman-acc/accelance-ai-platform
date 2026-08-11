import express from 'express'
import toolPolicyController from '../../controllers/tool-policy'
import { checkPermission } from '../../enterprise/rbac/PermissionCheck'
const router = express.Router()

router.get('/', checkPermission('tools:manage-policy'), toolPolicyController.listPolicies)
router.post('/', checkPermission('tools:manage-policy'), toolPolicyController.upsertPolicy)
router.delete('/:id', checkPermission('tools:manage-policy'), toolPolicyController.deletePolicy)

export default router
