import client from './client'

const getCatalog = () => client.get('/guardrails/catalog')

const createCustomCatalogItem = (body) => client.post('/guardrails/catalog', body)

const getPolicies = (chatflowId) => client.get('/guardrails/policy', { params: { chatflowId } })

const upsertPolicy = (body) => client.post('/guardrails/policy', body)

const deletePolicy = (id) => client.delete(`/guardrails/policy/${id}`)

const getSummary = (chatflowId) => client.get(`/guardrails/summary/${chatflowId}`)

export default {
    getCatalog,
    createCustomCatalogItem,
    getPolicies,
    upsertPolicy,
    deletePolicy,
    getSummary
}
