"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const langchain_1 = require("@stripe/agent-toolkit/langchain");
const utils_1 = require("../../../src/utils");
class StripeTool_Tools {
    constructor() {
        this.label = 'StripeAgentTool';
        this.name = 'stripeAgentTool';
        this.version = 1.0;
        this.type = 'stripeAgentTool';
        this.icon = 'stripe.png';
        this.category = 'Tools';
        this.description = 'Use Stripe Agent function calling for financial transactions';
        this.badge = 'BETA';
        this.inputs = [
            {
                label: 'Payment Links',
                name: 'paymentLinks',
                type: 'multiOptions',
                options: [
                    {
                        label: 'Create',
                        name: 'create'
                    },
                    {
                        label: 'Update',
                        name: 'update'
                    },
                    {
                        label: 'Read',
                        name: 'read'
                    }
                ],
                optional: true,
                additionalParams: true
            },
            {
                label: 'Products',
                name: 'products',
                type: 'multiOptions',
                options: [
                    {
                        label: 'Create',
                        name: 'create'
                    },
                    {
                        label: 'Update',
                        name: 'update'
                    },
                    {
                        label: 'Read',
                        name: 'read'
                    }
                ],
                optional: true,
                additionalParams: true
            },
            {
                label: 'Prices',
                name: 'prices',
                type: 'multiOptions',
                options: [
                    {
                        label: 'Create',
                        name: 'create'
                    },
                    {
                        label: 'Update',
                        name: 'update'
                    },
                    {
                        label: 'Read',
                        name: 'read'
                    }
                ],
                optional: true,
                additionalParams: true
            },
            {
                label: 'Balance',
                name: 'balance',
                type: 'multiOptions',
                options: [
                    {
                        label: 'Create',
                        name: 'create'
                    },
                    {
                        label: 'Update',
                        name: 'update'
                    },
                    {
                        label: 'Read',
                        name: 'read'
                    }
                ],
                optional: true,
                additionalParams: true
            },
            {
                label: 'Invoice Items',
                name: 'invoiceItems',
                type: 'multiOptions',
                options: [
                    {
                        label: 'Create',
                        name: 'create'
                    },
                    {
                        label: 'Update',
                        name: 'update'
                    },
                    {
                        label: 'Read',
                        name: 'read'
                    }
                ],
                optional: true,
                additionalParams: true
            },
            {
                label: 'Invoices',
                name: 'invoices',
                type: 'multiOptions',
                options: [
                    {
                        label: 'Create',
                        name: 'create'
                    },
                    {
                        label: 'Update',
                        name: 'update'
                    },
                    {
                        label: 'Read',
                        name: 'read'
                    }
                ],
                optional: true,
                additionalParams: true
            },
            {
                label: 'Customers',
                name: 'customers',
                type: 'multiOptions',
                options: [
                    {
                        label: 'Create',
                        name: 'create'
                    },
                    {
                        label: 'Update',
                        name: 'update'
                    },
                    {
                        label: 'Read',
                        name: 'read'
                    }
                ],
                optional: true,
                additionalParams: true
            }
        ];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['stripeApi']
        };
        this.baseClasses = [this.type, 'Tool'];
    }
    async init(nodeData, _, options) {
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const stripeApiToken = (0, utils_1.getCredentialParam)('stripeApiToken', credentialData, nodeData);
        const _paymentLinks = nodeData.inputs?.paymentLinks;
        let paymentLinks = (0, utils_1.convertMultiOptionsToStringArray)(_paymentLinks);
        const _products = nodeData.inputs?.products;
        let products = (0, utils_1.convertMultiOptionsToStringArray)(_products);
        const _prices = nodeData.inputs?.prices;
        let prices = (0, utils_1.convertMultiOptionsToStringArray)(_prices);
        const _balance = nodeData.inputs?.balance;
        let balance = (0, utils_1.convertMultiOptionsToStringArray)(_balance);
        const _invoiceItems = nodeData.inputs?.invoiceItems;
        let invoiceItems = (0, utils_1.convertMultiOptionsToStringArray)(_invoiceItems);
        const _invoices = nodeData.inputs?.invoices;
        let invoices = (0, utils_1.convertMultiOptionsToStringArray)(_invoices);
        const _customers = nodeData.inputs?.customers;
        let customers = (0, utils_1.convertMultiOptionsToStringArray)(_customers);
        const actionObj = {};
        if (paymentLinks.length > 0) {
            actionObj['paymentLinks'] = {};
            if (paymentLinks.includes('create'))
                actionObj['paymentLinks'].create = true;
            if (paymentLinks.includes('read'))
                actionObj['paymentLinks'].read = true;
            if (paymentLinks.includes('update'))
                actionObj['paymentLinks'].update = true;
        }
        if (products.length > 0) {
            actionObj['products'] = {};
            if (products.includes('create'))
                actionObj['products'].create = true;
            if (products.includes('read'))
                actionObj['products'].read = true;
            if (products.includes('update'))
                actionObj['products'].update = true;
        }
        if (prices.length > 0) {
            actionObj['prices'] = {};
            if (prices.includes('create'))
                actionObj['prices'].create = true;
            if (prices.includes('read'))
                actionObj['prices'].read = true;
            if (prices.includes('update'))
                actionObj['prices'].update = true;
        }
        if (balance.length > 0) {
            actionObj['balance'] = {};
            if (balance.includes('create'))
                actionObj['balance'].create = true;
            if (balance.includes('read'))
                actionObj['balance'].read = true;
            if (balance.includes('update'))
                actionObj['balance'].update = true;
        }
        if (invoiceItems.length > 0) {
            actionObj['invoiceItems'] = {};
            if (invoiceItems.includes('create'))
                actionObj['invoiceItems'].create = true;
            if (invoiceItems.includes('read'))
                actionObj['invoiceItems'].read = true;
            if (invoiceItems.includes('update'))
                actionObj['invoiceItems'].update = true;
        }
        if (invoices.length > 0) {
            actionObj['invoices'] = {};
            if (invoices.includes('create'))
                actionObj['invoices'].create = true;
            if (invoices.includes('read'))
                actionObj['invoices'].read = true;
            if (invoices.includes('update'))
                actionObj['invoices'].update = true;
        }
        if (customers.length > 0) {
            actionObj['customers'] = {};
            if (customers.includes('create'))
                actionObj['customers'].create = true;
            if (customers.includes('read'))
                actionObj['customers'].read = true;
            if (customers.includes('update'))
                actionObj['customers'].update = true;
        }
        const stripeAgentToolkit = new langchain_1.StripeAgentToolkit({
            secretKey: stripeApiToken,
            configuration: {
                actions: actionObj
            }
        });
        const stripeTool = stripeAgentToolkit.getTools();
        for (const tool of stripeTool) {
            // convert tool name into small letter, and space to underscore, ex: Create Payment Link => create_payment_link
            tool.name = tool.name.split(' ').join('_').toLowerCase();
        }
        return stripeTool;
    }
}
module.exports = { nodeClass: StripeTool_Tools };
//# sourceMappingURL=StripeTool.js.map