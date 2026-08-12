import { INodeParams, INodeCredential } from '../src/Interface'

class MixpanelApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'Mixpanel API'
        this.name = 'mixpanelApi'
        this.version = 1.0
        this.description =
            'Refer to <a target="_blank" href="https://help.mixpanel.com/hc/en-us/articles/115004502806">Mixpanel Project Settings &gt; Access Keys &gt; Project Token</a> on how to get your project token'
        this.inputs = [
            {
                label: 'Project Token',
                name: 'projectToken',
                type: 'password',
                placeholder: '<MIXPANEL_PROJECT_TOKEN>'
            }
        ]
    }
}

module.exports = { credClass: MixpanelApi }
