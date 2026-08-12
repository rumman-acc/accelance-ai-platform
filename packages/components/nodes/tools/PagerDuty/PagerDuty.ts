import { convertMultiOptionsToStringArray, getCredentialData, getCredentialParam } from '../../../src/utils'
import { createPagerDutyTools } from './core'
import type { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class PagerDuty_Tools implements INode {
    label: string
    name: string
    version: number
    type: string
    icon: string
    category: string
    description: string
    baseClasses: string[]
    credential: INodeParams
    inputs: INodeParams[]

    constructor() {
        this.label = 'PagerDuty'
        this.name = 'pagerdutyTool'
        this.version = 1.0
        this.type = 'PagerDuty'
        this.icon = 'pagerduty.svg'
        this.category = 'Tools'
        this.description = 'Manage PagerDuty incidents and services'
        this.baseClasses = [this.type, 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['pagerdutyApi']
        }
        this.inputs = [
            {
                label: 'Actions',
                name: 'actions',
                type: 'multiOptions',
                options: [
                    {
                        label: 'List Incidents',
                        name: 'list_incidents'
                    },
                    {
                        label: 'Get Incident',
                        name: 'get_incident'
                    },
                    {
                        label: 'Create Incident',
                        name: 'create_incident'
                    },
                    {
                        label: 'Update Incident',
                        name: 'update_incident'
                    },
                    {
                        label: 'List Services',
                        name: 'list_services'
                    }
                ]
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const apiToken = getCredentialParam('apiToken', credentialData, nodeData)

        if (!apiToken) {
            throw new Error('No PagerDuty API token provided')
        }

        const actions = convertMultiOptionsToStringArray(nodeData.inputs?.actions)

        const tools = createPagerDutyTools({
            actions,
            apiToken
        })

        return tools
    }
}

module.exports = { nodeClass: PagerDuty_Tools }
