import { INodeCredential, INodeParams } from '../src/Interface'

class MoonshotApi implements INodeCredential {
    label: string
    name: string
    version: number
    inputs: INodeParams[]

    constructor() {
        this.label = 'Moonshot AI API'
        this.name = 'moonshotApi'
        this.version = 1.0
        this.inputs = [
            {
                label: 'Moonshot AI API Key',
                name: 'moonshotApiKey',
                type: 'password'
            }
        ]
    }
}

module.exports = { credClass: MoonshotApi }
