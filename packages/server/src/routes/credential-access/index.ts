import express from 'express'
import credentialAccessController from '../../controllers/credential-access'
import { checkPermission } from '../../enterprise/rbac/PermissionCheck'
const router = express.Router()

router.get('/:credentialId', checkPermission('credentials:manage-access'), credentialAccessController.listAccess)
router.post('/:credentialId', checkPermission('credentials:manage-access'), credentialAccessController.grantAccess)
router.delete('/:credentialId/:userId', checkPermission('credentials:manage-access'), credentialAccessController.revokeAccess)

export default router
