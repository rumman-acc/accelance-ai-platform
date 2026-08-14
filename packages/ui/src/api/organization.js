import client from './client'

const getOrganizationById = (id) => client.get(`/organization?id=${id}`)

const updateOrganizationAnalytic = (body) => client.patch(`/organization/analytic`, body)

export default {
    getOrganizationById,
    updateOrganizationAnalytic
}
