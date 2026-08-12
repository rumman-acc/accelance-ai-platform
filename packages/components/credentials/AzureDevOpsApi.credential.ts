import { INodeParams, INodeCredential } from '../src/Interface'

class AzureDevOpsApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'Azure DevOps API'
        this.name = 'azureDevOpsApi'
        this.version = 1.0
        this.description =
            'Refer to <a target="_blank" href="https://learn.microsoft.com/en-us/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate">official guide</a> on how to create a Personal Access Token from Azure DevOps User Settings'
        this.inputs = [
            {
                label: 'Organization',
                name: 'organization',
                type: 'string',
                placeholder: 'my-org'
            },
            {
                label: 'Personal Access Token',
                name: 'personalAccessToken',
                type: 'password',
                placeholder: '<AZURE_DEVOPS_PERSONAL_ACCESS_TOKEN>'
            }
        ]
    }
}

module.exports = { credClass: AzureDevOpsApi }
