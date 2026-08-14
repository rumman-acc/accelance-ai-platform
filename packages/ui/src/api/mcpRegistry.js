import client from './client'

const searchServers = (query, cursor) => client.get('/mcp-registry/search', { params: { query, cursor } })

const importServer = (body) => client.post('/mcp-registry/import', body)

export default {
    searchServers,
    importServer
}
