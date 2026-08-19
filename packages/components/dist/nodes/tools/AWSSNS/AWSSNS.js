"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tools_1 = require("@langchain/core/tools");
const utils_1 = require("../../../src/utils");
const awsToolsUtils_1 = require("../../../src/awsToolsUtils");
const client_sns_1 = require("@aws-sdk/client-sns");
class AWSSNSTool extends tools_1.Tool {
    constructor(snsClient, topicArn) {
        super();
        this.name = 'aws_sns_publish';
        this.description = 'Publishes a message to an AWS SNS topic';
        this.snsClient = snsClient;
        this.topicArn = topicArn;
    }
    async _call(message) {
        try {
            const command = new client_sns_1.PublishCommand({
                TopicArn: this.topicArn,
                Message: message
            });
            const response = await this.snsClient.send(command);
            return `Successfully published message to SNS topic. MessageId: ${response.MessageId}`;
        }
        catch (error) {
            return `Failed to publish message to SNS: ${error}`;
        }
    }
}
class AWSSNS_Tools {
    constructor() {
        //@ts-ignore
        this.loadMethods = {
            listTopics: async (nodeData, options) => {
                try {
                    const credentials = await (0, awsToolsUtils_1.getAWSCredentials)(nodeData, options ?? {});
                    const region = nodeData.inputs?.region || awsToolsUtils_1.DEFAULT_AWS_REGION;
                    const snsClient = new client_sns_1.SNSClient({
                        region: region,
                        credentials: credentials
                    });
                    const command = new client_sns_1.ListTopicsCommand({});
                    const response = await snsClient.send(command);
                    if (!response.Topics || response.Topics.length === 0) {
                        return [
                            {
                                label: 'No topics found',
                                name: 'placeholder',
                                description: 'No SNS topics found in this region'
                            }
                        ];
                    }
                    return response.Topics.map((topic) => {
                        const topicArn = topic.TopicArn || '';
                        const topicName = topicArn.split(':').pop() || topicArn;
                        return {
                            label: topicName,
                            name: topicArn,
                            description: topicArn
                        };
                    });
                }
                catch (error) {
                    console.error('Error loading SNS topics:', error);
                    return [
                        {
                            label: 'AWS Credentials Required',
                            name: 'placeholder',
                            description: 'Enter AWS Access Key ID and Secret Access Key'
                        }
                    ];
                }
            }
        };
        this.label = 'AWS SNS';
        this.name = 'awsSNS';
        this.version = 1.0;
        this.type = 'AWSSNS';
        this.icon = 'awssns.svg';
        this.category = 'Tools';
        this.description = 'Publish messages to AWS SNS topics';
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(AWSSNSTool)];
        this.credential = {
            label: 'AWS Credentials',
            name: 'credential',
            type: 'credential',
            credentialNames: ['awsApi']
        };
        this.inputs = [
            {
                label: 'AWS Region',
                name: 'region',
                type: 'options',
                options: awsToolsUtils_1.AWS_REGIONS,
                default: awsToolsUtils_1.DEFAULT_AWS_REGION,
                description: 'AWS Region where your SNS topics are located'
            },
            {
                label: 'SNS Topic',
                name: 'topicArn',
                type: 'asyncOptions',
                loadMethod: 'listTopics',
                description: 'Select the SNS topic to publish to',
                refresh: true
            }
        ];
    }
    async init(nodeData, _, options) {
        const credentials = await (0, awsToolsUtils_1.getAWSCredentials)(nodeData, options);
        const region = nodeData.inputs?.region || awsToolsUtils_1.DEFAULT_AWS_REGION;
        const topicArn = nodeData.inputs?.topicArn;
        if (!topicArn) {
            throw new Error('SNS Topic ARN is required');
        }
        const snsClient = new client_sns_1.SNSClient({
            region: region,
            credentials: credentials
        });
        return new AWSSNSTool(snsClient, topicArn);
    }
}
module.exports = { nodeClass: AWSSNS_Tools };
//# sourceMappingURL=AWSSNS.js.map