import client from './client'

const searchActions = (credentialId, query) => client.get('/composio-catalog/search', { params: { credentialId, query } })

const listConnections = (credentialId, appName) => client.get('/composio-catalog/connections', { params: { credentialId, appName } })

const importAction = (body) => client.post('/composio-catalog/import', body)

export default {
    searchActions,
    listConnections,
    importAction
}
