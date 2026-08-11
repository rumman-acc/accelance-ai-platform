import { INodeParams, INodeCredential } from '../src/Interface'

class AirtableApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'Airtable API'
        this.name = 'airtableApi'
        this.version = 1.0
        this.description =
            'Personal Access Token created at <a target="_blank" href="https://airtable.com/create/tokens">airtable.com/create/tokens</a>, scoped with data.records:read / data.records:write access on the target base'
        this.inputs = [
            {
                label: 'Personal Access Token',
                name: 'accessToken',
                type: 'password',
                placeholder: '<AIRTABLE_PAT>'
            }
        ]
    }
}

module.exports = { credClass: AirtableApi }
