import { INodeParams, INodeCredential } from '../src/Interface'

class BoxApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'Box API'
        this.name = 'boxApi'
        this.version = 1.0
        this.description =
            'Generate a developer token from the <a target="_blank" href="https://app.box.com/developers/console">Box Developer Console</a>, or use an access token from a Box custom app'
        this.inputs = [
            {
                label: 'Access Token',
                name: 'accessToken',
                type: 'password',
                placeholder: '<BOX_ACCESS_TOKEN>'
            }
        ]
    }
}

module.exports = { credClass: BoxApi }
