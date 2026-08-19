import client from './client'

// createCustomCatalogItem (POST /catalog) removed per Guardrails v2 §2.2 -- custom-catalog
// authoring is deleted, not deferred. getPolicies/upsertPolicy/deletePolicy are KEPT -- the
// per-agent canvas panel and the /compliance page's data_retention_policy toggle both still
// depend on them for real, currently-working functionality (see
// packages/server/src/services/guardrails/index.ts's file comment).

const getCatalog = () => client.get('/guardrails/catalog')

const getPolicies = (chatflowId) => client.get('/guardrails/policy', { params: { chatflowId } })

const upsertPolicy = (body) => client.post('/guardrails/policy', body)

const deletePolicy = (id) => client.delete(`/guardrails/policy/${id}`)

const getSummary = (chatflowId) => client.get(`/guardrails/summary/${chatflowId}`)

export default {
    getCatalog,
    getPolicies,
    upsertPolicy,
    deletePolicy,
    getSummary
}
