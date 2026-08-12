import { INodeParams, INodeCredential } from '../src/Interface'

class IntercomApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'Intercom API'
        this.name = 'intercomApi'
        this.version = 1.0
        this.description =
            'Access Token from a custom app in <a target="_blank" href="https://developers.intercom.com/docs/build-an-integration/learn-more/authentication">Intercom\'s developer hub</a>'
        this.inputs = [
            {
                label: 'Access Token',
                name: 'accessToken',
                type: 'password',
                placeholder: '<INTERCOM_ACCESS_TOKEN>'
            }
        ]
    }
}

module.exports = { credClass: IntercomApi }
