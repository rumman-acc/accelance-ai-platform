import { INodeParams, INodeCredential } from '../src/Interface'

class VercelApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'Vercel API'
        this.name = 'vercelApi'
        this.version = 1.0
        this.description =
            'Refer to <a target="_blank" href="https://vercel.com/account/tokens">Vercel Account Settings → Tokens</a> on how to create an API token'
        this.inputs = [
            {
                label: 'API Token',
                name: 'apiToken',
                type: 'password',
                placeholder: '<VERCEL_API_TOKEN>'
            },
            {
                label: 'Team ID',
                name: 'teamId',
                type: 'string',
                placeholder: 'team_xxxxxxxx',
                description: 'leave blank for a personal account',
                optional: true
            }
        ]
    }
}

module.exports = { credClass: VercelApi }
