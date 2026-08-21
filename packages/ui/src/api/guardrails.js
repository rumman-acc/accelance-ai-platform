import client from './client'

// createCustomCatalogItem (POST /catalog) removed per Guardrails v2 §2.2 -- custom-catalog
// authoring is deleted, not deferred. getPolicies/upsertPolicy/deletePolicy are KEPT -- the
// per-agent canvas panel and the /compliance page's data_retention_policy toggle both still
// depend on them for real, currently-working functionality (see
// packages/server/src/services/guardrails/index.ts's file comment).

const getCatalog = () => client.get('/guardrails/catalog')

// Phase 3 authoring -- new surface, not a resurrection of the removed custom-catalog-item POST.
// See packages/server/src/controllers/guardrails/index.ts's createDefinition/dryRunDefinition.
const createDefinition = (body) => client.post('/guardrails/definitions', body)

const dryRunDefinition = (body) => client.post('/guardrails/definitions/dry-run', body)

// Phase 4 -- first read path for GuardrailVerdict. params: {page, limit, chatflowId?}
const listVerdicts = (params) => client.get('/guardrails/verdicts', { params })

const getPolicies = (chatflowId) => client.get('/guardrails/policy', { params: { chatflowId } })

const upsertPolicy = (body) => client.post('/guardrails/policy', body)

const deletePolicy = (id) => client.delete(`/guardrails/policy/${id}`)

const getSummary = (chatflowId) => client.get(`/guardrails/summary/${chatflowId}`)

export default {
    getCatalog,
    createDefinition,
    dryRunDefinition,
    listVerdicts,
    getPolicies,
    upsertPolicy,
    deletePolicy,
    getSummary
}
