"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatCost = exports.calculateCost = void 0;
// fractionDigits is the number of digits after the decimal point, for display purposes
const fractionDigits = 2;
// This function calculates the cost of the tokens from a metrics array
const calculateCost = (metricsArray) => {
    for (let i = 0; i < metricsArray.length; i++) {
        const metric = metricsArray[i];
        const model = metric.model;
        if (!model) {
            continue;
        }
        const completionTokens = metric.completionTokens;
        const promptTokens = metric.promptTokens;
        const totalTokens = metric.totalTokens;
        let promptTokensCost = '0';
        let completionTokensCost = '0';
        let totalTokensCost = '0';
        if (metric.cost_values) {
            let costValues = {};
            if (metric.cost_values?.cost_values) {
                costValues = metric.cost_values.cost_values;
            }
            else {
                costValues = metric.cost_values;
            }
            if (costValues.total_cost > 0 && totalTokens) {
                let cost = costValues.total_cost * (totalTokens / 1000);
                totalTokensCost = (0, exports.formatCost)(cost);
            }
            else {
                let totalCost = 0;
                if (promptTokens) {
                    const cost = costValues.input_cost * (promptTokens / 1000);
                    totalCost += cost;
                    promptTokensCost = (0, exports.formatCost)(cost);
                }
                if (completionTokens) {
                    const cost = costValues.output_cost * (completionTokens / 1000);
                    totalCost += cost;
                    completionTokensCost = (0, exports.formatCost)(cost);
                }
                totalTokensCost = (0, exports.formatCost)(totalCost);
            }
        }
        metric['totalCost'] = totalTokensCost;
        metric['promptCost'] = promptTokensCost;
        metric['completionCost'] = completionTokensCost;
    }
};
exports.calculateCost = calculateCost;
const formatCost = (cost) => {
    if (cost == 0) {
        return '$ 0';
    }
    return cost < 0.01 ? '$ <0.01' : '$ ' + cost.toFixed(fractionDigits);
};
exports.formatCost = formatCost;
//# sourceMappingURL=CostCalculator.js.map