import { INodeParams, INodeCredential } from '../src/Interface'

class DatadogApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'Datadog API'
        this.name = 'datadogApi'
        this.version = 1.0
        this.description =
            'Refer to <a target="_blank" href="https://docs.datadoghq.com/account_management/api-app-keys/">official guide</a> on how to get an API Key and Application Key from Datadog Organization Settings → API Keys / Application Keys'
        this.inputs = [
            {
                label: 'API Key',
                name: 'apiKey',
                type: 'password'
            },
            {
                label: 'Application Key',
                name: 'appKey',
                type: 'password'
            },
            {
                label: 'Site',
                name: 'site',
                type: 'string',
                default: 'datadoghq.com',
                description: "e.g. datadoghq.com, datadoghq.eu, us3.datadoghq.com — matches your Datadog account's region"
            }
        ]
    }
}

module.exports = { credClass: DatadogApi }
