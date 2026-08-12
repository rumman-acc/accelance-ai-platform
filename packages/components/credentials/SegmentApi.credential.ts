import { INodeParams, INodeCredential } from '../src/Interface'

class SegmentApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'Segment API'
        this.name = 'segmentApi'
        this.version = 1.0
        this.description =
            'Refer to <a target="_blank" href="https://segment.com/docs/connections/find-writekey/">official guide</a> on how to get a Write Key from Segment Source Settings → API Keys'
        this.inputs = [
            {
                label: 'Write Key',
                name: 'writeKey',
                type: 'password',
                placeholder: '<SEGMENT_WRITE_KEY>'
            }
        ]
    }
}

module.exports = { credClass: SegmentApi }
