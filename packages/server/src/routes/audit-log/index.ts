import express from 'express'
import auditLogController from '../../controllers/audit-log'
import { checkPermission } from '../../enterprise/rbac/PermissionCheck'
const router = express.Router()

router.get('/', checkPermission('guardrails:view'), auditLogController.list)

export default router
