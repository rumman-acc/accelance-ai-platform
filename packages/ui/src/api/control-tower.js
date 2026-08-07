import client from './client'

const getStats = () => client.get('/control-tower/stats')

export default {
    getStats
}
