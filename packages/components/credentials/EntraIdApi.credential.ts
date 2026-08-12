import { INodeParams, INodeCredential } from '../src/Interface'

class EntraIdApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'Microsoft Entra ID API'
        this.name = 'entraIdApi'
        this.version = 1.0
        this.description =
            'Register an app in <a target="_blank" href="https://portal.azure.com/">Azure Active Directory (Entra ID)</a>, grant it application permissions such as User.ReadWrite.All and Group.ReadWrite.All, and have an admin grant consent to obtain the Tenant ID, Client ID, and Client Secret'
        this.inputs = [
            {
                label: 'Tenant ID',
                name: 'tenantId',
                type: 'string'
            },
            {
                label: 'Client ID',
                name: 'clientId',
                type: 'string'
            },
            {
                label: 'Client Secret',
                name: 'clientSecret',
                type: 'password'
            }
        ]
    }
}

module.exports = { credClass: EntraIdApi }
