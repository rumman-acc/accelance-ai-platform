import { INodeParams, INodeCredential } from '../src/Interface'

class SentryApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'Sentry API'
        this.name = 'sentryApi'
        this.version = 1.0
        this.description =
            'A Sentry user auth token. Refer to <a target="_blank" href="https://docs.sentry.io/api/auth/">Sentry API auth docs</a> to create one.'
        this.inputs = [
            {
                label: 'Auth Token',
                name: 'sentryAuthToken',
                type: 'password',
                placeholder: '<SENTRY_AUTH_TOKEN>'
            }
        ]
    }
}

module.exports = { credClass: SentryApi }
