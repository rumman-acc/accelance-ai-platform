import client from './client'

const getStats = () => client.get('/control-tower/stats')

const getAgentIds = (status) => client.get('/control-tower/agent-ids', { params: { status } })

export default {
    getStats,
    getAgentIds
}
