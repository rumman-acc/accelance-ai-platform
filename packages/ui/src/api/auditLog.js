import client from './client'

const getAuditLog = (limit) => client.get('/audit-log', { params: { limit } })

export default {
    getAuditLog
}
